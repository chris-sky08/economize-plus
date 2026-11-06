import { NextRequest, NextResponse } from "next/server";
import { validateGtin } from "@/lib/format";
import { mapDbProductRow } from "@/lib/supabase";
import {
  extractTokenFromRequest,
  requireUser,
  ServerAuthError,
} from "@/lib/server/auth";
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
  const gtin = validateGtin(ean);

  if (!gtin.valid) {
    return NextResponse.json(
      { error: gtin.reason || "Código EAN inválido." },
      { status: 400 }
    );
  }

  const cleanEan = gtin.normalized;
  const token = extractTokenFromRequest(request);

  try {
    const db = createServiceRoleClient(token || undefined);

    // 1) Verifica se já existe no banco e foi consultado há menos de 30 dias
    const { data: existingRow } = await db
      .from("products")
      .select(
        "id, ean, name, brand, category, size_label, unit_type, unit_value, image_url, is_popular, description, source, data_status, off_fetched_at"
      )
      .eq("ean", cleanEan)
      .maybeSingle();

    if (existingRow) {
      const existingProduct = mapDbProductRow(
        existingRow as Record<string, unknown>
      );
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

    // 2) Consulta Open Food Facts Brasil com User-Agent identificado
    const userAgent =
      (process.env.OFF_USER_AGENT || "").trim() ||
      "EconomizePlus/1.0 (https://github.com/chris-sky08/economize-plus; skyleywinfoster@gmail.com)";

    const offRes = await fetch(
      `https://br.openfoodfacts.org/api/v2/product/${encodeURIComponent(
        cleanEan
      )}.json`,
      {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
      }
    );

    if (offRes.status === 429) {
      return NextResponse.json(
        {
          error:
            "Limite temporário de consultas da base Open Food Facts atingido. Tente novamente em instantes.",
        },
        { status: 429 }
      );
    }

    if (offRes.status === 404 || !offRes.ok) {
      return NextResponse.json(
        {
          error: `Produto com EAN ${cleanEan} não encontrado no Open Food Facts.`,
          product: existingRow
            ? mapDbProductRow(existingRow as Record<string, unknown>)
            : null,
        },
        { status: 404 }
      );
    }

    const offData = (await offRes.json()) as OffByEanApiResponse;
    if (!offData.product || offData.status === 0) {
      return NextResponse.json(
        {
          error: `Produto com EAN ${cleanEan} não consta no catálogo Open Food Facts.`,
        },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const mapped = mapOpenFoodFactsRawToProduct(
      { ...offData.product, code: cleanEan },
      nowIso
    );

    if (!mapped) {
      return NextResponse.json(
        {
          error: `Dados incompletos no Open Food Facts para o EAN ${cleanEan}.`,
        },
        { status: 422 }
      );
    }

    const { error: upsertErr } = await db.from("products").upsert(
      {
        id: mapped.id,
        ean: mapped.ean,
        name: mapped.name,
        brand: mapped.brand,
        category: mapped.categoryId,
        size_label: mapped.sizeLabel,
        unit_type: mapped.unitType,
        unit_value: mapped.unitMultiplier,
        image_url: mapped.imageUrl,
        is_popular: mapped.isPopular,
        description: mapped.description,
        source: "open_food_facts",
        data_status: mapped.dataStatus,
        off_fetched_at: nowIso,
      },
      { onConflict: "ean" }
    );

    return NextResponse.json({
      product: mapped,
      cached: false,
      persisted: !upsertErr,
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
  try {
    const authUser = await requireUser(request);
    const { ean } = await context.params;
    const gtin = validateGtin(ean);

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
    const name = (body.name || "").trim();

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Informe o nome do produto para cadastrá-lo." },
        { status: 400 }
      );
    }

    const brand = body.brand?.trim() || null;
    const parsedMeasure = parseMeasureFromQuantity(body.size_label);
    const sizeLabel = body.size_label?.trim() || parsedMeasure.sizeLabel;
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
      body.category?.trim() || inferCategoryId(null, name);

    const dataStatus =
      name && brand && sizeLabel && categoryId
        ? "completo"
        : "pendente_revisao";

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
      image_url: body.image_url?.trim() || null,
      is_popular: true,
      description: body.description?.trim() || null,
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
