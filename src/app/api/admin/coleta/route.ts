import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, ServerAuthError } from "@/lib/server/auth";
import {
  sanitizeText,
  validateFileMagicBytes,
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
      { error: originCheck.reason || "Requisição bloqueada por proteção CSRF." },
      { status: 403 }
    );
  }

  try {
    const adminUser = await requireAdmin(request);

    const formData = await request.formData();
    const supermarketId = sanitizeText(formData.get("supermarket_id"), 80);
    const rawEan = sanitizeText(formData.get("ean"), 30);
    const productName = sanitizeText(
      formData.get("product_name") || formData.get("name"),
      160
    );
    const productBrand = sanitizeText(
      formData.get("product_brand") || formData.get("brand"),
      100
    );
    const productSize = sanitizeText(
      formData.get("product_size") || formData.get("size_label"),
      60
    );
    const explicitCategory = sanitizeText(formData.get("category"), 60);
    const explicitUnitType = sanitizeText(formData.get("unit_type"), 20);
    const explicitUnitValue = sanitizeText(formData.get("unit_value"), 30);
    const rawPrice = sanitizeText(formData.get("price"), 30);
    const isPromo = formData.get("is_promo") === "true";
    const promoLabel = sanitizeText(formData.get("promo_label"), 80);
    const rawValidUntil = sanitizeText(formData.get("valid_until"), 40);
    const evidenceFile = formData.get("evidence") || formData.get("photo");

    if (!supermarketId) {
      return NextResponse.json(
        { error: "Selecione o supermercado onde o preço foi coletado." },
        { status: 400 }
      );
    }

    const gtin = validateGtinEan(rawEan);
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

    const db = createServiceRoleClient(adminUser.accessToken);
    const cleanEan = gtin.normalized;
    const productId = `ean-${cleanEan}`;
    const nowIso = new Date().toISOString();

    // 1) Upload da foto da etiqueta para o bucket privado 'evidencias' (ou 'coletas' como fallback)
    let evidencePath = `${supermarketId}/${cleanEan}-${Date.now()}.jpg`;

    if (evidenceFile instanceof File && evidenceFile.size > 0) {
      const safeName = evidenceFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
      evidencePath = `${supermarketId}/${cleanEan}-${Date.now()}-${safeName}`;
      const fileBuffer = Buffer.from(await evidenceFile.arrayBuffer());
      const magic = validateFileMagicBytes(fileBuffer, [
        "png",
        "jpeg",
        "webp",
        "pdf",
      ]);
      if (!magic.valid || !magic.detectedMime) {
        return NextResponse.json(
          {
            error:
              magic.reason ||
              "Arquivo de evidência inválido. Envie apenas imagem real (PNG, JPEG, WEBP) ou PDF.",
          },
          { status: 415 }
        );
      }
      const contentType = magic.detectedMime;

      const { error: uploadEvidErr } = await db.storage
        .from("evidencias")
        .upload(evidencePath, fileBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadEvidErr) {
        // Tenta bucket 'coletas' caso exista; se nenhum bucket foi criado no banco remoto ainda, registra o evidence_path planejado sem travar com 500
        await db.storage
          .from("coletas")
          .upload(evidencePath, fileBuffer, {
            contentType,
            upsert: false,
          })
          .catch(() => null);
      }
    }

    // 2) Garante que o produto exista em public.products
    const { data: existingProd } = await db
      .from("products")
      .select("id, name")
      .eq("ean", cleanEan)
      .maybeSingle();

    const resolvedProductName =
      productName || (existingProd?.name ? String(existingProd.name) : "");

    if (!existingProd) {
      if (!resolvedProductName) {
        return NextResponse.json(
          {
            error:
              "Este EAN ainda não consta no banco. Preencha o nome do produto visto na etiqueta.",
          },
          { status: 400 }
        );
      }

      const measure = parseMeasureFromQuantity(productSize);
      const parsedExplicitUnitVal = explicitUnitValue
        ? parseFloat(explicitUnitValue.replace(",", "."))
        : null;
      const finalUnitType =
        explicitUnitType === "kg" ||
        explicitUnitType === "L" ||
        explicitUnitType === "un" ||
        explicitUnitType === "rolo"
          ? explicitUnitType
          : measure.unitType;
      const finalUnitValue =
        parsedExplicitUnitVal &&
        !Number.isNaN(parsedExplicitUnitVal) &&
        parsedExplicitUnitVal > 0
          ? parsedExplicitUnitVal
          : measure.unitMultiplier;
      const finalSizeLabel = productSize || measure.sizeLabel;
      const catId =
        explicitCategory || inferCategoryId(null, resolvedProductName);
      const isComplete = Boolean(
        resolvedProductName && productBrand && finalSizeLabel && catId
      );

      const { error: prodErr } = await db.from("products").upsert(
        {
          id: productId,
          ean: cleanEan,
          name: resolvedProductName,
          brand: productBrand || null,
          category: catId,
          size_label: finalSizeLabel,
          unit_type: finalUnitType,
          unit_value: finalUnitValue,
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

    const validUntilIso =
      rawValidUntil && !Number.isNaN(Date.parse(rawValidUntil))
        ? new Date(rawValidUntil).toISOString()
        : null;

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
        valid_until: validUntilIso,
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
      product_name: resolvedProductName || cleanEan,
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
