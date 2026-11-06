import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { validateGtin } from "@/lib/format";
import { requireMarketMember, ServerAuthError } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";
import { parseMeasureFromQuantity, inferCategoryId } from "@/services/productLookup";

export const maxDuration = 60;

export interface ExtractedFlyerItem {
  ean: string;
  name: string;
  brand?: string | null;
  weight?: string | null;
  price: number;
  promo_label?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
}

const FLYER_JSON_SCHEMA = {
  type: "array",
  description:
    "Lista de ofertas reais extraídas do encarte de supermercado com código EAN, validade e preço",
  items: {
    type: "object",
    properties: {
      ean: {
        type: "string",
        description:
          "Código de barras EAN/GTIN numérico impresso no encarte (8 a 14 dígitos)",
      },
      name: {
        type: "string",
        description: "Nome completo do produto conforme impresso no encarte",
      },
      brand: {
        type: "string",
        description: "Marca do produto se estiver visível",
      },
      weight: {
        type: "string",
        description: "Peso, volume ou medida exata (ex: 5 kg, 900 ml, 1 L)",
      },
      price: {
        type: "number",
        description: "Preço numérico em reais (ex: 24.90)",
      },
      promo_label: {
        type: "string",
        description: "Rótulo da oferta se houver (ex: Oferta do Encarte)",
      },
      valid_from: {
        type: "string",
        description:
          "Data de início da validade do encarte em formato ISO 8601 (YYYY-MM-DD) se impressa",
      },
      valid_until: {
        type: "string",
        description:
          "Data final de validade do encarte em formato ISO 8601 (YYYY-MM-DD) se impressa",
      },
    },
    required: ["ean", "name", "price"],
  },
};

export function getCandidateGeminiKeys(): string[] {
  const rawSources = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GOOGLE_API_KEY,
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  ];
  const unique = new Set<string>();
  for (const raw of rawSources) {
    if (!raw) continue;
    const parts = raw
      .split(/[,;\s]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 10);
    for (const part of parts) {
      unique.add(part);
    }
  }
  return Array.from(unique);
}

async function extractFlyerJsonWithMultiKeyFallback(
  candidateKeys: string[],
  base64Data: string,
  mimeType: string
): Promise<{ rawJson: string; usedModel: string } | { error: string }> {
  const promptText =
    "Extraia apenas os produtos reais legíveis neste encarte de supermercado brasileiro que possuam preço numérico claro. Para cada item, informe ean (código de barras numérico se impresso), name, brand, weight, price, promo_label, valid_from e valid_until. Nunca invente produtos que não estejam na imagem.";
  const contentTypePart = mimeType.includes("pdf") ? "document" : "image";
  let lastError = "O modelo não conseguiu extrair dados legíveis deste encarte.";

  for (const apiKey of candidateKeys) {
    const ai = new GoogleGenAI({ apiKey });

    // Tentativa 1: Interactions API com gemini-3.8-flash
    try {
      const interaction = await ai.interactions.create({
        model: "gemini-3.8-flash",
        input: [
          {
            type: "text",
            text: promptText,
          },
          {
            type: contentTypePart,
            data: base64Data,
            mime_type: mimeType,
          },
        ],
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: FLYER_JSON_SCHEMA,
        },
      });

      if (interaction.output_text && interaction.output_text.trim()) {
        return {
          rawJson: interaction.output_text.trim(),
          usedModel: "gemini-3.8-flash",
        };
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    // Tentativa 2: Fallback para generateContent com gemini-2.5-flash na mesma chave
    try {
      const genRes = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: promptText },
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: FLYER_JSON_SCHEMA,
        },
      });

      if (genRes.text && genRes.text.trim()) {
        return {
          rawJson: genRes.text.trim(),
          usedModel: "gemini-2.5-flash",
        };
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return { error: lastError };
}

export async function POST(request: NextRequest) {
  try {
    const candidateKeys = getCandidateGeminiKeys();

    if (candidateKeys.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Extração de encarte indisponível: configure a variável GEMINI_API_KEY no ambiente do servidor.",
          items: [],
        },
        { status: 503 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          error: "Envie o arquivo de encarte via formulário multipart/form-data.",
          items: [],
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const requestedMarketId = formData.get("supermarket_id");

    const { user, supermarketId } = await requireMarketMember(
      request,
      typeof requestedMarketId === "string" ? requestedMarketId : null
    );

    if (!supermarketId) {
      return NextResponse.json(
        {
          success: false,
          error: "Selecione ou vincule um supermercado antes de enviar um encarte.",
          items: [],
        },
        { status: 400 }
      );
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Selecione uma imagem ou PDF válido do encarte.",
          items: [],
        },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "O arquivo do encarte não pode ultrapassar 8 MB.",
          items: [],
        },
        { status: 413 }
      );
    }

    const mimeType = file.type || "image/jpeg";
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${supermarketId}/${Date.now()}-${safeFileName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const db = createServiceRoleClient(user.accessToken);
    let base64Data = fileBuffer.toString("base64");

    // 1) Armazena o encarte no bucket privado 'encartes' (com fallback em memória caso o bucket ainda não exista no banco remoto)
    const { error: uploadErr } = await db.storage
      .from("encartes")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (!uploadErr) {
      // 2) Baixa do bucket privado 'encartes' para processar a partir do Storage
      const { data: downloadedBlob, error: downloadErr } = await db.storage
        .from("encartes")
        .download(storagePath);

      if (!downloadErr && downloadedBlob) {
        const storedBuffer = Buffer.from(await downloadedBlob.arrayBuffer());
        base64Data = storedBuffer.toString("base64");
      }
    }

    const extraction = await extractFlyerJsonWithMultiKeyFallback(
      candidateKeys,
      base64Data,
      mimeType
    );

    if ("error" in extraction) {
      return NextResponse.json(
        {
          success: false,
          error: extraction.error,
          items: [],
        },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(extraction.rawJson) as ExtractedFlyerItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nenhuma oferta com preço legível foi identificada no encarte enviado.",
          items: [],
        },
        { status: 422 }
      );
    }

    const validItems = parsed.filter(
      (item) =>
        item &&
        typeof item.name === "string" &&
        item.name.trim().length >= 2 &&
        typeof item.price === "number" &&
        item.price > 0 &&
        typeof item.ean === "string" &&
        validateGtin(item.ean).valid
    );

    if (validItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Os itens lidos no encarte não possuem código EAN válido (GTIN-8/12/13/14) ou preço positivo. Cadastre pelo código de barras ou planilha CSV.",
          items: [],
        },
        { status: 422 }
      );
    }

    const nowIso = new Date().toISOString();
    const productPayloads: Array<Record<string, unknown>> = [];
    const pricePayloads: Array<Record<string, unknown>> = [];

    for (const item of validItems) {
      const cleanEan = validateGtin(item.ean).normalized;
      const productId = `ean-${cleanEan}`;
      const measure = parseMeasureFromQuantity(item.weight);
      const catId = inferCategoryId(null, item.name);
      const cleanBrand = item.brand?.trim() || null;

      productPayloads.push({
        id: productId,
        ean: cleanEan,
        name: item.name.trim(),
        brand: cleanBrand,
        category: catId,
        size_label: measure.sizeLabel,
        unit_type: measure.unitType,
        unit_value: measure.unitMultiplier,
        image_url: null,
        is_popular: false,
        description: null,
        source: "partner",
        data_status:
          cleanBrand && measure.sizeLabel && catId
            ? "completo"
            : "pendente_revisao",
      });

      const validFromDate =
        item.valid_from && !Number.isNaN(Date.parse(item.valid_from))
          ? new Date(item.valid_from).toISOString()
          : null;
      const validUntilDate =
        item.valid_until && !Number.isNaN(Date.parse(item.valid_until))
          ? new Date(item.valid_until).toISOString()
          : null;

      pricePayloads.push({
        supermarket_id: supermarketId,
        product_id: productId,
        price: Math.round(item.price * 100) / 100,
        is_promo: true,
        promo_label: item.promo_label?.trim() || null,
        in_stock: true,
        source: "flyer_ocr",
        status: "pendente", // Obrigatório: só vira 'publicado' após revisão humana do dono do mercado
        valid_from: validFromDate,
        valid_until: validUntilDate,
        collected_at: nowIso,
        evidence_path: storagePath,
        submitted_by: user.id,
        updated_at: nowIso,
      });
    }

    const { error: prodErr } = await db
      .from("products")
      .upsert(productPayloads, { onConflict: "ean", ignoreDuplicates: true });

    if (prodErr) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao preparar produtos extraídos do encarte: ${prodErr.message}`,
          items: [],
        },
        { status: 500 }
      );
    }

    const { error: priceErr } = await db
      .from("market_prices")
      .upsert(pricePayloads, { onConflict: "supermarket_id,product_id" });

    if (priceErr) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao salvar itens do encarte para revisão: ${priceErr.message}`,
          items: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      model: extraction.usedModel,
      source: "flyer_ocr",
      status: "pendente",
      supermarket_id: supermarketId,
      evidence_path: storagePath,
      count: validItems.length,
      message: `${validItems.length} ofertas extraídas com status pendente de revisão!`,
      items: validItems,
    });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json(
        { success: false, error: err.message, items: [] },
        { status: err.status }
      );
    }
    const message =
      err instanceof Error ? err.message : "Erro ao processar encarte.";
    return NextResponse.json(
      { success: false, error: message, items: [] },
      { status: 500 }
    );
  }
}
