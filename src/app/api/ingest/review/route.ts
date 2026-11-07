import { NextRequest, NextResponse } from "next/server";
import { requireMarketMember, ServerAuthError } from "@/lib/server/auth";
import { sanitizeText, validateSameOrigin } from "@/lib/server/security";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";

interface RawReviewProduct {
  id?: string;
  ean?: string | null;
  name?: string;
  brand?: string | null;
  size_label?: string | null;
  unit_type?: string | null;
  unit_value?: number | null;
}

interface RawReviewPriceRow {
  id: string;
  supermarket_id: string;
  product_id: string;
  price: number;
  is_promo: boolean;
  promo_label: string | null;
  source: string;
  status: string;
  valid_from: string | null;
  valid_until: string | null;
  collected_at: string;
  updated_at?: string;
  evidence_path: string | null;
  products?: RawReviewProduct | RawReviewProduct[] | null;
}

export async function GET(request: NextRequest) {
  try {
    const requestedMarketId = request.nextUrl.searchParams.get("supermarket_id");
    const { user, supermarketId } = await requireMarketMember(
      request,
      requestedMarketId
    );

    if (!supermarketId) {
      return NextResponse.json({
        supermarket_id: "",
        pendingItems: [],
        items: [],
      });
    }

    const db = createServiceRoleClient(user.accessToken);
    const { data, error } = await db
      .from("market_prices")
      .select(
        "id, supermarket_id, product_id, price, is_promo, promo_label, source, status, valid_from, valid_until, collected_at, updated_at, evidence_path, products(id, ean, name, brand, size_label, unit_type, unit_value)"
      )
      .eq("supermarket_id", supermarketId)
      .eq("status", "pendente")
      .order("collected_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []) as RawReviewPriceRow[];
    const formatted = rows.map((row) => {
      const prodObj: RawReviewProduct | null = Array.isArray(row.products)
        ? row.products[0] || null
        : row.products || null;

      return {
        id: String(row.id),
        supermarket_id: String(row.supermarket_id),
        product_id: String(row.product_id),
        ean: prodObj?.ean ? String(prodObj.ean) : null,
        product_name: prodObj?.name ? String(prodObj.name) : "Produto extraído",
        brand: prodObj?.brand ? String(prodObj.brand) : null,
        size_label: prodObj?.size_label ? String(prodObj.size_label) : null,
        price: Number(row.price),
        is_promo: Boolean(row.is_promo),
        promo_label: row.promo_label ? String(row.promo_label) : null,
        source: String(row.source),
        status: String(row.status),
        valid_from: row.valid_from ? String(row.valid_from) : null,
        valid_until: row.valid_until ? String(row.valid_until) : null,
        collected_at: String(row.collected_at),
        updated_at: String(row.updated_at || row.collected_at),
        evidence_path: row.evidence_path ? String(row.evidence_path) : null,
        products: prodObj
          ? {
              id: String(prodObj.id || row.product_id),
              ean: prodObj.ean ? String(prodObj.ean) : null,
              name: String(prodObj.name || "Produto extraído"),
              brand: prodObj.brand ? String(prodObj.brand) : null,
              size_label: prodObj.size_label ? String(prodObj.size_label) : null,
              unit_type: prodObj.unit_type ? String(prodObj.unit_type) : null,
              unit_value:
                typeof prodObj.unit_value === "number"
                  ? prodObj.unit_value
                  : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      supermarket_id: supermarketId,
      pendingItems: formatted,
      items: formatted,
    });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Erro ao consultar itens pendentes de revisão." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const originCheck = validateSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: originCheck.reason || "Requisição bloqueada por proteção CSRF." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      supermarket_id?: string;
      action: "approve" | "reject" | "approve_all" | "approve_batch";
      priceId?: string;
      price_id?: string;
      price_ids?: string[];
      updatedPrice?: number;
      price?: number;
      updatedPromoLabel?: string | null;
      promo_label?: string | null;
      validUntil?: string | null;
      valid_until?: string | null;
    };

    const { user, supermarketId } = await requireMarketMember(
      request,
      body.supermarket_id
    );

    const db = createServiceRoleClient(user.accessToken);
    const nowIso = new Date().toISOString();

    if (body.action === "approve_all" || body.action === "approve_batch") {
      let query = db
        .from("market_prices")
        .update({
          status: "publicado",
          reviewed_by: user.id,
          reviewed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("supermarket_id", supermarketId)
        .eq("status", "pendente");

      if (Array.isArray(body.price_ids) && body.price_ids.length > 0) {
        query = query.in("id", body.price_ids);
      }

      const { error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const targetPriceId = (body.priceId || body.price_id || "").trim();
    if (!targetPriceId) {
      return NextResponse.json(
        { error: "Informe o identificador do preço (priceId)." },
        { status: 400 }
      );
    }

    const nextStatus = body.action === "approve" ? "publicado" : "rejeitado";
    const updates: Record<string, unknown> = {
      status: nextStatus,
      reviewed_by: user.id,
      reviewed_at: nowIso,
      updated_at: nowIso,
    };

    const rawPrice =
      typeof body.updatedPrice === "number"
        ? body.updatedPrice
        : typeof body.price === "number"
          ? body.price
          : undefined;
    if (typeof rawPrice === "number" && !Number.isNaN(rawPrice) && rawPrice > 0) {
      updates.price = Math.round(rawPrice * 100) / 100;
    }

    const rawPromoLabel =
      body.updatedPromoLabel !== undefined
        ? body.updatedPromoLabel
        : body.promo_label;
    if (rawPromoLabel !== undefined) {
      updates.promo_label = rawPromoLabel
        ? sanitizeText(rawPromoLabel, 80) || null
        : null;
    }

    const rawValidUntil =
      body.validUntil !== undefined ? body.validUntil : body.valid_until;
    if (rawValidUntil !== undefined) {
      updates.valid_until = rawValidUntil || null;
    }

    const { error } = await db
      .from("market_prices")
      .update(updates)
      .eq("id", targetPriceId)
      .eq("supermarket_id", supermarketId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Erro ao atualizar revisão do preço." },
      { status: 500 }
    );
  }
}
