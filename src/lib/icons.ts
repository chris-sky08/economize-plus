export type EconomizeIconId =
  | "mercearia"
  | "hortifruti"
  | "laticinios"
  | "bebidas"
  | "limpeza"
  | "higiene"
  | "padaria"
  | "sua-conta"
  | "minha-cesta"
  | "seja-parceiro"
  | "entregas"
  | "qr-geral"
  | "qr-busca-ean"
  | "qr-lista-inteligente"
  | "qr-mercados-parceiros"
  | "qr-supermercado-ativo"
  | "scanner-ean"
  | "preco-medida"
  | "cesta-completa"
  | "fonte-rastreavel"
  | "passo-cep-gps"
  | "passo-busca-ean"
  | "passo-economia"
  | "ciberseguranca"
  | "hero-magalu";

export interface EconomizeIconMeta {
  id: EconomizeIconId;
  src: string;
  alt: string;
}

export const ECONOMIZE_ICONS: Record<EconomizeIconId, EconomizeIconMeta> = {
  mercearia: {
    id: "mercearia",
    src: "/icons/01-mercearia.jpg",
    alt: "Ícone realista de Mercearia",
  },
  hortifruti: {
    id: "hortifruti",
    src: "/icons/02-hortifruti.jpg",
    alt: "Ícone realista de Hortifruti",
  },
  laticinios: {
    id: "laticinios",
    src: "/icons/03-laticinios.jpg",
    alt: "Ícone realista de Laticínios",
  },
  bebidas: {
    id: "bebidas",
    src: "/icons/04-bebidas.jpg",
    alt: "Ícone realista de Bebidas",
  },
  limpeza: {
    id: "limpeza",
    src: "/icons/05-limpeza.jpg",
    alt: "Ícone realista de Limpeza",
  },
  higiene: {
    id: "higiene",
    src: "/icons/06-higiene.jpg",
    alt: "Ícone realista de Higiene",
  },
  padaria: {
    id: "padaria",
    src: "/icons/07-padaria.jpg",
    alt: "Ícone realista de Padaria",
  },
  "sua-conta": {
    id: "sua-conta",
    src: "/icons/08-sua-conta.jpg",
    alt: "Ícone realista de Sua Conta",
  },
  "minha-cesta": {
    id: "minha-cesta",
    src: "/icons/09-minha-cesta.jpg",
    alt: "Ícone realista de Minha Lista e Cesta",
  },
  "seja-parceiro": {
    id: "seja-parceiro",
    src: "/icons/10-seja-parceiro.jpg",
    alt: "Ícone realista de Mercado Parceiro",
  },
  entregas: {
    id: "entregas",
    src: "/icons/11-entregas.jpg",
    alt: "Ícone realista de Entregas",
  },
  "qr-geral": {
    id: "qr-geral",
    src: "/icons/12-qr-geral.jpg",
    alt: "Ícone realista de QR Code Geral",
  },
  "qr-busca-ean": {
    id: "qr-busca-ean",
    src: "/icons/13-qr-busca-ean.jpg",
    alt: "Ícone realista de QR Code Busca EAN",
  },
  "qr-lista-inteligente": {
    id: "qr-lista-inteligente",
    src: "/icons/14-qr-lista-inteligente.jpg",
    alt: "Ícone realista de QR Code Lista Inteligente",
  },
  "qr-mercados-parceiros": {
    id: "qr-mercados-parceiros",
    src: "/icons/15-qr-mercados-parceiros.jpg",
    alt: "Ícone realista de QR Code Mercados Parceiros",
  },
  "qr-supermercado-ativo": {
    id: "qr-supermercado-ativo",
    src: "/icons/16-qr-supermercado-ativo.jpg",
    alt: "Ícone realista de Mercados Próximos",
  },
  "scanner-ean": {
    id: "scanner-ean",
    src: "/icons/17-scanner-ean.jpg",
    alt: "Ícone realista de Leitor de Código de Barras EAN",
  },
  "preco-medida": {
    id: "preco-medida",
    src: "/icons/18-preco-medida.jpg",
    alt: "Ícone realista de Preço por Quilo ou Litro",
  },
  "cesta-completa": {
    id: "cesta-completa",
    src: "/icons/19-cesta-completa.jpg",
    alt: "Ícone realista de Cesta Completa vs Parcial",
  },
  "fonte-rastreavel": {
    id: "fonte-rastreavel",
    src: "/icons/20-fonte-rastreavel.jpg",
    alt: "Ícone realista de Fonte e Horário Rastreáveis",
  },
  "passo-cep-gps": {
    id: "passo-cep-gps",
    src: "/icons/21-passo-cep-gps.jpg",
    alt: "Ícone realista de Localização CEP e GPS",
  },
  "passo-busca-ean": {
    id: "passo-busca-ean",
    src: "/icons/22-passo-busca-ean.jpg",
    alt: "Ícone realista de Busca e Comparação EAN",
  },
  "passo-economia": {
    id: "passo-economia",
    src: "/icons/23-passo-economia.jpg",
    alt: "Ícone realista de Economia na Cesta",
  },
  ciberseguranca: {
    id: "ciberseguranca",
    src: "/icons/24-ciberseguranca.jpg",
    alt: "Ícone realista de Cibersegurança e Proteção de Dados",
  },
  "hero-magalu": {
    id: "hero-magalu",
    src: "/icons/hero-magalu-economize.jpg",
    alt: "Vitrine de Compras Economize+",
  },
};

export function getCategoryIconSrc(categoryId?: string | null): string {
  if (!categoryId) return ECONOMIZE_ICONS.mercearia.src;
  const map: Record<string, string> = {
    mercearia: ECONOMIZE_ICONS.mercearia.src,
    hortifruti: ECONOMIZE_ICONS.hortifruti.src,
    laticinios: ECONOMIZE_ICONS.laticinios.src,
    bebidas: ECONOMIZE_ICONS.bebidas.src,
    limpeza: ECONOMIZE_ICONS.limpeza.src,
    higiene: ECONOMIZE_ICONS.higiene.src,
    padaria: ECONOMIZE_ICONS.padaria.src,
  };
  return map[categoryId] || ECONOMIZE_ICONS.mercearia.src;
}
