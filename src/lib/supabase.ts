import { createClient } from "@supabase/supabase-js";
import { Market, MarketPrice, Product } from "@/data/mockData";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ezatyiuhwegqiuavrgfo.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_KPSyouRcXWMl7XpPlHuhRw_1-hRduwv";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export async function fetchCatalogFromSupabase(): Promise<{
  supermarkets: Market[] | null;
  products: Product[] | null;
  prices: MarketPrice[] | null;
}> {
  if (!isSupabaseConfigured) {
    return { supermarkets: null, products: null, prices: null };
  }

  try {
    const [marketsRes, productsRes, pricesRes] = await Promise.all([
      supabase.from("supermarkets").select("*").eq("status", "ativo"),
      supabase.from("products").select("*"),
      supabase.from("market_prices").select("*"),
    ]);

    const supermarkets: Market[] | null =
      !marketsRes.error && marketsRes.data && marketsRes.data.length > 0
        ? marketsRes.data.map((m) => ({
            id: String(m.id),
            name: String(m.name),
            shortName: String(m.name).slice(0, 22),
            cnpj: String(m.cnpj || ""),
            responsibleName: String(m.responsible_name || "Gerência"),
            email: String(m.email || ""),
            phone: String(m.phone || "(11) 3456-0000"),
            address: String(m.address),
            neighborhood: String(m.neighborhood),
            city: String(m.city),
            state: String(m.state || "SP"),
            zipCode: String(m.zip_code || "04101-000"),
            lat: Number(m.lat || -23.5849),
            lng: Number(m.lng || -46.6388),
            distanceKm: 1.2,
            openingHours: String(
              m.opening_hours || "Seg a Sáb: 07h às 21h"
            ),
            planId: m.plan_id === "premium" ? "premium" : "basico",
            isPartner: Boolean(m.is_partner ?? true),
            deliveryAvailable: Boolean(m.delivery_available ?? false),
            deliveryInfo: String(
              m.delivery_info || "Retirada em loja • Consulte cobertura regional."
            ),
            status: "ativo",
            lastCatalogUpdate: "Atualizado recentemente",
            coverImage: "/logo-oficial.jpg",
          }))
        : null;

    const products: Product[] | null =
      !productsRes.error && productsRes.data && productsRes.data.length > 0
        ? productsRes.data.map((p) => ({
            id: String(p.id),
            ean: String(p.ean || p.id),
            name: String(p.name),
            brand: String(p.brand || "Marca"),
            categoryId: String(p.category || "mercearia"),
            sizeLabel: String(
              p.size_label || `${p.unit_value || 1} ${p.unit_type || "un"}`
            ),
            unitType: (p.unit_type as Product["unitType"]) || "un",
            unitMultiplier: Number(p.unit_value || 1),
            imageUrl: String(p.image_url || "/logo-oficial.jpg"),
            isPopular: Boolean(p.is_popular ?? true),
            description: String(p.description || p.name),
          }))
        : null;

    const prices: MarketPrice[] | null =
      !pricesRes.error && pricesRes.data && pricesRes.data.length > 0
        ? pricesRes.data.map((pr) => ({
            id: String(pr.id),
            marketId: String(pr.supermarket_id),
            productId: String(pr.product_id),
            price: Number(pr.price),
            regularPrice: pr.regular_price ? Number(pr.regular_price) : undefined,
            isPromo: Boolean(pr.is_promo),
            promoLabel: pr.promo_label ? String(pr.promo_label) : undefined,
            inStock: Boolean(pr.in_stock ?? true),
            isSponsored: Boolean(pr.is_sponsored ?? false),
            source:
              (pr.source as MarketPrice["source"]) || "partner_csv",
            updatedAt: pr.updated_at
              ? new Date(String(pr.updated_at)).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Hoje",
          }))
        : null;

    return { supermarkets, products, prices };
  } catch {
    return { supermarkets: null, products: null, prices: null };
  }
}

export async function saveProductToSupabase(product: Product): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from("products").upsert(
      {
        id: product.id,
        ean: product.ean,
        name: product.name,
        brand: product.brand,
        category: product.categoryId,
        size_label: product.sizeLabel,
        unit_type: product.unitType,
        unit_value: product.unitMultiplier,
        image_url: product.imageUrl,
        is_popular: product.isPopular,
        description: product.description,
      },
      { onConflict: "ean" }
    );
  } catch {
    // Fallback silencioso caso a tabela ainda não tenha sido migrada
  }
}
