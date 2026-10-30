import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Market, MarketPrice, PriceSource, Product } from "@/types/domain";
import {
  formatDateTimeBR,
  getPriceSourceBadgeLabel,
  isTimestampStale,
} from "@/lib/format";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseConfigError: string | null = isSupabaseConfigured
  ? null
  : "Configuração obrigatória ausente: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente.";

// Utiliza URL sintaticamente válida apenas para instanciar o SDK sem quebrar o build estático quando a variável não está definida;
// todas as funções de leitura/escrita verificam `isSupabaseConfigured` antes de qualquer requisição.
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://config-missing.invalid",
  supabaseAnonKey || "config-missing"
);

export interface CatalogQueryOptions {
  city?: string | null;
  categoryId?: string | null;
  page?: number;
  pageSize?: number;
}

export function mapDbMarketRow(m: Record<string, unknown>): Market {
  const updatedAtIso = m.updated_at ? String(m.updated_at) : null;
  const latNum =
    m.lat !== null && m.lat !== undefined && m.lat !== ""
      ? Number(m.lat)
      : null;
  const lngNum =
    m.lng !== null && m.lng !== undefined && m.lng !== ""
      ? Number(m.lng)
      : null;

  return {
    id: String(m.id),
    name: String(m.name),
    shortName: String(m.name).slice(0, 24),
    cnpj: m.cnpj ? String(m.cnpj) : null,
    responsibleName: m.responsible_name ? String(m.responsible_name) : null,
    email: m.email ? String(m.email) : null,
    phone: m.phone ? String(m.phone) : null,
    address: String(m.address || ""),
    neighborhood: String(m.neighborhood || ""),
    city: String(m.city || ""),
    state: String(m.state || ""),
    zipCode: m.zip_code ? String(m.zip_code) : m.cep ? String(m.cep) : null,
    lat: latNum !== null && !Number.isNaN(latNum) ? latNum : (m.latitude !== null && m.latitude !== undefined ? Number(m.latitude) : null),
    lng: lngNum !== null && !Number.isNaN(lngNum) ? lngNum : (m.longitude !== null && m.longitude !== undefined ? Number(m.longitude) : null),
    distanceKm: null,
    openingHours: m.opening_hours ? String(m.opening_hours) : null,
    planId: m.plan_id === "premium" ? "premium" : "basico",
    isPartner: Boolean(m.is_partner),
    deliveryAvailable: Boolean(m.delivery_available),
    deliveryInfo: m.delivery_info ? String(m.delivery_info) : null,
    status:
      m.status === "ativo" || m.status === "suspenso" ? m.status : "pendente",
    verifiedAt: m.verified_at ? String(m.verified_at) : null,
    updatedAtIso,
    lastCatalogUpdate: updatedAtIso ? formatDateTimeBR(updatedAtIso) : null,
    coverImage: null,
  };
}

export function mapDbProductRow(p: Record<string, unknown>): Product {
  const rawUnitType = p.unit_type ? String(p.unit_type) : null;
  const unitType: Product["unitType"] =
    rawUnitType === "kg" ||
    rawUnitType === "L" ||
    rawUnitType === "un" ||
    rawUnitType === "rolo"
      ? rawUnitType
      : null;

  const rawUnitVal =
    p.unit_value !== null && p.unit_value !== undefined && p.unit_value !== ""
      ? Number(p.unit_value)
      : null;

  return {
    id: String(p.id),
    ean: String(p.ean || ""),
    name: String(p.name || ""),
    brand: p.brand ? String(p.brand) : null,
    categoryId: p.category ? String(p.category) : null,
    sizeLabel: p.size_label ? String(p.size_label) : null,
    unitType,
    unitMultiplier:
      rawUnitVal !== null && !Number.isNaN(rawUnitVal) && rawUnitVal > 0
        ? rawUnitVal
        : null,
    imageUrl: p.image_url ? String(p.image_url) : null,
    isPopular: Boolean(p.is_popular),
    description: p.description ? String(p.description) : null,
    source:
      p.source === "open_food_facts" || p.source === "partner"
        ? p.source
        : "manual",
    dataStatus: p.data_status === "completo" ? "completo" : "pendente_revisao",
    offFetchedAt: p.off_fetched_at ? String(p.off_fetched_at) : null,
  };
}

export function mapDbPriceRow(pr: Record<string, unknown>): MarketPrice {
  const rawSource = String(pr.source || "partner_manual");
  const source: PriceSource =
    rawSource === "partner_csv" ||
    rawSource === "flyer_ocr" ||
    rawSource === "nfce_qr" ||
    rawSource === "team_collected"
      ? rawSource
      : "partner_manual";

  const collectedAtIso = pr.collected_at
    ? String(pr.collected_at)
    : pr.updated_at
      ? String(pr.updated_at)
      : "";
  const updatedAtIso = pr.updated_at ? String(pr.updated_at) : collectedAtIso;

  return {
    id: String(pr.id),
    marketId: String(pr.supermarket_id || pr.market_id || ""),
    productId: String(pr.product_id),
    price: Number(pr.price),
    regularPrice:
      pr.regular_price !== null && pr.regular_price !== undefined
        ? Number(pr.regular_price)
        : undefined,
    isPromo: Boolean(pr.is_promo),
    promoLabel: pr.promo_label ? String(pr.promo_label) : undefined,
    inStock: Boolean(pr.in_stock ?? true),
    isSponsored: Boolean(pr.is_sponsored ?? false),
    source,
    status:
      pr.status === "publicado" || pr.status === "rejeitado"
        ? pr.status
        : "pendente",
    validFrom: pr.valid_from ? String(pr.valid_from) : null,
    validUntil: pr.valid_until ? String(pr.valid_until) : null,
    collectedAtIso,
    updatedAtIso,
    updatedAt: formatDateTimeBR(collectedAtIso || updatedAtIso, source),
    sourceLabel: getPriceSourceBadgeLabel(source),
    isStale: isTimestampStale(collectedAtIso || updatedAtIso, 7),
    evidencePath: pr.evidence_path ? String(pr.evidence_path) : null,
  };
}

export async function fetchCatalogFromSupabase(
  options: CatalogQueryOptions = {}
): Promise<{
  supermarkets: Market[];
  products: Product[];
  prices: MarketPrice[];
  error: string | null;
}> {
  if (!isSupabaseConfigured) {
    return {
      supermarkets: [],
      products: [],
      prices: [],
      error: supabaseConfigError,
    };
  }

  const page = Math.max(0, options.page ?? 0);
  const pageSize = Math.min(200, Math.max(10, options.pageSize ?? 100));
  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    let marketsQuery = supabase
      .from("supermarkets")
      .select(
        "id, name, cnpj, responsible_name, email, phone, address, neighborhood, city, state, zip_code, lat, lng, is_partner, opening_hours, plan_id, delivery_available, delivery_info, status, verified_at, updated_at"
      )
      .eq("status", "ativo")
      .range(from, to);

    if (options.city && options.city.trim()) {
      marketsQuery = marketsQuery.ilike("city", options.city.trim());
    }

    let productsQuery = supabase
      .from("products")
      .select(
        "id, ean, name, brand, category, size_label, unit_type, unit_value, image_url, is_popular, description, source, data_status, off_fetched_at"
      )
      .range(from, to);

    if (
      options.categoryId &&
      options.categoryId !== "todas" &&
      options.categoryId.trim()
    ) {
      productsQuery = productsQuery.eq("category", options.categoryId.trim());
    }

    const pricesQuery = supabase
      .from("market_prices")
      .select(
        "id, supermarket_id, product_id, price, regular_price, is_promo, promo_label, in_stock, is_sponsored, source, status, valid_from, valid_until, collected_at, evidence_path, updated_at"
      )
      .eq("status", "publicado")
      .range(0, 499);

    const [marketsRes, productsRes, pricesRes] = await Promise.all([
      marketsQuery,
      productsQuery,
      pricesQuery,
    ]);

    if (marketsRes.error) {
      return {
        supermarkets: [],
        products: [],
        prices: [],
        error: `Não foi possível carregar os mercados (${marketsRes.error.message}). Verifique se a migration 0001_dados_reais.sql foi aplicada no Supabase.`,
      };
    }

    const supermarkets = Array.isArray(marketsRes.data)
      ? marketsRes.data.map((m) =>
          mapDbMarketRow(m as Record<string, unknown>)
        )
      : [];

    const products =
      !productsRes.error && Array.isArray(productsRes.data)
        ? productsRes.data.map((p) =>
            mapDbProductRow(p as Record<string, unknown>)
          )
        : [];

    const prices =
      !pricesRes.error && Array.isArray(pricesRes.data)
        ? pricesRes.data.map((pr) =>
            mapDbPriceRow(pr as Record<string, unknown>)
          )
        : [];

    return { supermarkets, products, prices, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Erro de conexão ao consultar o banco de dados.";
    return {
      supermarkets: [],
      products: [],
      prices: [],
      error: message,
    };
  }
}

export async function searchProductsInDatabase(
  query: string,
  limit = 12
): Promise<Product[]> {
  if (!isSupabaseConfigured || query.trim().length < 2) {
    return [];
  }
  const clean = query.trim();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, ean, name, brand, category, size_label, unit_type, unit_value, image_url, is_popular, description, source, data_status, off_fetched_at"
    )
    .or(`name.ilike.%${clean}%,brand.ilike.%${clean}%,ean.eq.${clean}`)
    .limit(limit);

  if (error || !Array.isArray(data)) {
    return [];
  }
  return data.map((p) => mapDbProductRow(p as Record<string, unknown>));
}
