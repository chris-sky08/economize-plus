import type { Product, ProductDataStatus } from "@/types/domain";
import { validateGtin } from "@/lib/format";
import { searchProductsInDatabase } from "@/lib/supabase";

export interface OpenFoodFactsProductRaw {
  code?: string;
  product_name?: string;
  product_name_pt?: string;
  brands?: string;
  quantity?: string;
  categories?: string;
  image_front_url?: string;
  image_url?: string;
}

export function parseMeasureFromQuantity(rawQuantity?: string | null): {
  sizeLabel: string | null;
  unitType: "kg" | "L" | "un" | "rolo" | null;
  unitMultiplier: number | null;
} {
  if (!rawQuantity || !rawQuantity.trim()) {
    return { sizeLabel: null, unitType: null, unitMultiplier: null };
  }

  const cleaned = rawQuantity.trim();
  const match = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|un|rolos?)\b/i);

  if (!match) {
    return { sizeLabel: null, unitType: null, unitMultiplier: null };
  }

  const numericValue = parseFloat(match[1].replace(",", "."));
  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return { sizeLabel: null, unitType: null, unitMultiplier: null };
  }

  const rawUnit = match[2].toLowerCase();

  if (rawUnit === "kg") {
    return {
      sizeLabel: `${match[1]} kg`,
      unitType: "kg",
      unitMultiplier: numericValue,
    };
  }
  if (rawUnit === "g") {
    return {
      sizeLabel: `${match[1]} g`,
      unitType: "kg",
      unitMultiplier: numericValue / 1000,
    };
  }
  if (rawUnit === "l") {
    return {
      sizeLabel: `${match[1]} L`,
      unitType: "L",
      unitMultiplier: numericValue,
    };
  }
  if (rawUnit === "ml") {
    return {
      sizeLabel: `${match[1]} ml`,
      unitType: "L",
      unitMultiplier: numericValue / 1000,
    };
  }
  if (rawUnit.startsWith("rolo")) {
    return {
      sizeLabel: `${match[1]} rolos`,
      unitType: "rolo",
      unitMultiplier: numericValue,
    };
  }

  return {
    sizeLabel: `${match[1]} un`,
    unitType: "un",
    unitMultiplier: numericValue,
  };
}

export function inferCategoryId(
  categoriesText?: string | null,
  nameText?: string | null
): string | null {
  const combined = `${categoriesText || ""} ${nameText || ""}`.toLowerCase();
  if (!combined.trim()) return null;

  // Limpeza testada ANTES de bebidas para que "água sanitária" nunca caia em bebidas
  if (
    combined.includes("água sanitária") ||
    combined.includes("agua sanitaria") ||
    combined.includes("alvejante") ||
    combined.includes("sabão") ||
    combined.includes("sabao") ||
    combined.includes("lava-roupas") ||
    combined.includes("lava roupas") ||
    combined.includes("lava-louças") ||
    combined.includes("detergente") ||
    combined.includes("desinfetante") ||
    combined.includes("amaciante") ||
    combined.includes("limpeza")
  ) {
    return "limpeza";
  }

  if (
    combined.includes("higiene") ||
    combined.includes("sabonete") ||
    combined.includes("shampoo") ||
    combined.includes("condicionador") ||
    combined.includes("creme dental") ||
    combined.includes("papel higiênico") ||
    combined.includes("papel higienico") ||
    combined.includes("desodorante")
  ) {
    return "higiene";
  }

  if (
    combined.includes("leite") ||
    combined.includes("queijo") ||
    combined.includes("iogurte") ||
    combined.includes("manteiga") ||
    combined.includes("requeijão") ||
    combined.includes("latic")
  ) {
    return "laticinios";
  }

  if (
    combined.includes("suco") ||
    combined.includes("refrigerante") ||
    combined.includes("bebida") ||
    combined.includes("cerveja") ||
    combined.includes("água mineral") ||
    combined.includes("agua mineral") ||
    combined.includes("água com gás") ||
    combined.includes("água sem gás")
  ) {
    return "bebidas";
  }

  if (
    combined.includes("fruta") ||
    combined.includes("verdura") ||
    combined.includes("legume") ||
    combined.includes("banana") ||
    combined.includes("maçã") ||
    combined.includes("tomate") ||
    combined.includes("batata")
  ) {
    return "hortifruti";
  }

  if (
    combined.includes("pão") ||
    combined.includes("biscoito") ||
    combined.includes("bolacha") ||
    combined.includes("torrada") ||
    combined.includes("padaria")
  ) {
    return "padaria";
  }

  if (
    combined.includes("arroz") ||
    combined.includes("feijão") ||
    combined.includes("feijao") ||
    combined.includes("óleo") ||
    combined.includes("oleo") ||
    combined.includes("azeite") ||
    combined.includes("macarrão") ||
    combined.includes("café") ||
    combined.includes("açúcar") ||
    combined.includes("farinha") ||
    combined.includes("molho") ||
    combined.includes("mercearia")
  ) {
    return "mercearia";
  }

  return null;
}

export function mapOpenFoodFactsRawToProduct(
  raw: OpenFoodFactsProductRaw,
  fetchedAtIso = new Date().toISOString()
): Product | null {
  const name = (raw.product_name_pt || raw.product_name || "").trim();
  const cleanEan = (raw.code || "").replace(/\D/g, "");
  if (!name || !cleanEan) return null;

  const rawBrand = (raw.brands || "").split(",")[0]?.trim() || "";
  const brand = rawBrand ? rawBrand : null;

  const { sizeLabel, unitType, unitMultiplier } = parseMeasureFromQuantity(
    raw.quantity
  );
  const categoryId = inferCategoryId(raw.categories, name);
  const imageUrl = (raw.image_front_url || raw.image_url || "").trim() || null;

  const isComplete = Boolean(
    name && brand && sizeLabel && unitType && unitMultiplier && categoryId
  );
  const dataStatus: ProductDataStatus = isComplete
    ? "completo"
    : "pendente_revisao";

  const sizeInfo = sizeLabel ? ` (${sizeLabel})` : "";
  const brandInfo = brand ? ` • Marca ${brand}` : "";

  return {
    id: `ean-${cleanEan}`,
    ean: cleanEan,
    name,
    brand,
    categoryId,
    sizeLabel,
    unitType,
    unitMultiplier,
    imageUrl,
    isPopular: false,
    description: `${name}${sizeInfo}${brandInfo} • Código EAN ${cleanEan} catalogado via Open Food Facts (ODbL).`,
    source: "open_food_facts",
    dataStatus,
    offFetchedAt: fetchedAtIso,
  };
}

/**
 * Consulta um produto pelo código EAN através da rota de servidor `/api/produtos/ean/[ean]`,
 * que gerencia cache de 30 dias no Supabase e atribui User-Agent oficial ao Open Food Facts.
 */
export async function lookupProductByEan(ean: string): Promise<Product | null> {
  const check = validateGtin(ean);
  if (!check.valid) return null;

  try {
    const res = await fetch(
      `/api/produtos/ean/${encodeURIComponent(check.normalized)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { product?: Product | null };
    return data.product || null;
  } catch {
    return null;
  }
}

/**
 * Busca por texto ou EAN no banco Supabase (índice trigram) e, caso o termo
 * seja um código GTIN válido não encontrado localmente, consulta a rota de EAN.
 */
export async function searchProductsForAutocomplete(
  query: string
): Promise<Product[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const dbMatches = await searchProductsInDatabase(q, 10);
  const onlyDigits = q.replace(/\D/g, "");
  if (onlyDigits.length >= 8 && validateGtin(onlyDigits).valid) {
    const hasExact = dbMatches.some((p) => p.ean === onlyDigits);
    if (!hasExact) {
      const fromEan = await lookupProductByEan(onlyDigits);
      if (fromEan) {
        return [fromEan, ...dbMatches];
      }
    }
  }
  return dbMatches;
}
