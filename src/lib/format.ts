import type { Category, PriceSource, Product } from "@/types/domain";

export const TRANSPARENCY_DISCLAIMER =
  "Preços sujeitos a alteração na loja física • Confira a data, o horário e a origem de cada coleta";

export const CATEGORIES: Category[] = [
  {
    id: "mercearia",
    name: "Mercearia",
    slug: "mercearia",
    icon: "Package",
    description:
      "Arroz, feijão, óleo, massas, café e itens essenciais da despensa.",
  },
  {
    id: "hortifruti",
    name: "Hortifruti",
    slug: "hortifruti",
    icon: "Apple",
    description: "Frutas, verduras e legumes vendidos na região.",
  },
  {
    id: "laticinios",
    name: "Laticínios",
    slug: "laticinios",
    icon: "Milk",
    description: "Leites, queijos, manteigas, iogurtes e ovos.",
  },
  {
    id: "bebidas",
    name: "Bebidas",
    slug: "bebidas",
    icon: "CupSoda",
    description: "Sucos, águas, refrigerantes e bebidas para a família.",
  },
  {
    id: "limpeza",
    name: "Limpeza",
    slug: "limpeza",
    icon: "Sparkles",
    description: "Sabão em pó, detergente, água sanitária e cuidado com a casa.",
  },
  {
    id: "higiene",
    name: "Higiene",
    slug: "higiene",
    icon: "HeartHandshake",
    description: "Sabonetes, shampoos, creme dental e papel higiênico.",
  },
  {
    id: "padaria",
    name: "Padaria",
    slug: "padaria",
    icon: "Croissant",
    description: "Pães de forma, integrais, biscoitos e matinais.",
  },
];

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function calculateUnitPrice(
  price: number,
  product: Pick<Product, "unitMultiplier" | "unitType">
): {
  value: number;
  formatted: string;
} | null {
  if (
    !product.unitMultiplier ||
    product.unitMultiplier <= 0 ||
    !product.unitType
  ) {
    return null;
  }
  const unitValue = price / product.unitMultiplier;
  return {
    value: unitValue,
    formatted: `${formatBRL(unitValue)}/${product.unitType}`,
  };
}

export function formatDateTimeBR(
  isoString?: string | null,
  source?: PriceSource
): string {
  if (!isoString) {
    return "Data de atualização não informada";
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Data de atualização não informada";
  }
  const dayMonth = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const hourMin = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (source === "team_collected") {
    return `Preço coletado pela equipe em ${dayMonth} às ${hourMin}`;
  }
  return `atualizado em ${dayMonth} às ${hourMin}`;
}

export function getPriceSourceBadgeLabel(source: PriceSource): string {
  switch (source) {
    case "team_collected":
      return "Coletado pela equipe";
    case "partner_manual":
      return "Informado pelo mercado";
    case "partner_csv":
      return "Planilha do mercado";
    case "flyer_ocr":
      return "Encarte revisado";
    case "nfce_qr":
      return "Nota Fiscal (NFC-e)";
  }
}

export function isTimestampStale(
  isoString?: string | null,
  maxDays = 7
): boolean {
  if (!isoString) return true;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return true;
  const diffMs = Date.now() - date.getTime();
  return diffMs > maxDays * 24 * 60 * 60 * 1000;
}

/**
 * Valida código de barras padrão GS1 (GTIN-8, GTIN-12, GTIN-13, GTIN-14)
 * verificando o dígito verificador pelo algoritmo módulo 10.
 */
export function validateGtin(raw: string): {
  valid: boolean;
  normalized: string;
  reason?: string;
} {
  const digits = raw.replace(/\D/g, "");
  if (![8, 12, 13, 14].includes(digits.length)) {
    return {
      valid: false,
      normalized: digits,
      reason: "O código EAN/GTIN deve ter 8, 12, 13 ou 14 dígitos numéricos.",
    };
  }
  if (/^0+$/.test(digits)) {
    return {
      valid: false,
      normalized: digits,
      reason: "Código EAN inválido (composto apenas por zeros).",
    };
  }

  const body = digits.slice(0, -1);
  const checkDigit = Number(digits.slice(-1));
  let sum = 0;

  for (let i = 0; i < body.length; i++) {
    const num = Number(body[body.length - 1 - i]);
    const weight = i % 2 === 0 ? 3 : 1;
    sum += num * weight;
  }

  const expectedCheck = (10 - (sum % 10)) % 10;
  if (checkDigit !== expectedCheck) {
    return {
      valid: false,
      normalized: digits,
      reason: `Dígito verificador do EAN inválido (esperado ${expectedCheck}, recebido ${checkDigit}).`,
    };
  }

  return { valid: true, normalized: digits };
}
