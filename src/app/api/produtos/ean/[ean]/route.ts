import { NextRequest, NextResponse } from "next/server";
import { mapDbProductRow } from "@/lib/supabase";
import {
  extractTokenFromRequest,
  requireUser,
  ServerAuthError,
} from "@/lib/server/auth";
import {
  sanitizeText,
  validateGtinEan,
  validateSafeHttpUrl,
  validateSameOrigin,
} from "@/lib/server/security";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";
import { checkRateLimit } from "@/lib/server/rateLimit";
import {
  inferCategoryId,
  mapOpenFoodFactsRawToProduct,
  OpenFoodFactsProductRaw,
  parseMeasureFromQuantity,
} from "@/services/productLookup";

interface OffByEanApiResponse {
  status?: number;
  code?: string;
  product?: OpenFoodFactsProductRaw;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ean: string }> }
) {
  const rate = checkRateLimit(request, "off_ean_lookup", 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Muitas consultas em sequência. Aguarde ${rate.retryAfterSeconds}s antes de consultar outro código EAN.`,
      },
      { status: 429 }
    );
  }

  const { ean } = await context.params;
  const gtin = validateGtinEan(ean);

  if (!gtin.valid) {
    return NextResponse.json(
      { error: gtin.reason || "Código EAN inválido." },
      { status: 400 }
    );
  }

  const cleanEan = gtin.normalized;
  const token = extractTokenFromRequest(request);

  let db: ReturnType<typeof createServiceRoleClient> | null = null;
  let existingRow: Record<string, unknown> | null = null;

  try {
    db = createServiceRoleClient(token || undefined);

    // 1) Verifica se já existe no banco e foi consultado há menos de 30 dias (com timeout curto)
    const selectPromise = db
      .from("products")
      .select(
        "id, ean, name, brand, category, size_label, unit_type, unit_value, image_url, is_popular, description, source, data_status, off_fetched_at"
      )
      .eq("ean", cleanEan)
      .maybeSingle();

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 2500)
    );

    const raceResult = await Promise.race([selectPromise, timeoutPromise]);
    if (raceResult && "data" in raceResult && raceResult.data) {
      existingRow = raceResult.data as Record<string, unknown>;
      const existingProduct = mapDbProductRow(existingRow);
      if (existingProduct.offFetchedAt) {
        const fetchedTime = new Date(existingProduct.offFetchedAt).getTime();
        if (
          !Number.isNaN(fetchedTime) &&
          Date.now() - fetchedTime < THIRTY_DAYS_MS
        ) {
          return NextResponse.json({
            product: existingProduct,
            cached: true,
          });
        }
      } else if (existingProduct.dataStatus === "completo") {
        return NextResponse.json({
          product: existingProduct,
          cached: true,
        });
      }
    }
  } catch {
    // Se Supabase estiver sem configuração na Vercel ou hibernado, segue para consulta direta Open Food Facts
    db = null;
  }

  try {
    // 2) Consulta Open Food Facts Brasil (e fallback Global/UPC-A->EAN-13) com User-Agent identificado
    const userAgent =
      (process.env.OFF_USER_AGENT || "").trim() ||
      "EconomizePlus/1.0 (https://github.com/chris-sky08/economize-plus; empresaeconomizemais@gmail.com)";

    const eanCandidates =
      cleanEan.length === 12 ? [cleanEan, `0${cleanEan}`] : [cleanEan];
    const offHosts = [
      "https://br.openfoodfacts.org",
      "https://world.openfoodfacts.org",
    ];

    let rateLimited = false;
    let mappedProduct: ReturnType<typeof mapOpenFoodFactsRawToProduct> = null;
    const nowIso = new Date().toISOString();

    for (const candidateCode of eanCandidates) {
      if (mappedProduct) break;
      for (const host of offHosts) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          const offRes = await fetch(
            `${host}/api/v2/product/${encodeURIComponent(candidateCode)}.json`,
            {
              headers: {
                "User-Agent": userAgent,
                Accept: "application/json",
              },
              signal: controller.signal,
            }
          );
          clearTimeout(timer);

          if (offRes.status === 429) {
            rateLimited = true;
            continue;
          }
          if (!offRes.ok) continue;

          const offData = (await offRes.json()) as OffByEanApiResponse;
          if (!offData.product || offData.status === 0) continue;

          const candidate = mapOpenFoodFactsRawToProduct(
            { ...offData.product, code: candidateCode },
            nowIso
          );
          if (candidate) {
            mappedProduct = candidate;
            break;
          }
        } catch {
          // Tenta próximo host
        }
      }
    }

    if (!mappedProduct) {
      if (rateLimited) {
        return NextResponse.json(
          {
            error:
              "Limite temporário de consultas da base Open Food Facts atingido. Tente novamente em instantes.",
          },
          { status: 429 }
        );
      }

      if (existingRow) {
        return NextResponse.json({
          product: mapDbProductRow(existingRow),
          cached: true,
        });
      }

      return NextResponse.json(
        {
          error: `Produto com EAN ${cleanEan} não consta no catálogo Open Food Facts.`,
        },
        { status: 404 }
      );
    }

    let persisted = false;
    if (db) {
      try {
        const { error: upsertErr } = await db.from("products").upsert(
          {
            id: mappedProduct.id,
            ean: mappedProduct.ean,
            name: mappedProduct.name,
            brand: mappedProduct.brand,
            category: mappedProduct.categoryId,
            size_label: mappedProduct.sizeLabel,
            unit_type: mappedProduct.unitType,
            unit_value: mappedProduct.unitMultiplier,
            image_url: mappedProduct.imageUrl,
            is_popular: mappedProduct.isPopular,
            description: mappedProduct.description,
            source: "open_food_facts",
            data_status: mappedProduct.dataStatus,
            off_fetched_at: nowIso,
          },
          { onConflict: "ean" }
        );
        persisted = !upsertErr;
      } catch {
        persisted = false;
      }
    }

    return NextResponse.json({
      product: mappedProduct,
      cached: false,
      persisted,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Falha ao consultar produto por código de barras.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ ean: string }> }
) {
  const originCheck = validateSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: originCheck.reason || "Requisição bloqueada por proteção CSRF." },
      { status: 403 }
    );
  }

  try {
    const authUser = await requireUser(request);
    const { ean } = await context.params;
    const gtin = validateGtinEan(ean);

    if (!gtin.valid) {
      return NextResponse.json(
        { error: gtin.reason || "Código EAN inválido." },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      brand?: string | null;
      category?: string | null;
      size_label?: string | null;
      unit_type?: "kg" | "L" | "un" | "rolo" | null;
      unit_value?: number | null;
      image_url?: string | null;
      description?: string | null;
    };

    const cleanEan = gtin.normalized;
    const productId = `ean-${cleanEan}`;
    const name = sanitizeText(body.name, 160);

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Informe o nome do produto para cadastrá-lo." },
        { status: 400 }
      );
    }

    const brand = sanitizeText(body.brand, 100) || null;
    const cleanSizeInput = sanitizeText(body.size_label, 60) || null;
    const parsedMeasure = parseMeasureFromQuantity(cleanSizeInput);
    const sizeLabel = cleanSizeInput || parsedMeasure.sizeLabel;
    const unitType =
      body.unit_type === "kg" ||
      body.unit_type === "L" ||
      body.unit_type === "un" ||
      body.unit_type === "rolo"
        ? body.unit_type
        : parsedMeasure.unitType;
    const unitValue =
      typeof body.unit_value === "number" &&
      !Number.isNaN(body.unit_value) &&
      body.unit_value > 0
        ? body.unit_value
        : parsedMeasure.unitMultiplier;
    const categoryId =
      sanitizeText(body.category, 60) || inferCategoryId(null, name);

    const dataStatus =
      name && brand && sizeLabel && categoryId
        ? "completo"
        : "pendente_revisao";

    const safeImageUrl = body.image_url
      ? validateSafeHttpUrl(body.image_url)
      : null;

    const db = createServiceRoleClient(authUser.accessToken);
    const payload = {
      id: productId,
      ean: cleanEan,
      name,
      brand,
      category: categoryId,
      size_label: sizeLabel,
      unit_type: unitType,
      unit_value: unitValue,
      image_url: safeImageUrl,
      is_popular: true,
      description: sanitizeText(body.description, 400) || null,
      source: "partner",
      data_status: dataStatus,
    };

    const { data, error } = await db
      .from("products")
      .upsert(payload, { onConflict: "ean" })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: `Erro ao salvar produto no catálogo: ${
            error?.message || "permissão negada"
          }`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      product: mapDbProductRow(data as Record<string, unknown>),
    });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message =
      err instanceof Error ? err.message : "Erro ao salvar produto por EAN.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
