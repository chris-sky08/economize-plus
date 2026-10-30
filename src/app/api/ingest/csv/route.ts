import { NextRequest, NextResponse } from "next/server";
import { validateGtin } from "@/lib/format";
import { requireMarketMember, ServerAuthError } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";
import {
  mapOpenFoodFactsRawToProduct,
  OpenFoodFactsProductRaw,
} from "@/services/productLookup";

export interface ParsedCsvRow {
  line: number;
  ean: string;
  nome: string;
  preco: number;
  oferta: boolean;
  promo_label?: string;
}

export interface CsvLineError {
  line: number;
  rawEan?: string;
  reason: string;
}

const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_CSV_LINES = 5000;

/**
 * Parser CSV RFC-4180 com suporte a campos entre aspas, aspas escapadas ("")
 * e detecção automática do delimitador (vírgula ou ponto-e-vírgula).
 */
export function parseCsvLine(line: string, delimiter: "," | ";"): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function detectDelimiter(sampleLine: string): "," | ";" {
  let inQuotes = false;
  let commas = 0;
  let semicolons = 0;
  for (let i = 0; i < sampleLine.length; i++) {
    const ch = sampleLine[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && ch === ",") commas++;
    else if (!inQuotes && ch === ";") semicolons++;
  }
  return semicolons > commas ? ";" : ",";
}

export async function POST(request: NextRequest) {
  try {
    let rawCsv = "";
    let requestedMarketId: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const mkt = formData.get("supermarket_id");
      if (typeof mkt === "string" && mkt.trim()) {
        requestedMarketId = mkt.trim();
      }
      if (file instanceof File) {
        if (file.size > MAX_CSV_BYTES) {
          return NextResponse.json(
            {
              success: false,
              error: "O arquivo CSV excede o tamanho máximo permitido de 2 MB.",
              count: 0,
              items: [],
              lineErrors: [],
            },
            { status: 413 }
          );
        }
        rawCsv = await file.text();
      }
    } else {
      const body = (await request.json()) as {
        csvText?: string;
        supermarket_id?: string;
      };
      rawCsv = body.csvText || "";
      if (body.supermarket_id) {
        requestedMarketId = body.supermarket_id.trim();
      }
      if (Buffer.byteLength(rawCsv, "utf8") > MAX_CSV_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: "O conteúdo CSV excede o limite máximo de 2 MB.",
            count: 0,
            items: [],
            lineErrors: [],
          },
          { status: 413 }
        );
      }
    }

    // Autenticação obrigatória: supermarket_id vem de public.market_members
    const { user, supermarketId } = await requireMarketMember(
      request,
      requestedMarketId
    );

    const allLines = rawCsv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (allLines.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A planilha CSV enviada está vazia.",
          count: 0,
          items: [],
          lineErrors: [],
        },
        { status: 400 }
      );
    }

    if (allLines.length > MAX_CSV_LINES) {
      return NextResponse.json(
        {
          success: false,
          error: `A planilha possui ${allLines.length} linhas, acima do limite máximo de ${MAX_CSV_LINES} linhas por envio.`,
          count: 0,
          items: [],
          lineErrors: [],
        },
        { status: 413 }
      );
    }

    const delimiter = detectDelimiter(allLines[0]);
    const validRowsByEan = new Map<string, ParsedCsvRow>();
    const lineErrors: CsvLineError[] = [];

    for (let i = 0; i < allLines.length; i++) {
      const lineNumber = i + 1;
      const line = allLines[i];

      if (i === 0 && /ean/i.test(line) && /pre[cç]o|nome/i.test(line)) {
        continue;
      }

      const parts = parseCsvLine(line, delimiter);
      if (parts.length < 3) {
        lineErrors.push({
          line: lineNumber,
          reason:
            "Formato inválido: esperado ao menos 3 colunas (ean,nome,preco[,oferta]).",
        });
        continue;
      }

      const [rawEan, rawNome, rawPreco, rawOferta] = parts;
      const gtin = validateGtin(rawEan || "");
      if (!gtin.valid) {
        lineErrors.push({
          line: lineNumber,
          rawEan,
          reason: gtin.reason || "Código EAN inválido.",
        });
        continue;
      }

      const nome = (rawNome || "").trim();
      if (nome.length < 2) {
        lineErrors.push({
          line: lineNumber,
          rawEan: gtin.normalized,
          reason: "Nome do produto ausente ou muito curto.",
        });
        continue;
      }

      const preco = parseFloat((rawPreco || "").replace(",", "."));
      if (Number.isNaN(preco) || preco <= 0) {
        lineErrors.push({
          line: lineNumber,
          rawEan: gtin.normalized,
          reason: "O preço deve ser um número positivo maior que R$ 0,00.",
        });
        continue;
      }

      const isOferta =
        /^(true|1|sim|s|oferta|promo)$/i.test(rawOferta || "") ||
        Boolean(
          rawOferta &&
            rawOferta.length > 2 &&
            !/^(false|0|nao|não)$/i.test(rawOferta)
        );

      const promoLabel =
        rawOferta && !/^(true|false|1|0|sim|nao|não)$/i.test(rawOferta)
          ? rawOferta
          : undefined;

      validRowsByEan.set(gtin.normalized, {
        line: lineNumber,
        ean: gtin.normalized,
        nome,
        preco: Math.round(preco * 100) / 100,
        oferta: isOferta,
        promo_label: promoLabel,
      });
    }

    const parsedRows = Array.from(validRowsByEan.values());
    if (parsedRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nenhuma linha válida encontrada na planilha. Verifique os erros por linha.",
          count: 0,
          items: [],
          lineErrors,
        },
        { status: 422 }
      );
    }

    const db = createServiceRoleClient();
    const eanList = parsedRows.map((r) => r.ean);

    // Consulta produtos já cadastrados no banco
    const { data: existingProducts, error: selectErr } = await db
      .from("products")
      .select("id, ean")
      .in("ean", eanList);

    if (selectErr) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao consultar catálogo de produtos no banco: ${selectErr.message}`,
          count: 0,
          items: [],
          lineErrors,
        },
        { status: 500 }
      );
    }

    const existingByEan = new Map<string, string>();
    for (const row of existingProducts || []) {
      if (row.ean && row.id) {
        existingByEan.set(String(row.ean), String(row.id));
      }
    }

    const unknownRows = parsedRows.filter((r) => !existingByEan.has(r.ean));
    const nowIso = new Date().toISOString();
    const newProductPayloads: Array<Record<string, unknown>> = [];

    const userAgent =
      (process.env.OFF_USER_AGENT || "").trim() ||
      "EconomizePlus/1.0 (https://github.com/chris-sky08/economize-plus; skyleywinfoster@gmail.com)";

    // Tenta enriquecer até 10 EANs novos via Open Food Facts no servidor; os demais entram com data_status 'pendente_revisao' e campos nulos honestos
    for (let idx = 0; idx < unknownRows.length; idx++) {
      const row = unknownRows[idx];
      const productId = `ean-${row.ean}`;
      let enriched = false;

      if (idx < 10) {
        try {
          const offRes = await fetch(
            `https://br.openfoodfacts.org/api/v2/product/${encodeURIComponent(
              row.ean
            )}.json`,
            {
              headers: {
                "User-Agent": userAgent,
                Accept: "application/json",
              },
            }
          );
          if (offRes.ok) {
            const offJson = (await offRes.json()) as {
              status?: number;
              product?: OpenFoodFactsProductRaw;
            };
            if (offJson.product && offJson.status !== 0) {
              const mapped = mapOpenFoodFactsRawToProduct(
                { ...offJson.product, code: row.ean },
                nowIso
              );
              if (mapped) {
                newProductPayloads.push({
                  id: productId,
                  ean: row.ean,
                  name: mapped.name || row.nome,
                  brand: mapped.brand,
                  category: mapped.categoryId,
                  size_label: mapped.sizeLabel,
                  unit_type: mapped.unitType,
                  unit_value: mapped.unitMultiplier,
                  image_url: mapped.imageUrl,
                  is_popular: false,
                  description: mapped.description,
                  source: "open_food_facts",
                  data_status: mapped.dataStatus,
                  off_fetched_at: nowIso,
                });
                enriched = true;
              }
            }
          }
        } catch {
          // Segue para cadastro pendente_revisao sem inventar dados
        }
      }

      if (!enriched) {
        newProductPayloads.push({
          id: productId,
          ean: row.ean,
          name: row.nome,
          brand: null,
          category: null,
          size_label: null,
          unit_type: null,
          unit_value: null,
          image_url: null,
          is_popular: false,
          description: null,
          source: "partner",
          data_status: "pendente_revisao",
          off_fetched_at: null,
        });
      }

      existingByEan.set(row.ean, productId);
    }

    if (newProductPayloads.length > 0) {
      const { error: prodInsertErr } = await db
        .from("products")
        .upsert(newProductPayloads, { onConflict: "ean" });

      if (prodInsertErr) {
        return NextResponse.json(
          {
            success: false,
            error: `Falha ao registrar novos produtos no catálogo: ${prodInsertErr.message}`,
            count: 0,
            items: [],
            lineErrors,
          },
          { status: 500 }
        );
      }
    }

    const pricePayloads = parsedRows.map((row) => ({
      supermarket_id: supermarketId,
      product_id: existingByEan.get(row.ean) || `ean-${row.ean}`,
      price: row.preco,
      is_promo: row.oferta,
      promo_label: row.promo_label || null,
      in_stock: true,
      source: "partner_csv",
      status: "publicado",
      collected_at: nowIso,
      submitted_by: user.id,
      reviewed_by: user.id,
      reviewed_at: nowIso,
      updated_at: nowIso,
    }));

    const { error: priceUpsertErr } = await db
      .from("market_prices")
      .upsert(pricePayloads, { onConflict: "supermarket_id,product_id" });

    if (priceUpsertErr) {
      return NextResponse.json(
        {
          success: false,
          error: `O banco de dados recusou a gravação dos preços: ${priceUpsertErr.message}`,
          count: 0,
          items: [],
          lineErrors,
        },
        { status: 500 }
      );
    }

    await db
      .from("supermarkets")
      .update({ updated_at: nowIso })
      .eq("id", supermarketId);

    return NextResponse.json({
      success: true,
      source: "partner_csv",
      supermarket_id: supermarketId,
      count: parsedRows.length,
      items: parsedRows,
      lineErrors,
    });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: err.message,
          count: 0,
          items: [],
          lineErrors: [],
        },
        { status: err.status }
      );
    }
    const message =
      err instanceof Error ? err.message : "Falha ao processar arquivo CSV.";
    return NextResponse.json(
      {
        success: false,
        error: message,
        count: 0,
        items: [],
        lineErrors: [],
      },
      { status: 500 }
    );
  }
}
