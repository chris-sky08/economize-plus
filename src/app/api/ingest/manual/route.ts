import { NextRequest, NextResponse } from "next/server";
import { requireMarketMember, ServerAuthError } from "@/lib/server/auth";
import {
  sanitizeText,
  validateGtinEan,
  validateSameOrigin,
} from "@/lib/server/security";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";
import {
  inferCategoryId,
  parseMeasureFromQuantity,
} from "@/services/productLookup";

export async function POST(request: NextRequest) {
  const originCheck = validateSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      {
        success: false,
        error: originCheck.reason || "Requisição bloqueada por proteção CSRF.",
      },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      supermarket_id?: string;
      ean?: string;
      product_id?: string;
      name?: string;
      product_name?: string;
      brand?: string | null;
      size_label?: string | null;
      category?: string | null;
      unit_type?: "kg" | "L" | "un" | "rolo" | null;
      unit_value?: number | null;
      price?: number | string;
      is_promo?: boolean;
      promo_label?: string | null;
      in_stock?: boolean;
      valid_until?: string | null;
    };

    const { user, supermarketId } = await requireMarketMember(
      request,
      body.supermarket_id
    );

    if (!supermarketId) {
      return NextResponse.json(
        {
          success: false,
          error: "Selecione ou vincule um supermercado antes de cadastrar preços.",
        },
        { status: 400 }
      );
    }

    const rawPrice =
      typeof body.price === "number"
        ? body.price
        : parseFloat(String(body.price || "").replace(",", "."));
    if (Number.isNaN(rawPrice) || rawPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "O preço informado deve ser maior que R$ 0,00.",
        },
        { status: 400 }
      );
    }

    const productName = sanitizeText(body.name ?? body.product_name, 160);
    const productBrand = sanitizeText(body.brand, 100) || null;
    const promoLabel = sanitizeText(body.promo_label, 80) || null;
    const sizeLabelRaw = sanitizeText(body.size_label, 60) || null;
    const categoryRaw = sanitizeText(body.category, 60) || null;

    const db = createServiceRoleClient(user.accessToken);
    const nowIso = new Date().toISOString();

    let resolvedProductId = sanitizeText(body.product_id, 80);

    if (body.ean) {
      const gtin = validateGtinEan(body.ean);
      if (!gtin.valid) {
        return NextResponse.json(
          {
            success: false,
            error: gtin.reason || "Código EAN/GTIN inválido.",
          },
          { status: 400 }
        );
      }

      const cleanEan = gtin.normalized;
      resolvedProductId = `ean-${cleanEan}`;

      const { data: existingProd } = await db
        .from("products")
        .select("id, name")
        .eq("ean", cleanEan)
        .maybeSingle();

      if (existingProd?.id) {
        resolvedProductId = String(existingProd.id);
      } else {
        if (productName.length < 2) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Informe um nome válido para o produto (mínimo 2 caracteres).",
            },
            { status: 400 }
          );
        }

        const measure = parseMeasureFromQuantity(sizeLabelRaw);
        const unitType =
          body.unit_type === "kg" ||
          body.unit_type === "L" ||
          body.unit_type === "un" ||
          body.unit_type === "rolo"
            ? body.unit_type
            : measure.unitType;
        const unitValue =
          typeof body.unit_value === "number" &&
          !Number.isNaN(body.unit_value) &&
          body.unit_value > 0
            ? body.unit_value
            : measure.unitMultiplier;
        const finalSizeLabel = sizeLabelRaw || measure.sizeLabel;
        const finalCategory =
          categoryRaw || inferCategoryId(null, productName);

        const { error: prodErr } = await db.from("products").upsert(
          {
            id: resolvedProductId,
            ean: cleanEan,
            name: productName,
            brand: productBrand,
            category: finalCategory,
            size_label: finalSizeLabel,
            unit_type: unitType,
            unit_value: unitValue,
            image_url: null,
            is_popular: false,
            description: null,
            source: "partner",
            data_status:
              productName && productBrand && finalSizeLabel && finalCategory
                ? "completo"
                : "pendente_revisao",
          },
          { onConflict: "ean" }
        );

        if (prodErr) {
          return NextResponse.json(
            {
              success: false,
              error: `Erro ao cadastrar produto: ${prodErr.message}`,
            },
            { status: 500 }
          );
        }
      }
    }

    if (!resolvedProductId) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe o código EAN ou o identificador do produto.",
        },
        { status: 400 }
      );
    }

    const validUntilIso =
      body.valid_until && !Number.isNaN(Date.parse(body.valid_until))
        ? new Date(body.valid_until).toISOString()
        : null;

    const finalPrice = Math.round(rawPrice * 100) / 100;
    const isPromo = Boolean(body.is_promo);

    const { error: priceErr } = await db.from("market_prices").upsert(
      {
        supermarket_id: supermarketId,
        product_id: resolvedProductId,
        price: finalPrice,
        is_promo: isPromo,
        promo_label: isPromo ? promoLabel : null,
        in_stock: body.in_stock !== false,
        source: "partner_manual",
        status: "publicado",
        valid_until: validUntilIso,
        collected_at: nowIso,
        submitted_by: user.id,
        reviewed_by: user.id,
        reviewed_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "supermarket_id,product_id" }
    );

    if (priceErr) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao gravar preço manual: ${priceErr.message}`,
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
      supermarket_id: supermarketId,
      product_id: resolvedProductId,
      price: finalPrice,
      source: "partner_manual",
      collected_at: nowIso,
    });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.status }
      );
    }
    const message =
      err instanceof Error ? err.message : "Erro ao registrar preço manual.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
