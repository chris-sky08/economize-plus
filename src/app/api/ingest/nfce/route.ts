import { NextRequest, NextResponse } from "next/server";
import { requireMarketMember, ServerAuthError } from "@/lib/server/auth";
import {
  sanitizeText,
  validateGtinEan,
  validateSafeHttpUrl,
  validateSameOrigin,
} from "@/lib/server/security";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";
import {
  inferCategoryId,
  parseMeasureFromQuantity,
} from "@/services/productLookup";

export interface NfceItemInput {
  ean?: string;
  name?: string;
  brand?: string | null;
  size_label?: string | null;
  price?: number | string;
}

const ALLOWED_SEFAZ_HOST_SUFFIXES = [
  ".fazenda.sp.gov.br",
  ".fazenda.rj.gov.br",
  ".fazenda.mg.gov.br",
  ".fazenda.pr.gov.br",
  ".fazenda.df.gov.br",
  ".sefaz.rs.gov.br",
  ".svrs.rs.gov.br",
  ".sefaz.ba.gov.br",
  ".sefaz.pe.gov.br",
  ".sefaz.ce.gov.br",
  ".sefaz.go.gov.br",
  ".sefaz.mt.gov.br",
  ".sefaz.ms.gov.br",
  ".sefaz.am.gov.br",
  ".sefaz.pa.gov.br",
  ".sefaz.es.gov.br",
  ".sefaz.ma.gov.br",
  ".sefaz.pb.gov.br",
  ".sefaz.pi.gov.br",
  ".sefaz.rn.gov.br",
  ".sefaz.se.gov.br",
  ".sefaz.to.gov.br",
  ".sefaz.ac.gov.br",
  ".sefaz.al.gov.br",
  ".sefaz.ap.gov.br",
  ".sefaz.ro.gov.br",
  ".sefaz.rr.gov.br",
  ".sef.sc.gov.br",
];

function isAllowedSefazHostname(hostname: string): boolean {
  const clean = hostname.trim().toLowerCase();
  if (!clean.endsWith(".gov.br")) {
    return false;
  }
  return ALLOWED_SEFAZ_HOST_SUFFIXES.some(
    (suffix) => clean === suffix.slice(1) || clean.endsWith(suffix)
  );
}

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
      nfceUrl?: string;
      accessKey?: string;
      items?: NfceItemInput[];
    };

    const { user, supermarketId } = await requireMarketMember(
      request,
      body.supermarket_id
    );

    if (!supermarketId) {
      return NextResponse.json(
        {
          success: false,
          error: "Selecione ou vincule um supermercado antes de enviar NFC-e.",
        },
        { status: 400 }
      );
    }

    const safeUrl = validateSafeHttpUrl(body.nfceUrl);
    if (!safeUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "URL da NFC-e inválida ou bloqueada por proteção SSRF. Informe uma URL HTTPS oficial da SEFAZ.",
        },
        { status: 400 }
      );
    }

    const parsedUrl = new URL(safeUrl);
    if (!isAllowedSefazHostname(parsedUrl.hostname)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Domínio não autorizado: apenas portais oficiais da SEFAZ (*.gov.br) são aceitos para consulta de NFC-e.",
        },
        { status: 400 }
      );
    }

    const cleanAccessKey = (body.accessKey || "").replace(/\D/g, "");
    if (cleanAccessKey && cleanAccessKey.length !== 44) {
      return NextResponse.json(
        {
          success: false,
          error: "A chave de acesso da NFC-e deve conter 44 dígitos numéricos.",
        },
        { status: 400 }
      );
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Envie os itens extraídos da NFC-e com código EAN e preço positivo para registro.",
          validatedUrl: safeUrl,
        },
        { status: 422 }
      );
    }

    const nowIso = new Date().toISOString();
    const productPayloads: Array<Record<string, unknown>> = [];
    const pricePayloads: Array<Record<string, unknown>> = [];

    for (const rawItem of rawItems.slice(0, 200)) {
      const gtin = validateGtinEan(String(rawItem.ean || ""));
      if (!gtin.valid) continue;

      const cleanName = sanitizeText(rawItem.name, 160);
      if (cleanName.length < 2) continue;

      const price =
        typeof rawItem.price === "number"
          ? rawItem.price
          : parseFloat(String(rawItem.price || "").replace(",", "."));
      if (Number.isNaN(price) || price <= 0) continue;

      const cleanEan = gtin.normalized;
      const productId = `ean-${cleanEan}`;
      const cleanBrand = sanitizeText(rawItem.brand, 100) || null;
      const cleanSize = sanitizeText(rawItem.size_label, 60) || null;
      const measure = parseMeasureFromQuantity(cleanSize);
      const catId = inferCategoryId(null, cleanName);

      productPayloads.push({
        id: productId,
        ean: cleanEan,
        name: cleanName,
        brand: cleanBrand,
        category: catId,
        size_label: cleanSize || measure.sizeLabel,
        unit_type: measure.unitType,
        unit_value: measure.unitMultiplier,
        image_url: null,
        is_popular: false,
        description: null,
        source: "partner",
        data_status:
          cleanBrand && (cleanSize || measure.sizeLabel) && catId
            ? "completo"
            : "pendente_revisao",
      });

      pricePayloads.push({
        supermarket_id: supermarketId,
        product_id: productId,
        price: Math.round(price * 100) / 100,
        is_promo: false,
        promo_label: null,
        in_stock: true,
        source: "nfce_qr",
        status: "pendente",
        collected_at: nowIso,
        evidence_path: safeUrl,
        submitted_by: user.id,
        updated_at: nowIso,
      });
    }

    if (pricePayloads.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nenhum item da NFC-e possuía código EAN válido (GS1 Módulo-10) e preço positivo.",
        },
        { status: 422 }
      );
    }

    const db = createServiceRoleClient(user.accessToken);

    const { error: prodErr } = await db
      .from("products")
      .upsert(productPayloads, { onConflict: "ean", ignoreDuplicates: true });

    if (prodErr) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao registrar catálogo da NFC-e: ${prodErr.message}`,
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
          error: `Erro ao registrar preços da NFC-e: ${priceErr.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      supermarket_id: supermarketId,
      source: "nfce_qr",
      status: "pendente",
      count: pricePayloads.length,
    });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.status }
      );
    }
    const message =
      err instanceof Error ? err.message : "Erro ao processar NFC-e.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
