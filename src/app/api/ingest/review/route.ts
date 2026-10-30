import { NextRequest, NextResponse } from "next/server";
import { requireMarketMember, ServerAuthError } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    const requestedMarketId = request.nextUrl.searchParams.get("supermarket_id");
    const { supermarketId } = await requireMarketMember(
      request,
      requestedMarketId
    );

    const db = createServiceRoleClient();
    const { data, error } = await db
      .from("market_prices")
      .select(
        "id, supermarket_id, product_id, price, is_promo, promo_label, source, status, valid_from, valid_until, collected_at, evidence_path, products(id, ean, name, brand, size_label)"
      )
      .eq("supermarket_id", supermarketId)
      .eq("status", "pendente")
      .order("collected_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      supermarket_id: supermarketId,
      pendingItems: data || [],
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
  try {
    const body = (await request.json()) as {
      supermarket_id?: string;
      action: "approve" | "reject" | "approve_all";
      priceId?: string;
      updatedPrice?: number;
      updatedPromoLabel?: string | null;
      validUntil?: string | null;
    };

    const { user, supermarketId } = await requireMarketMember(
      request,
      body.supermarket_id
    );

    const db = createServiceRoleClient();
    const nowIso = new Date().toISOString();

    if (body.action === "approve_all") {
      const { error } = await db
        .from("market_prices")
        .update({
          status: "publicado",
          reviewed_by: user.id,
          reviewed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("supermarket_id", supermarketId)
        .eq("status", "pendente");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (!body.priceId) {
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

    if (typeof body.updatedPrice === "number" && body.updatedPrice > 0) {
      updates.price = Math.round(body.updatedPrice * 100) / 100;
    }
    if (body.updatedPromoLabel !== undefined) {
      updates.promo_label = body.updatedPromoLabel || null;
    }
    if (body.validUntil !== undefined) {
      updates.valid_until = body.validUntil || null;
    }

    const { error } = await db
      .from("market_prices")
      .update(updates)
      .eq("id", body.priceId)
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
