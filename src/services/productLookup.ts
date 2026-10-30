import { Product } from "@/data/mockData";
import { saveProductToSupabase } from "@/lib/supabase";

interface OpenFoodFactsProductRaw {
  code?: string;
  product_name?: string;
  product_name_pt?: string;
  brands?: string;
  quantity?: string;
  categories?: string;
  image_front_url?: string;
  image_url?: string;
}

interface OpenFoodFactsByEanResponse {
  status?: number;
  code?: string;
  product?: OpenFoodFactsProductRaw;
}

interface OpenFoodFactsSearchResponse {
  products?: OpenFoodFactsProductRaw[];
}

export function parseMeasureFromQuantity(rawQuantity?: string): {
  sizeLabel: string;
  unitType: "kg" | "L" | "un" | "rolo";
  unitMultiplier: number;
} {
  if (!rawQuantity || !rawQuantity.trim()) {
    return { sizeLabel: "1 un", unitType: "un", unitMultiplier: 1 };
  }

  const cleaned = rawQuantity.trim();
  const match = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|un|rolos?)/i);

  if (!match) {
    return { sizeLabel: cleaned.slice(0, 16), unitType: "un", unitMultiplier: 1 };
  }

  const numericValue = parseFloat(match[1].replace(",", "."));
  const rawUnit = match[2].toLowerCase();

  if (rawUnit === "kg") {
    return {
      sizeLabel: `${match[1]} kg`,
      unitType: "kg",
      unitMultiplier: numericValue || 1,
    };
  }
  if (rawUnit === "g") {
    return {
      sizeLabel: `${match[1]} g`,
      unitType: "kg",
      unitMultiplier: (numericValue || 500) / 1000,
    };
  }
  if (rawUnit === "l") {
    return {
      sizeLabel: `${match[1]} L`,
      unitType: "L",
      unitMultiplier: numericValue || 1,
    };
  }
  if (rawUnit === "ml") {
    return {
      sizeLabel: `${match[1]} ml`,
      unitType: "L",
      unitMultiplier: (numericValue || 500) / 1000,
    };
  }
  if (rawUnit.startsWith("rolo")) {
    return {
      sizeLabel: `${match[1]} rolos`,
      unitType: "rolo",
      unitMultiplier: numericValue || 1,
    };
  }

  return {
    sizeLabel: `${match[1]} un`,
    unitType: "un",
    unitMultiplier: numericValue || 1,
  };
}

function inferCategoryId(categoriesText?: string, nameText?: string): string {
  const combined = `${categoriesText || ""} ${nameText || ""}`.toLowerCase();
  if (
    combined.includes("leite") ||
    combined.includes("queijo") ||
    combined.includes("iogurte") ||
    combined.includes("manteiga") ||
    combined.includes("latic")
  ) {
    return "laticinios";
  }
  if (
    combined.includes("suco") ||
    combined.includes("refrigerante") ||
    combined.includes("bebida") ||
    combined.includes("agua") ||
    combined.includes("água")
  ) {
    return "bebidas";
  }
  if (
    combined.includes("fruta") ||
    combined.includes("verdura") ||
    combined.includes("legume") ||
    combined.includes("banana") ||
    combined.includes("maçã")
  ) {
    return "hortifruti";
  }
  if (
    combined.includes("sabão") ||
    combined.includes("detergente") ||
    combined.includes("limpeza") ||
    combined.includes("desinfetante")
  ) {
    return "limpeza";
  }
  if (
    combined.includes("higiene") ||
    combined.includes("sabonete") ||
    combined.includes("shampoo") ||
    combined.includes("papel")
  ) {
    return "higiene";
  }
  if (
    combined.includes("pão") ||
    combined.includes("biscoito") ||
    combined.includes("bolacha") ||
    combined.includes("padaria")
  ) {
    return "padaria";
  }
  return "mercearia";
}

function mapRawToProduct(raw: OpenFoodFactsProductRaw): Product | null {
  const name = (raw.product_name_pt || raw.product_name || "").trim();
  const ean = (raw.code || "").trim();
  if (!name || !ean) return null;

  const brand = (raw.brands || "Marca Nacional").split(",")[0].trim();
  const { sizeLabel, unitType, unitMultiplier } = parseMeasureFromQuantity(
    raw.quantity
  );
  const categoryId = inferCategoryId(raw.categories, name);
  const imageUrl =
    raw.image_front_url || raw.image_url || "/logo-oficial.jpg";

  return {
    id: `ean-${ean}`,
    ean,
    name,
    brand,
    categoryId,
    sizeLabel,
    unitType,
    unitMultiplier,
    imageUrl,
    isPopular: false,
    description: `${name} (${sizeLabel}) — Marca ${brand} • Código EAN ${ean} obtido via Open Food Facts Brasil.`,
  };
}

/**
 * Consulta um produto pelo código de barras EAN-13 no Open Food Facts Brasil
 * e persiste automaticamente na tabela `products` do Supabase.
 */
export async function lookupProductByEan(ean: string): Promise<Product | null> {
  const cleanEan = ean.replace(/\D/g, "");
  if (!cleanEan) return null;

  try {
    const res = await fetch(
      `https://br.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanEan)}.json`
    );
    if (!res.ok) return null;

    const data = (await res.json()) as OpenFoodFactsByEanResponse;
    if (!data.product) return null;

    const mapped = mapRawToProduct({
      ...data.product,
      code: data.code || cleanEan,
    });

    if (mapped) {
      await saveProductToSupabase(mapped);
    }
    return mapped;
  } catch {
    return null;
  }
}

/**
 * Busca produtos por texto na base pública do Open Food Facts Brasil
 * e salva os itens encontrados no banco de dados Supabase.
 */
export async function searchProductsOpenFoodFacts(
  query: string
): Promise<Product[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // Se o usuário digitou um código EAN numérico (8 a 14 dígitos), busca direto por EAN
  if (/^\d{8,14}$/.test(trimmed)) {
    const byEan = await lookupProductByEan(trimmed);
    return byEan ? [byEan] : [];
  }

  try {
    const url = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      trimmed
    )}&search_simple=1&action=process&json=1&page_size=6`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = (await res.json()) as OpenFoodFactsSearchResponse;
    if (!Array.isArray(data.products)) return [];

    const results: Product[] = [];
    for (const raw of data.products) {
      const mapped = mapRawToProduct(raw);
      if (mapped) {
        results.push(mapped);
      }
    }
    return results;
  } catch {
    return [];
  }
}
