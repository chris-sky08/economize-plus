export type UserRole = "consumidor" | "mercado" | "entregador" | "admin";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  marketId?: string;
  supermarketIds?: string[];
}

export interface ShoppingListItem {
  productId: string;
  quantity: number;
  checked: boolean;
}

export interface LocationConfig {
  city: string | null;
  neighborhood: string | null;
  state: string | null;
  zipCode: string | null;
  lat: number | null;
  lng: number | null;
  maxRadiusKm: number;
  deviceLocationGranted: boolean;
  configured: boolean;
}

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
  cnpj: string | null;
  responsibleName: string | null;
  email: string | null;
  phone: string | null;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string | null;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  openingHours: string | null;
  planId: "basico" | "premium";
  isPartner: boolean;
  deliveryAvailable: boolean;
  deliveryInfo: string | null;
  status: "ativo" | "pendente" | "suspenso";
  verifiedAt: string | null;
  updatedAtIso: string | null;
  lastCatalogUpdate: string | null;
  coverImage: string | null;
}

export type ProductSource = "open_food_facts" | "partner" | "manual";
export type ProductDataStatus = "completo" | "pendente_revisao";

export interface Product {
  id: string;
  ean: string;
  name: string;
  brand: string | null;
  categoryId: string | null;
  sizeLabel: string | null;
  unitType: "kg" | "L" | "un" | "rolo" | null;
  unitMultiplier: number | null;
  imageUrl: string | null;
  isPopular: boolean;
  description: string | null;
  source: ProductSource;
  dataStatus: ProductDataStatus;
  offFetchedAt?: string | null;
}

export type PriceSource =
  | "partner_manual"
  | "partner_csv"
  | "flyer_ocr"
  | "nfce_qr"
  | "team_collected";

export type PriceStatus = "pendente" | "publicado" | "rejeitado";

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
  source: PriceSource;
  status: PriceStatus;
  validFrom?: string | null;
  validUntil?: string | null;
  collectedAtIso: string;
  updatedAtIso: string;
  updatedAt: string;
  sourceLabel: string;
  isStale: boolean;
  evidencePath?: string | null;
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
  status: "pre_cadastro" | "em_analise" | "aprovado" | "suspenso";
  createdAt: string;
}


export type FeedbackCategory =
  | "sugestao"
  | "bug"
  | "indicar_mercado"
  | "duvida";

export interface UserFeedback {
  id: string;
  rating: number;
  category: FeedbackCategory;
  message: string;
  senderName: string | null;
  senderContact: string | null;
  pagePath: string | null;
  emailDispatched: boolean;
  status: "novo" | "lido" | "resolvido";
  createdAt: string;
}
