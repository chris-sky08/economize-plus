import { NextRequest, NextResponse } from "next/server";
import { validateGtin } from "@/lib/format";
import { requireAdmin, ServerAuthError } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";
import {
  inferCategoryId,
  parseMeasureFromQuantity,
} from "@/services/productLookup";

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);

    const formData = await request.formData();
    const supermarketId = String(formData.get("supermarket_id") || "").trim();
    const rawEan = String(formData.get("ean") || "").trim();
    const productName = String(formData.get("product_name") || "").trim();
    const productBrand = String(formData.get("product_brand") || "").trim();
    const productSize = String(formData.get("product_size") || "").trim();
    const rawPrice = String(formData.get("price") || "").trim();
    const isPromo = formData.get("is_promo") === "true";
    const promoLabel = String(formData.get("promo_label") || "").trim();
    const evidenceFile = formData.get("evidence");

    if (!supermarketId) {
      return NextResponse.json(
        { error: "Selecione o supermercado onde o preço foi coletado." },
        { status: 400 }
      );
    }

    const gtin = validateGtin(rawEan);
    if (!gtin.valid) {
      return NextResponse.json(
        { error: gtin.reason || "Código de barras EAN inválido." },
        { status: 400 }
      );
    }

    const price = parseFloat(rawPrice.replace(",", "."));
    if (Number.isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: "Informe um preço numérico maior que R$ 0,00." },
        { status: 400 }
      );
    }

    if (!(evidenceFile instanceof File) || evidenceFile.size === 0) {
      return NextResponse.json(
        {
          error:
            "Anexe a foto real da etiqueta de gôndola como evidência da coleta.",
        },
        { status: 400 }
      );
    }

    const db = createServiceRoleClient();
    const cleanEan = gtin.normalized;
    const productId = `ean-${cleanEan}`;
    const nowIso = new Date().toISOString();

    // 1) Upload da foto da etiqueta para o bucket privado 'evidencias'
    const safeName = evidenceFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const evidencePath = `${supermarketId}/${cleanEan}-${Date.now()}-${safeName}`;
    const fileBuffer = Buffer.from(await evidenceFile.arrayBuffer());

    const { error: uploadErr } = await db.storage
      .from("evidencias")
      .upload(evidencePath, fileBuffer, {
        contentType: evidenceFile.type || "image/jpeg",
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json(
        {
          error: `Falha ao enviar foto para o bucket 'evidencias': ${uploadErr.message}`,
        },
        { status: 500 }
      );
    }

    // 2) Garante que o produto exista em public.products
    const { data: existingProd } = await db
      .from("products")
      .select("id")
      .eq("ean", cleanEan)
      .maybeSingle();

    if (!existingProd) {
      if (!productName) {
        return NextResponse.json(
          {
            error:
              "Este EAN ainda não consta no banco. Preencha o nome do produto visto na etiqueta.",
          },
          { status: 400 }
        );
      }

      const measure = parseMeasureFromQuantity(productSize);
      const catId = inferCategoryId(null, productName);
      const isComplete = Boolean(
        productName && productBrand && measure.sizeLabel && catId
      );

      const { error: prodErr } = await db.from("products").upsert(
        {
          id: productId,
          ean: cleanEan,
          name: productName,
          brand: productBrand || null,
          category: catId,
          size_label: measure.sizeLabel,
          unit_type: measure.unitType,
          unit_value: measure.unitMultiplier,
          image_url: null,
          is_popular: false,
          description: null,
          source: "manual",
          data_status: isComplete ? "completo" : "pendente_revisao",
        },
        { onConflict: "ean" }
      );

      if (prodErr) {
        return NextResponse.json(
          { error: `Erro ao registrar produto: ${prodErr.message}` },
          { status: 500 }
        );
      }
    }

    // 3) Registra o preço coletado pela equipe com source = 'team_collected'
    const { error: priceErr } = await db.from("market_prices").upsert(
      {
        supermarket_id: supermarketId,
        product_id: existingProd?.id ? String(existingProd.id) : productId,
        price: Math.round(price * 100) / 100,
        is_promo: isPromo,
        promo_label: isPromo && promoLabel ? promoLabel : null,
        in_stock: true,
        source: "team_collected",
        status: "publicado",
        collected_at: nowIso,
        evidence_path: evidencePath,
        submitted_by: adminUser.id,
        reviewed_by: adminUser.id,
        reviewed_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "supermarket_id,product_id" }
    );

    if (priceErr) {
      return NextResponse.json(
        { error: `Erro ao salvar preço coletado: ${priceErr.message}` },
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
      product_id: existingProd?.id ? String(existingProd.id) : productId,
      ean: cleanEan,
      price: Math.round(price * 100) / 100,
      source: "team_collected",
      collected_at: nowIso,
      evidence_path: evidencePath,
    });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message =
      err instanceof Error ? err.message : "Erro ao registrar coleta.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
