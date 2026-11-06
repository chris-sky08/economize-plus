import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/server/auth";
import {
  createServiceRoleClient,
  getServerSupabaseConfig,
} from "@/lib/server/supabaseAdmin";
import type { PriceSource } from "@/types/domain";

export type PriceHistoryDirection = "up" | "down" | "same" | "initial";

export interface PriceHistoryEntry {
  id: number;
  supermarket_id: string;
  supermarket_name: string;
  supermarket_neighborhood: string | null;
  supermarket_verified_at: string | null;
  product_id: string;
  product_name: string;
  product_brand: string | null;
  product_size_label: string | null;
  product_ean: string | null;
  price: number;
  previous_price: number | null;
  delta: number;
  direction: PriceHistoryDirection;
  is_promo: boolean;
  source: PriceSource;
  recorded_at: string;
}

interface RawPriceHistoryRow {
  id: number | string;
  supermarket_id: string;
  product_id: string;
  price: number | string;
  is_promo: boolean | null;
  source: string;
  recorded_at: string;
}

interface RawSupermarketRow {
  id: string;
  name: string;
  neighborhood: string | null;
  verified_at: string | null;
  status: string | null;
}

interface RawProductRow {
  id: string;
  name: string;
  brand: string | null;
  size_label: string | null;
  ean: string | null;
}

const VALID_SOURCES: ReadonlyArray<PriceSource> = [
  "partner_manual",
  "partner_csv",
  "flyer_ocr",
  "nfce_qr",
  "team_collected",
];

function normalizeSource(raw: string): PriceSource {
  if (VALID_SOURCES.includes(raw as PriceSource)) {
    return raw as PriceSource;
  }
  return "partner_manual";
}

export async function GET(request: NextRequest) {
  try {
    const { url, serviceRoleKey, anonKey } = getServerSupabaseConfig();
    if (!url || (!serviceRoleKey && !anonKey)) {
      return NextResponse.json({
        success: true,
        count: 0,
        entries: [] as PriceHistoryEntry[],
      });
    }

    const { searchParams } = new URL(request.url);
    const productId = (searchParams.get("product_id") || "").trim() || null;
    const supermarketId =
      (searchParams.get("supermarket_id") || "").trim() || null;
    const rawLimit = Number(searchParams.get("limit") || "30");
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
      : 30;

    const token = extractTokenFromRequest(request);
    const db = createServiceRoleClient(token || undefined);

    // Busca uma janela maior para calcular a variação em relação à coleta anterior de cada par (supermarket_id, product_id)
    const fetchLimit = Math.min(limit * 3, 250);
    let query = db
      .from("price_history")
      .select(
        "id, supermarket_id, product_id, price, is_promo, source, recorded_at"
      )
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(fetchLimit);

    if (productId) {
      query = query.eq("product_id", productId);
    }
    if (supermarketId) {
      query = query.eq("supermarket_id", supermarketId);
    }

    const { data: rawHistory, error: historyErr } = await query;

    if (historyErr) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao consultar histórico de preços: ${historyErr.message}`,
          count: 0,
          entries: [] as PriceHistoryEntry[],
        },
        { status: 500 }
      );
    }

    const rows = (rawHistory || []) as RawPriceHistoryRow[];
    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        entries: [] as PriceHistoryEntry[],
      });
    }

    const marketIds = Array.from(
      new Set(rows.map((r) => String(r.supermarket_id)).filter(Boolean))
    );
    const productIds = Array.from(
      new Set(rows.map((r) => String(r.product_id)).filter(Boolean))
    );

    const [marketsRes, productsRes] = await Promise.all([
      db
        .from("supermarkets")
        .select("id, name, neighborhood, verified_at, status")
        .in("id", marketIds),
      db
        .from("products")
        .select("id, name, brand, size_label, ean")
        .in("id", productIds),
    ]);

    if (marketsRes.error) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao consultar mercados do histórico: ${marketsRes.error.message}`,
          count: 0,
          entries: [] as PriceHistoryEntry[],
        },
        { status: 500 }
      );
    }

    if (productsRes.error) {
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao consultar produtos do histórico: ${productsRes.error.message}`,
          count: 0,
          entries: [] as PriceHistoryEntry[],
        },
        { status: 500 }
      );
    }

    const marketsById = new Map<string, RawSupermarketRow>();
    for (const m of (marketsRes.data || []) as RawSupermarketRow[]) {
      if (m.status === "ativo" || (supermarketId && m.id === supermarketId)) {
        marketsById.set(m.id, m);
      }
    }

    const productsById = new Map<string, RawProductRow>();
    for (const p of (productsRes.data || []) as RawProductRow[]) {
      productsById.set(p.id, p);
    }

    // Filtra apenas registros cujos mercados estão ativos (ou são o mercado consultado) e produtos existem
    const validRows = rows.filter(
      (r) =>
        marketsById.has(String(r.supermarket_id)) &&
        productsById.has(String(r.product_id))
    );

    // Ordena cronologicamente (do mais antigo para o mais recente) para calcular previous_price e delta com precisão
    const chronological = [...validRows].sort((a, b) => {
      const timeDiff =
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      return Number(a.id) - Number(b.id);
    });

    const lastPriceByPair = new Map<string, number>();
    const enrichedById = new Map<number, PriceHistoryEntry>();

    for (const row of chronological) {
      const numericId = Number(row.id);
      const currentPrice = Number(row.price);
      if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
        continue;
      }

      const pairKey = `${row.supermarket_id}::${row.product_id}`;
      const previousPrice = lastPriceByPair.has(pairKey)
        ? lastPriceByPair.get(pairKey) ?? null
        : null;

      let delta = 0;
      let direction: PriceHistoryDirection = "initial";

      if (previousPrice !== null) {
        delta = Math.round((currentPrice - previousPrice) * 100) / 100;
        if (delta > 0.004) {
          direction = "up";
        } else if (delta < -0.004) {
          direction = "down";
        } else {
          direction = "same";
          delta = 0;
        }
      }

      lastPriceByPair.set(pairKey, currentPrice);

      const market = marketsById.get(String(row.supermarket_id));
      const product = productsById.get(String(row.product_id));
      if (!market || !product) continue;

      enrichedById.set(numericId, {
        id: numericId,
        supermarket_id: market.id,
        supermarket_name: market.name,
        supermarket_neighborhood: market.neighborhood,
        supermarket_verified_at: market.verified_at,
        product_id: product.id,
        product_name: product.name,
        product_brand: product.brand,
        product_size_label: product.size_label,
        product_ean: product.ean,
        price: currentPrice,
        previous_price: previousPrice,
        delta,
        direction,
        is_promo: Boolean(row.is_promo),
        source: normalizeSource(String(row.source)),
        recorded_at: row.recorded_at,
      });
    }

    // Reordena por recorded_at desc (mais recente primeiro) e aplica o limit solicitado
    const entries = validRows
      .map((r) => enrichedById.get(Number(r.id)))
      .filter((item): item is PriceHistoryEntry => Boolean(item))
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: entries.length,
      entries,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Falha ao consultar o histórico de preços.";
    return NextResponse.json(
      {
        success: false,
        error: message,
        count: 0,
        entries: [] as PriceHistoryEntry[],
      },
      { status: 500 }
    );
  }
}
