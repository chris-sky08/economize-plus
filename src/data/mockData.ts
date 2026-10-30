export const TRANSPARENCY_DISCLAIMER =
  "Preços sujeitos a alteração na loja física • Veja o horário da última atualização";

// Mantido como alias para compatibilidade de importação em todas as telas
export const DEMO_DISCLAIMER = TRANSPARENCY_DISCLAIMER;

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface Market {
  id: string;
  name: string;
  shortName: string;
  cnpj: string;
  responsibleName: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  distanceKm: number;
  openingHours: string;
  planId: "basico" | "premium";
  isPartner: boolean;
  deliveryAvailable: boolean;
  deliveryInfo: string;
  status: "ativo" | "pendente" | "suspenso";
  lastCatalogUpdate: string;
  coverImage: string;
}

export interface Product {
  id: string;
  ean: string;
  name: string;
  brand: string;
  categoryId: string;
  sizeLabel: string;
  unitType: "kg" | "L" | "un" | "rolo";
  unitMultiplier: number; // unit_value no banco
  imageUrl: string;
  isPopular: boolean;
  description: string;
}

export type PriceSource = "partner_csv" | "nfce_qr" | "flyer_ocr";

export interface MarketPrice {
  id: string;
  marketId: string; // supermarket_id
  productId: string;
  price: number;
  regularPrice?: number;
  isPromo: boolean;
  promoLabel?: string;
  inStock: boolean;
  isSponsored?: boolean;
  source: PriceSource;
  updatedAt: string;
  needsUpdateAlert?: boolean;
}

export interface PriceReport {
  id: string;
  marketId: string;
  productId: string;
  reason: string;
  details: string;
  status: "pendente" | "revisado" | "arquivado";
  createdAt: string;
}

export interface PartnerApplication {
  id: string;
  marketName: string;
  responsibleName: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  city: string;
  zipCode: string;
  desiredPlan: "basico" | "premium";
  status: "em_analise" | "aprovado" | "recusado";
  createdAt: string;
}

export interface CourierApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleType: "bicicleta" | "moto" | "carro" | "utilitario";
  serviceNeighborhoods: string[];
  status: "pre_cadastro" | "em_analise" | "aprovado";
  createdAt: string;
}

/**
 * Gera uma ilustração vetorial limpa (SVG Data URI) com a embalagem real do produto
 * ou fachada do mercado, eliminando qualquer dependência de fotos genéricas do Unsplash.
 */
function createProductPackSvg(
  title: string,
  brand: string,
  size: string,
  bgHex: string,
  accentHex: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <rect width="240" height="240" rx="28" fill="#F8FBFF"/>
    <rect x="44" y="24" width="152" height="192" rx="18" fill="${bgHex}" stroke="${accentHex}" stroke-width="4"/>
    <rect x="56" y="42" width="128" height="32" rx="8" fill="${accentHex}"/>
    <text x="120" y="63" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${brand}</text>
    <text x="120" y="118" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#041834" text-anchor="middle">${title}</text>
    <rect x="70" y="152" width="100" height="34" rx="10" fill="#FFFFFF" stroke="${accentHex}" stroke-width="2"/>
    <text x="120" y="174" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${accentHex}" text-anchor="middle">${size}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createStoreCoverSvg(
  storeName: string,
  neighborhood: string,
  primaryHex: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="800" height="360">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${primaryHex}"/>
        <stop offset="100%" stop-color="#041834"/>
      </linearGradient>
    </defs>
    <rect width="800" height="360" fill="url(#g)"/>
    <circle cx="700" cy="70" r="110" fill="#FFD447" fill-opacity="0.16"/>
    <circle cx="110" cy="300" r="140" fill="#159447" fill-opacity="0.18"/>
    <rect x="48" y="54" width="170" height="38" rx="19" fill="#FFD447"/>
    <text x="133" y="78" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#041834" text-anchor="middle">${neighborhood}</text>
    <text x="48" y="156" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF">${storeName}</text>
    <text x="48" y="196" font-family="Arial, sans-serif" font-size="18" fill="#EAF3FF">Parceiro Verificado Economize+ • Preços atualizados</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const CATEGORIES: Category[] = [
  {
    id: "mercearia",
    name: "Mercearia",
    slug: "mercearia",
    icon: "Package",
    description: "Arroz, feijão, óleo, massas, café e itens essenciais da despensa.",
  },
  {
    id: "hortifruti",
    name: "Hortifruti",
    slug: "hortifruti",
    icon: "Apple",
    description: "Frutas, verduras e legumes selecionados no bairro.",
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
    description: "Sabão em pó, detergente, desinfetante e cuidado com a casa.",
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

export const INITIAL_MARKETS: Market[] = [
  {
    id: "mercado-a",
    name: "Supermercado Vila Mariana",
    shortName: "Super Vila Mariana",
    cnpj: "12.345.678/0001-10",
    responsibleName: "Carlos Eduardo Mendes",
    email: "contato@supervilamariana.com.br",
    phone: "(11) 3456-1010",
    address: "Rua Domingos de Morais, 410",
    neighborhood: "Vila Mariana",
    city: "São Paulo",
    state: "SP",
    zipCode: "04010-000",
    lat: -23.5849,
    lng: -46.6388,
    distanceKm: 0.8,
    openingHours: "Seg a Sáb: 07h às 21h • Dom: 08h às 14h",
    planId: "premium",
    isPartner: true,
    deliveryAvailable: false,
    deliveryInfo: "Retirada na loja • Entrega parceira em implantação regional.",
    status: "ativo",
    lastCatalogUpdate: "Hoje, às 08:40",
    coverImage: createStoreCoverSvg(
      "Supermercado Vila Mariana",
      "Vila Mariana • SP",
      "#176BCE"
    ),
  },
  {
    id: "mercado-b",
    name: "Supermercado Bairro Saúde",
    shortName: "Super Bairro Saúde",
    cnpj: "23.456.789/0001-20",
    responsibleName: "Fernanda Costa",
    email: "gerencia@superbairrosaude.com.br",
    phone: "(11) 3456-2020",
    address: "Av. Jabaquara, 890",
    neighborhood: "Saúde",
    city: "São Paulo",
    state: "SP",
    zipCode: "04045-000",
    lat: -23.6119,
    lng: -46.6377,
    distanceKm: 2.6,
    openingHours: "Seg a Dom: 07h às 22h",
    planId: "premium",
    isPartner: true,
    deliveryAvailable: false,
    deliveryInfo: "Retirada em loja • Consulte cobertura no balcão.",
    status: "ativo",
    lastCatalogUpdate: "Hoje, às 09:15",
    coverImage: createStoreCoverSvg(
      "Supermercado Bairro Saúde",
      "Saúde • SP",
      "#159447"
    ),
  },
  {
    id: "mercado-c",
    name: "Mini Mercado Vergueiro",
    shortName: "Mini Mercado Vergueiro",
    cnpj: "34.567.890/0001-30",
    responsibleName: "Roberto Almeida",
    email: "atendimento@minimercadovergueiro.com.br",
    phone: "(11) 3456-3030",
    address: "Rua Vergueiro, 1250",
    neighborhood: "Vila Mariana",
    city: "São Paulo",
    state: "SP",
    zipCode: "04101-000",
    lat: -23.5778,
    lng: -46.6395,
    distanceKm: 1.2,
    openingHours: "Seg a Sáb: 07h30 às 20h30",
    planId: "basico",
    isPartner: true,
    deliveryAvailable: false,
    deliveryInfo: "Compras presenciais e retirada rápida.",
    status: "ativo",
    lastCatalogUpdate: "Ontem, às 18:20",
    coverImage: createStoreCoverSvg(
      "Mini Mercado Vergueiro",
      "Vila Mariana • SP",
      "#0F4C81"
    ),
  },
  {
    id: "mercado-d",
    name: "Empório da Família Ipiranga",
    shortName: "Empório Ipiranga",
    cnpj: "45.678.901/0001-40",
    responsibleName: "Juliana Ribeiro",
    email: "contato@emporioipiranga.com.br",
    phone: "(11) 3456-4040",
    address: "Rua Silva Bueno, 620",
    neighborhood: "Ipiranga",
    city: "São Paulo",
    state: "SP",
    zipCode: "04208-000",
    lat: -23.5882,
    lng: -46.6021,
    distanceKm: 3.5,
    openingHours: "Seg a Sáb: 08h às 21h • Dom: 08h às 13h",
    planId: "basico",
    isPartner: true,
    deliveryAvailable: false,
    deliveryInfo: "Retirada na loja física.",
    status: "ativo",
    lastCatalogUpdate: "Hoje, às 07:55",
    coverImage: createStoreCoverSvg(
      "Empório da Família Ipiranga",
      "Ipiranga • SP",
      "#1E3A8A"
    ),
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "oleo-soja-900ml",
    ean: "7896036090244",
    name: "Óleo de Soja Refinado",
    brand: "Liza",
    categoryId: "mercearia",
    sizeLabel: "900 ml",
    unitType: "L",
    unitMultiplier: 0.9,
    imageUrl: createProductPackSvg(
      "Óleo de Soja",
      "LIZA",
      "900 ml",
      "#FEF9C3",
      "#CA8A04"
    ),
    isPopular: true,
    description:
      "Óleo de soja refinado 900 ml (EAN 7896036090244). Embalagem padronizada para comparação exata entre mercados.",
  },
  {
    id: "arroz-5kg",
    ean: "7896006711117",
    name: "Arroz Branco Tipo 1",
    brand: "Camil",
    categoryId: "mercearia",
    sizeLabel: "5 kg",
    unitType: "kg",
    unitMultiplier: 5,
    imageUrl: createProductPackSvg(
      "Arroz Tipo 1",
      "CAMIL",
      "5 kg",
      "#FEF2F2",
      "#DC2626"
    ),
    isPopular: true,
    description:
      "Pacote de 5 kg de arroz agulhinha tipo 1 (EAN 7896006711117). Comparado exclusivamente com pacotes equivalentes de 5 kg.",
  },
  {
    id: "arroz-1kg",
    ean: "7896006711124",
    name: "Arroz Branco Tipo 1",
    brand: "Camil",
    categoryId: "mercearia",
    sizeLabel: "1 kg",
    unitType: "kg",
    unitMultiplier: 1,
    imageUrl: createProductPackSvg(
      "Arroz Tipo 1",
      "CAMIL",
      "1 kg",
      "#FFF1F2",
      "#E11D48"
    ),
    isPopular: false,
    description:
      "Pacote de 1 kg de arroz tipo 1 (EAN 7896006711124). Separado da versão de 5 kg para garantir comparação justa.",
  },
  {
    id: "leite-integral-1l",
    ean: "7898215151784",
    name: "Leite UHT Integral",
    brand: "Piracanjuba",
    categoryId: "laticinios",
    sizeLabel: "1 L",
    unitType: "L",
    unitMultiplier: 1,
    imageUrl: createProductPackSvg(
      "Leite Integral",
      "PIRACANJUBA",
      "1 Litro",
      "#EFF6FF",
      "#176BCE"
    ),
    isPopular: true,
    description: "Leite longa vida integral em embalagem Tetra Pak de 1 litro (EAN 7898215151784).",
  },
  {
    id: "feijao-carioca-1kg",
    ean: "7896113900015",
    name: "Feijão Carioca Tipo 1",
    brand: "Kicaldo",
    categoryId: "mercearia",
    sizeLabel: "1 kg",
    unitType: "kg",
    unitMultiplier: 1,
    imageUrl: createProductPackSvg(
      "Feijão Carioca",
      "KICALDO",
      "1 kg",
      "#FFFBEB",
      "#B45309"
    ),
    isPopular: true,
    description: "Feijão carioca tipo 1 selecionado em pacote de 1 kg (EAN 7896113900015).",
  },
  {
    id: "cafe-torrado-500g",
    ean: "7896089011357",
    name: "Café Torrado e Moído Tradicional",
    brand: "Pilão",
    categoryId: "mercearia",
    sizeLabel: "500 g",
    unitType: "kg",
    unitMultiplier: 0.5,
    imageUrl: createProductPackSvg(
      "Café Tradicional",
      "PILÃO",
      "500 g",
      "#FEF2F2",
      "#991B1B"
    ),
    isPopular: true,
    description: "Café tradicional a vácuo 500 g (EAN 7896089011357) com cálculo automático por quilo.",
  },
  {
    id: "banana-prata-1kg",
    ean: "7890000001011",
    name: "Banana Prata Selecionada",
    brand: "Hortifruti",
    categoryId: "hortifruti",
    sizeLabel: "1 kg",
    unitType: "kg",
    unitMultiplier: 1,
    imageUrl: createProductPackSvg(
      "Banana Prata",
      "HORTIFRUTI",
      "1 kg",
      "#FEFCE8",
      "#159447"
    ),
    isPopular: true,
    description: "Banana prata fresca pesada por quilo.",
  },
  {
    id: "maca-gala-1kg",
    ean: "7890000001028",
    name: "Maçã Gala Nacional",
    brand: "Hortifruti",
    categoryId: "hortifruti",
    sizeLabel: "1 kg",
    unitType: "kg",
    unitMultiplier: 1,
    imageUrl: createProductPackSvg(
      "Maçã Gala",
      "HORTIFRUTI",
      "1 kg",
      "#FFF1F2",
      "#159447"
    ),
    isPopular: false,
    description: "Maçã gala nacional selecionada por quilo.",
  },
  {
    id: "sabao-po-1600g",
    ean: "7891150064317",
    name: "Lava-Roupas em Pó Lavagem Perfeita",
    brand: "Omo",
    categoryId: "limpeza",
    sizeLabel: "1,6 kg",
    unitType: "kg",
    unitMultiplier: 1.6,
    imageUrl: createProductPackSvg(
      "Lava-Roupas Pó",
      "OMO",
      "1,6 kg",
      "#EFF6FF",
      "#1D4ED8"
    ),
    isPopular: true,
    description: "Sabão em pó caixa 1,6 kg (EAN 7891150064317) com cálculo proporcional por quilo.",
  },
  {
    id: "detergente-neutro-500ml",
    ean: "7896098900208",
    name: "Lava-Louças Líquido Neutro",
    brand: "Ypê",
    categoryId: "limpeza",
    sizeLabel: "500 ml",
    unitType: "L",
    unitMultiplier: 0.5,
    imageUrl: createProductPackSvg(
      "Detergente Neutro",
      "YPÊ",
      "500 ml",
      "#FEFCE8",
      "#EAB308"
    ),
    isPopular: false,
    description: "Detergente líquido neutro em frasco de 500 ml (EAN 7896098900208).",
  },
  {
    id: "papel-higienico-12un",
    ean: "7891172432110",
    name: "Papel Higiênico Folha Dupla Neutro",
    brand: "Neve",
    categoryId: "higiene",
    sizeLabel: "12 rolos (30m)",
    unitType: "rolo",
    unitMultiplier: 12,
    imageUrl: createProductPackSvg(
      "Papel Folha Dupla",
      "NEVE",
      "12 rolos",
      "#F0F9FF",
      "#0284C7"
    ),
    isPopular: true,
    description: "Pacote com 12 rolos de folha dupla (EAN 7891172432110). Calcula o preço por rolo.",
  },
  {
    id: "pao-forma-integral-400g",
    ean: "7896002300322",
    name: "Pão de Forma Integral com Grãos",
    brand: "Pullman",
    categoryId: "padaria",
    sizeLabel: "400 g",
    unitType: "kg",
    unitMultiplier: 0.4,
    imageUrl: createProductPackSvg(
      "Pão Integral",
      "PULLMAN",
      "400 g",
      "#FEF3C7",
      "#92400E"
    ),
    isPopular: false,
    description: "Pão de forma integral pacote de 400 g (EAN 7896002300322).",
  },
  {
    id: "suco-laranja-1l",
    ean: "7898944991019",
    name: "Suco de Laranja Integral",
    brand: "Natural One",
    categoryId: "bebidas",
    sizeLabel: "900 ml",
    unitType: "L",
    unitMultiplier: 0.9,
    imageUrl: createProductPackSvg(
      "Suco Laranja 100%",
      "NATURAL ONE",
      "900 ml",
      "#FFF7ED",
      "#EA580C"
    ),
    isPopular: true,
    description: "Suco de laranja 100% integral refrigerado 900 ml (EAN 7898944991019).",
  },
];

export const INITIAL_PRICES: MarketPrice[] = [
  {
    id: "p-1",
    marketId: "mercado-a",
    productId: "oleo-soja-900ml",
    price: 8.49,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-2",
    marketId: "mercado-b",
    productId: "oleo-soja-900ml",
    price: 7.29,
    regularPrice: 8.49,
    inStock: true,
    isPromo: true,
    promoLabel: "-14% OFF",
    source: "flyer_ocr",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-3",
    marketId: "mercado-c",
    productId: "oleo-soja-900ml",
    price: 7.99,
    inStock: true,
    isPromo: false,
    source: "nfce_qr",
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-4",
    marketId: "mercado-d",
    productId: "oleo-soja-900ml",
    price: 7.69,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 07:55",
  },
  {
    id: "p-5",
    marketId: "mercado-a",
    productId: "arroz-5kg",
    price: 29.9,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-6",
    marketId: "mercado-b",
    productId: "arroz-5kg",
    price: 24.9,
    regularPrice: 29.9,
    inStock: true,
    isPromo: true,
    promoLabel: "Oferta da Semana",
    isSponsored: true,
    source: "flyer_ocr",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-7",
    marketId: "mercado-c",
    productId: "arroz-5kg",
    price: 27.5,
    inStock: true,
    isPromo: false,
    source: "nfce_qr",
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-8",
    marketId: "mercado-d",
    productId: "arroz-5kg",
    price: 26.8,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 07:55",
  },
  {
    id: "p-9",
    marketId: "mercado-a",
    productId: "arroz-1kg",
    price: 6.49,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-10",
    marketId: "mercado-b",
    productId: "arroz-1kg",
    price: 5.99,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-11",
    marketId: "mercado-c",
    productId: "arroz-1kg",
    price: 6.29,
    inStock: true,
    isPromo: false,
    source: "nfce_qr",
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-12",
    marketId: "mercado-a",
    productId: "leite-integral-1l",
    price: 4.99,
    regularPrice: 5.79,
    inStock: true,
    isPromo: true,
    promoLabel: "Menor Preço",
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-13",
    marketId: "mercado-b",
    productId: "leite-integral-1l",
    price: 5.49,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-14",
    marketId: "mercado-c",
    productId: "leite-integral-1l",
    price: 5.15,
    inStock: true,
    isPromo: false,
    source: "nfce_qr",
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-15",
    marketId: "mercado-d",
    productId: "leite-integral-1l",
    price: 5.29,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 07:55",
  },
  {
    id: "p-16",
    marketId: "mercado-a",
    productId: "feijao-carioca-1kg",
    price: 7.89,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-17",
    marketId: "mercado-b",
    productId: "feijao-carioca-1kg",
    price: 7.49,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-18",
    marketId: "mercado-c",
    productId: "feijao-carioca-1kg",
    price: 6.99,
    regularPrice: 8.19,
    inStock: true,
    isPromo: true,
    promoLabel: "-15% OFF",
    source: "flyer_ocr",
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-19",
    marketId: "mercado-d",
    productId: "feijao-carioca-1kg",
    price: 7.65,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 07:55",
  },
  {
    id: "p-20",
    marketId: "mercado-a",
    productId: "cafe-torrado-500g",
    price: 18.9,
    regularPrice: 21.5,
    inStock: true,
    isPromo: true,
    promoLabel: "Oferta Especial",
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-21",
    marketId: "mercado-b",
    productId: "cafe-torrado-500g",
    price: 19.8,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-22",
    marketId: "mercado-c",
    productId: "cafe-torrado-500g",
    price: 20.5,
    inStock: true,
    isPromo: false,
    needsUpdateAlert: true,
    source: "nfce_qr",
    updatedAt: "Há 6 dias",
  },
  {
    id: "p-23",
    marketId: "mercado-a",
    productId: "banana-prata-1kg",
    price: 6.99,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-24",
    marketId: "mercado-b",
    productId: "banana-prata-1kg",
    price: 5.49,
    regularPrice: 6.99,
    inStock: true,
    isPromo: true,
    promoLabel: "Quarta Verde",
    source: "flyer_ocr",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-25",
    marketId: "mercado-c",
    productId: "banana-prata-1kg",
    price: 5.99,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-26",
    marketId: "mercado-a",
    productId: "maca-gala-1kg",
    price: 11.9,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-27",
    marketId: "mercado-b",
    productId: "maca-gala-1kg",
    price: 10.49,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-28",
    marketId: "mercado-d",
    productId: "maca-gala-1kg",
    price: 9.99,
    regularPrice: 12.5,
    inStock: true,
    isPromo: true,
    promoLabel: "-20% OFF",
    source: "flyer_ocr",
    updatedAt: "Hoje, 07:55",
  },
  {
    id: "p-29",
    marketId: "mercado-a",
    productId: "sabao-po-1600g",
    price: 22.9,
    inStock: true,
    isPromo: false,
    needsUpdateAlert: true,
    source: "partner_csv",
    updatedAt: "Há 5 dias",
  },
  {
    id: "p-30",
    marketId: "mercado-b",
    productId: "sabao-po-1600g",
    price: 19.9,
    regularPrice: 23.9,
    inStock: true,
    isPromo: true,
    promoLabel: "-16% OFF",
    source: "flyer_ocr",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-31",
    marketId: "mercado-c",
    productId: "sabao-po-1600g",
    price: 21.5,
    inStock: false,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-32",
    marketId: "mercado-a",
    productId: "detergente-neutro-500ml",
    price: 2.39,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-33",
    marketId: "mercado-b",
    productId: "detergente-neutro-500ml",
    price: 2.19,
    inStock: true,
    isPromo: true,
    promoLabel: "Leve + Pague -",
    source: "flyer_ocr",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-34",
    marketId: "mercado-c",
    productId: "detergente-neutro-500ml",
    price: 2.49,
    inStock: true,
    isPromo: false,
    source: "nfce_qr",
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-35",
    marketId: "mercado-a",
    productId: "papel-higienico-12un",
    price: 16.9,
    regularPrice: 19.9,
    inStock: true,
    isPromo: true,
    promoLabel: "-15% OFF",
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-36",
    marketId: "mercado-b",
    productId: "papel-higienico-12un",
    price: 17.5,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-37",
    marketId: "mercado-c",
    productId: "papel-higienico-12un",
    price: 18.2,
    inStock: true,
    isPromo: false,
    source: "nfce_qr",
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-38",
    marketId: "mercado-a",
    productId: "pao-forma-integral-400g",
    price: 8.99,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-39",
    marketId: "mercado-b",
    productId: "pao-forma-integral-400g",
    price: 7.99,
    regularPrice: 9.29,
    inStock: true,
    isPromo: true,
    promoLabel: "-14% OFF",
    source: "flyer_ocr",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-40",
    marketId: "mercado-a",
    productId: "suco-laranja-1l",
    price: 11.49,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-41",
    marketId: "mercado-b",
    productId: "suco-laranja-1l",
    price: 10.9,
    inStock: true,
    isPromo: false,
    source: "partner_csv",
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-42",
    marketId: "mercado-c",
    productId: "suco-laranja-1l",
    price: 9.99,
    regularPrice: 11.99,
    inStock: true,
    isPromo: true,
    promoLabel: "Oferta Relâmpago",
    source: "flyer_ocr",
    updatedAt: "Ontem, 18:20",
  },
];

export const DEFAULT_SHOPPING_LIST = [
  { productId: "arroz-5kg", quantity: 1, checked: true },
  { productId: "oleo-soja-900ml", quantity: 2, checked: true },
  { productId: "leite-integral-1l", quantity: 4, checked: true },
  { productId: "feijao-carioca-1kg", quantity: 2, checked: true },
  { productId: "cafe-torrado-500g", quantity: 1, checked: true },
];

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function calculateUnitPrice(
  price: number,
  product: Product
): {
  value: number;
  formatted: string;
} {
  const unitValue = price / (product.unitMultiplier || 1);
  return {
    value: unitValue,
    formatted: `${formatBRL(unitValue)}/${product.unitType}`,
  };
}
