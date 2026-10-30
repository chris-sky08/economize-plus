export const DEMO_DISCLAIMER =
  "Demonstração: preços e mercados fictícios. Os valores não representam ofertas reais e podem variar na loja.";

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
  responsibleName: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  distanceKm: number;
  openingHours: string;
  planId: "basico" | "premium";
  deliveryAvailable: boolean;
  deliveryInfo: string;
  isDemo: boolean;
  status: "ativo" | "pendente" | "suspenso";
  lastCatalogUpdate: string;
  coverImage: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  sizeLabel: string;
  unitType: "kg" | "L" | "un" | "rolo";
  unitMultiplier: number; // ex: 900ml = 0.9 L; 5kg = 5 kg; 500g = 0.5 kg
  imageUrl: string;
  isPopular: boolean;
  isDemo: boolean;
  description: string;
}

export interface MarketPrice {
  id: string;
  marketId: string;
  productId: string;
  price: number;
  regularPrice?: number;
  isPromo: boolean;
  promoLabel?: string;
  inStock: boolean;
  isSponsored?: boolean;
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
    name: "Mercado Exemplo A — Bairro Centro",
    shortName: "Mercado Exemplo A",
    responsibleName: "Carlos Eduardo Mendes",
    email: "contato@mercadoexemploa.demo.br",
    phone: "(11) 3456-1010",
    address: "Rua Domingos de Morais, 410 (Endereço Fictício)",
    neighborhood: "Vila Mariana",
    city: "São Paulo",
    state: "SP",
    zipCode: "04010-000",
    distanceKm: 1.2,
    openingHours: "Seg a Sáb: 07h às 21h • Dom: 08h às 14h",
    planId: "premium",
    deliveryAvailable: false,
    deliveryInfo: "Retirada na loja. Entrega via parceiros em preparação operacional.",
    isDemo: true,
    status: "ativo",
    lastCatalogUpdate: "Hoje, às 08:40",
    coverImage:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "mercado-b",
    name: "Mercado Exemplo B — Super Bairro",
    shortName: "Mercado Exemplo B",
    responsibleName: "Fernanda Costa",
    email: "gerencia@mercadoexemplob.demo.br",
    phone: "(11) 3456-2020",
    address: "Av. Jabaquara, 890 (Endereço Fictício)",
    neighborhood: "Saúde",
    city: "São Paulo",
    state: "SP",
    zipCode: "04045-000",
    distanceKm: 1.8,
    openingHours: "Seg a Dom: 07h às 22h",
    planId: "premium",
    deliveryAvailable: false,
    deliveryInfo: "Operação de entrega com entregadores parceiros prevista para breve.",
    isDemo: true,
    status: "ativo",
    lastCatalogUpdate: "Hoje, às 09:15",
    coverImage:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "mercado-c",
    name: "Mercado Exemplo C — Mini Preço Local",
    shortName: "Mercado Exemplo C",
    responsibleName: "Roberto Almeida",
    email: "atendimento@mercadoexemploc.demo.br",
    phone: "(11) 3456-3030",
    address: "Rua Vergueiro, 1250 (Endereço Fictício)",
    neighborhood: "Vila Mariana",
    city: "São Paulo",
    state: "SP",
    zipCode: "04101-000",
    distanceKm: 0.9,
    openingHours: "Seg a Sáb: 07h30 às 20h30",
    planId: "basico",
    deliveryAvailable: false,
    deliveryInfo: "Apenas compras presenciais no momento.",
    isDemo: true,
    status: "ativo",
    lastCatalogUpdate: "Ontem, às 18:20",
    coverImage:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "mercado-d",
    name: "Mercado Exemplo D — Empório da Família",
    shortName: "Mercado Exemplo D",
    responsibleName: "Juliana Ribeiro",
    email: "contato@mercadoexemplod.demo.br",
    phone: "(11) 3456-4040",
    address: "Rua Silva Bueno, 620 (Endereço Fictício)",
    neighborhood: "Ipiranga",
    city: "São Paulo",
    state: "SP",
    zipCode: "04208-000",
    distanceKm: 3.4,
    openingHours: "Seg a Sáb: 08h às 21h • Dom: 08h às 13h",
    planId: "basico",
    deliveryAvailable: false,
    deliveryInfo: "Entrega em fase de integração futura.",
    isDemo: true,
    status: "ativo",
    lastCatalogUpdate: "Hoje, às 07:55",
    coverImage:
      "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=900&q=80",
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "oleo-soja-900ml",
    name: "Óleo de Soja Refinado",
    brand: "Liza (Fictício)",
    categoryId: "mercearia",
    sizeLabel: "900 ml",
    unitType: "L",
    unitMultiplier: 0.9,
    imageUrl:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80",
    isPopular: true,
    isDemo: true,
    description:
      "Óleo de soja 900 ml para preparo diário de alimentos. Produto padronizado para comparação exata entre mercados.",
  },
  {
    id: "arroz-5kg",
    name: "Arroz Branco Tipo 1",
    brand: "Camil (Fictício)",
    categoryId: "mercearia",
    sizeLabel: "5 kg",
    unitType: "kg",
    unitMultiplier: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80",
    isPopular: true,
    isDemo: true,
    description:
      "Pacote de 5 kg de arroz agulhinha tipo 1. Comparado exclusivamente com pacotes equivalentes de 5 kg.",
  },
  {
    id: "arroz-1kg",
    name: "Arroz Branco Tipo 1",
    brand: "Camil (Fictício)",
    categoryId: "mercearia",
    sizeLabel: "1 kg",
    unitType: "kg",
    unitMultiplier: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80",
    isPopular: false,
    isDemo: true,
    description:
      "Pacote de 1 kg de arroz tipo 1. Separado da versão de 5 kg para garantir comparação justa.",
  },
  {
    id: "leite-integral-1l",
    name: "Leite UHT Integral",
    brand: "Piracanjuba (Fictício)",
    categoryId: "laticinios",
    sizeLabel: "1 L",
    unitType: "L",
    unitMultiplier: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=80",
    isPopular: true,
    isDemo: true,
    description: "Leite longa vida integral em embalagem de 1 litro.",
  },
  {
    id: "feijao-carioca-1kg",
    name: "Feijão Carioca Tipo 1",
    brand: "Kicaldo (Fictício)",
    categoryId: "mercearia",
    sizeLabel: "1 kg",
    unitType: "kg",
    unitMultiplier: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=500&q=80",
    isPopular: true,
    isDemo: true,
    description: "Feijão carioca selecionado em pacote de 1 kg.",
  },
  {
    id: "cafe-torrado-500g",
    name: "Café Torrado e Moído Tradicional",
    brand: "Pilão (Fictício)",
    categoryId: "mercearia",
    sizeLabel: "500 g",
    unitType: "kg",
    unitMultiplier: 0.5,
    imageUrl:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=500&q=80",
    isPopular: true,
    isDemo: true,
    description: "Café tradicional a vácuo 500 g. O comparador exibe também o preço calculado por kg.",
  },
  {
    id: "banana-prata-1kg",
    name: "Banana Prata Selecionada",
    brand: "Hortifruti Local",
    categoryId: "hortifruti",
    sizeLabel: "1 kg",
    unitType: "kg",
    unitMultiplier: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=80",
    isPopular: true,
    isDemo: true,
    description: "Banana prata fresca vendida por quilo.",
  },
  {
    id: "maca-gala-1kg",
    name: "Maçã Gala Nacional",
    brand: "Hortifruti Local",
    categoryId: "hortifruti",
    sizeLabel: "1 kg",
    unitType: "kg",
    unitMultiplier: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=80",
    isPopular: false,
    isDemo: true,
    description: "Maçã gala fresca por quilo.",
  },
  {
    id: "sabao-po-1600g",
    name: "Lava-Roupas em Pó Lavagem Perfeita",
    brand: "Omo (Fictício)",
    categoryId: "limpeza",
    sizeLabel: "1,6 kg",
    unitType: "kg",
    unitMultiplier: 1.6,
    imageUrl:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=500&q=80",
    isPopular: true,
    isDemo: true,
    description: "Sabão em pó caixa 1,6 kg com cálculo automático de preço por quilo.",
  },
  {
    id: "detergente-neutro-500ml",
    name: "Lava-Louças Líquido Neutro",
    brand: "Ypê (Fictício)",
    categoryId: "limpeza",
    sizeLabel: "500 ml",
    unitType: "L",
    unitMultiplier: 0.5,
    imageUrl:
      "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=500&q=80",
    isPopular: false,
    isDemo: true,
    description: "Detergente líquido neutro em frasco de 500 ml.",
  },
  {
    id: "papel-higienico-12un",
    name: "Papel Higiênico Folha Dupla Neutro",
    brand: "Neve (Fictício)",
    categoryId: "higiene",
    sizeLabel: "12 rolos (30m)",
    unitType: "rolo",
    unitMultiplier: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=500&q=80",
    isPopular: true,
    isDemo: true,
    description: "Pacote com 12 rolos de folha dupla. Calcula o preço individual por rolo.",
  },
  {
    id: "pao-forma-integral-400g",
    name: "Pão de Forma Integral com Grãos",
    brand: "Pullman (Fictício)",
    categoryId: "padaria",
    sizeLabel: "400 g",
    unitType: "kg",
    unitMultiplier: 0.4,
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
    isPopular: false,
    isDemo: true,
    description: "Pão de forma integral pacote de 400 g.",
  },
  {
    id: "suco-laranja-1l",
    name: "Suco de Laranja Integral",
    brand: "Natural One (Fictício)",
    categoryId: "bebidas",
    sizeLabel: "900 ml",
    unitType: "L",
    unitMultiplier: 0.9,
    imageUrl:
      "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=80",
    isPopular: true,
    isDemo: true,
    description: "Suco de laranja 100% integral refrigerado 900 ml.",
  },
];

export const INITIAL_PRICES: MarketPrice[] = [
  // Óleo de soja 900ml (exatamente como na referência enviada!)
  {
    id: "p-1",
    marketId: "mercado-a",
    productId: "oleo-soja-900ml",
    price: 8.49,
    inStock: true,
    isPromo: false,
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
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-3",
    marketId: "mercado-c",
    productId: "oleo-soja-900ml",
    price: 7.99,
    inStock: true,
    isPromo: false,
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-4",
    marketId: "mercado-d",
    productId: "oleo-soja-900ml",
    price: 7.69,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 07:55",
  },

  // Arroz 5kg (como na referência Mercado A R$ 29,90 vs Mercado B R$ 24,90 -> Economia R$ 5,00)
  {
    id: "p-5",
    marketId: "mercado-a",
    productId: "arroz-5kg",
    price: 29.9,
    inStock: true,
    isPromo: false,
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
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-7",
    marketId: "mercado-c",
    productId: "arroz-5kg",
    price: 27.5,
    inStock: true,
    isPromo: false,
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-8",
    marketId: "mercado-d",
    productId: "arroz-5kg",
    price: 26.8,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 07:55",
  },

  // Arroz 1kg (para mostrar que pacotes de tamanhos diferentes não são misturados)
  {
    id: "p-9",
    marketId: "mercado-a",
    productId: "arroz-1kg",
    price: 6.49,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-10",
    marketId: "mercado-b",
    productId: "arroz-1kg",
    price: 5.99,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-11",
    marketId: "mercado-c",
    productId: "arroz-1kg",
    price: 6.29,
    inStock: true,
    isPromo: false,
    updatedAt: "Ontem, 18:20",
  },

  // Leite UHT Integral 1L (inspirado na foto da busca de leite integral: R$ 4,99 / R$ 5,50 / R$ 5,00)
  {
    id: "p-12",
    marketId: "mercado-a",
    productId: "leite-integral-1l",
    price: 4.99,
    regularPrice: 5.79,
    inStock: true,
    isPromo: true,
    promoLabel: "Menor Preço",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-13",
    marketId: "mercado-b",
    productId: "leite-integral-1l",
    price: 5.49,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-14",
    marketId: "mercado-c",
    productId: "leite-integral-1l",
    price: 5.15,
    inStock: true,
    isPromo: false,
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-15",
    marketId: "mercado-d",
    productId: "leite-integral-1l",
    price: 5.29,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 07:55",
  },

  // Feijão Carioca 1kg
  {
    id: "p-16",
    marketId: "mercado-a",
    productId: "feijao-carioca-1kg",
    price: 7.89,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-17",
    marketId: "mercado-b",
    productId: "feijao-carioca-1kg",
    price: 7.49,
    inStock: true,
    isPromo: false,
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
    updatedAt: "Ontem, 18:20",
  },
  {
    id: "p-19",
    marketId: "mercado-d",
    productId: "feijao-carioca-1kg",
    price: 7.65,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 07:55",
  },

  // Café 500g
  {
    id: "p-20",
    marketId: "mercado-a",
    productId: "cafe-torrado-500g",
    price: 18.9,
    regularPrice: 21.5,
    inStock: true,
    isPromo: true,
    promoLabel: "Oferta Especial",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-21",
    marketId: "mercado-b",
    productId: "cafe-torrado-500g",
    price: 19.8,
    inStock: true,
    isPromo: false,
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
    updatedAt: "Há 6 dias",
  },

  // Banana Prata 1kg
  {
    id: "p-23",
    marketId: "mercado-a",
    productId: "banana-prata-1kg",
    price: 6.99,
    inStock: true,
    isPromo: false,
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
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-25",
    marketId: "mercado-c",
    productId: "banana-prata-1kg",
    price: 5.99,
    inStock: true,
    isPromo: false,
    updatedAt: "Ontem, 18:20",
  },

  // Maçã Gala 1kg
  {
    id: "p-26",
    marketId: "mercado-a",
    productId: "maca-gala-1kg",
    price: 11.9,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-27",
    marketId: "mercado-b",
    productId: "maca-gala-1kg",
    price: 10.49,
    inStock: true,
    isPromo: false,
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
    updatedAt: "Hoje, 07:55",
  },

  // Sabão em Pó 1,6kg
  {
    id: "p-29",
    marketId: "mercado-a",
    productId: "sabao-po-1600g",
    price: 22.9,
    inStock: true,
    isPromo: false,
    needsUpdateAlert: true,
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
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-31",
    marketId: "mercado-c",
    productId: "sabao-po-1600g",
    price: 21.5,
    inStock: false, // Indisponível para demonstrar filtro de disponibilidade e alerta na cesta
    isPromo: false,
    updatedAt: "Ontem, 18:20",
  },

  // Detergente 500ml
  {
    id: "p-32",
    marketId: "mercado-a",
    productId: "detergente-neutro-500ml",
    price: 2.39,
    inStock: true,
    isPromo: false,
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
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-34",
    marketId: "mercado-c",
    productId: "detergente-neutro-500ml",
    price: 2.49,
    inStock: true,
    isPromo: false,
    updatedAt: "Ontem, 18:20",
  },

  // Papel Higiênico 12 rolos
  {
    id: "p-35",
    marketId: "mercado-a",
    productId: "papel-higienico-12un",
    price: 16.9,
    regularPrice: 19.9,
    inStock: true,
    isPromo: true,
    promoLabel: "-15% OFF",
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-36",
    marketId: "mercado-b",
    productId: "papel-higienico-12un",
    price: 17.5,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 09:15",
  },
  {
    id: "p-37",
    marketId: "mercado-c",
    productId: "papel-higienico-12un",
    price: 18.2,
    inStock: true,
    isPromo: false,
    updatedAt: "Ontem, 18:20",
  },

  // Pão de Forma Integral 400g
  {
    id: "p-38",
    marketId: "mercado-a",
    productId: "pao-forma-integral-400g",
    price: 8.99,
    inStock: true,
    isPromo: false,
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
    updatedAt: "Hoje, 09:15",
  },

  // Suco de Laranja 900ml
  {
    id: "p-40",
    marketId: "mercado-a",
    productId: "suco-laranja-1l",
    price: 11.49,
    inStock: true,
    isPromo: false,
    updatedAt: "Hoje, 08:40",
  },
  {
    id: "p-41",
    marketId: "mercado-b",
    productId: "suco-laranja-1l",
    price: 10.9,
    inStock: true,
    isPromo: false,
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

export function calculateUnitPrice(price: number, product: Product): {
  value: number;
  formatted: string;
} {
  const unitValue = price / (product.unitMultiplier || 1);
  return {
    value: unitValue,
    formatted: `${formatBRL(unitValue)}/${product.unitType}`,
  };
}
