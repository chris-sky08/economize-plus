"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Search,
  Star,
  Store,
  TrendingDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  TRANSPARENCY_DISCLAIMER,
  calculateUnitPrice,
  formatBRL,
} from "@/lib/format";
import ProductComparisonCard from "@/components/ProductComparisonCard";
import SkeletonCard from "@/components/SkeletonCard";
import { triggerFeedbackModal } from "@/components/FeedbackWidget";
import { ECONOMIZE_ICONS, getCategoryIconSrc } from "@/lib/icons";

const SUPER_APP_SHORTCUTS = [
  {
    id: "atalho-ean",
    title: "Leitor Código EAN",
    subtitle: "Compare a mesma embalagem",
    href: "/buscar",
    iconSrc: ECONOMIZE_ICONS["scanner-ean"].src,
    badge: "EAN-13",
    badgeClass: "bg-brand-blue text-white",
  },
  {
    id: "atalho-cesta",
    title: "Lista Inteligente",
    subtitle: "Cesta completa vs. parcial",
    href: "/lista",
    iconSrc: ECONOMIZE_ICONS["minha-cesta"].src,
    badge: "Cesta",
    badgeClass: "bg-brand-green text-brand-navy",
  },
  {
    id: "atalho-medida",
    title: "Preço por Quilo/Litro",
    subtitle: "Cálculo R$/kg e R$/L",
    href: "/buscar",
    iconSrc: ECONOMIZE_ICONS["preco-medida"].src,
    badge: "Proporcional",
    badgeClass: "bg-brand-yellow text-brand-navy",
  },
  {
    id: "atalho-mercados",
    title: "Mercados Próximos",
    subtitle: "Distância real por CEP/GPS",
    href: "/mercados",
    iconSrc: ECONOMIZE_ICONS["qr-supermercado-ativo"].src,
    badge: "Local",
    badgeClass: "bg-brand-navy text-white",
  },
  {
    id: "atalho-qrcode",
    title: "Kit QR Code Lojas",
    subtitle: "Cartazes prontos para imprimir",
    href: "/divulgacao",
    iconSrc: ECONOMIZE_ICONS["qr-geral"].src,
    badge: "Divulgação",
    badgeClass: "bg-brand-blue text-white",
  },
];

const RETAIL_PILLARS = [
  {
    id: "pilar-ean",
    iconSrc: ECONOMIZE_ICONS["scanner-ean"].src,
    title: "Comparação Justa por EAN",
    desc: "Nunca misturamos tamanhos ou pesos diferentes: cada embalagem possui seu código de barras único.",
  },
  {
    id: "pilar-medida",
    iconSrc: ECONOMIZE_ICONS["preco-medida"].src,
    title: "Preço por Quilo e Litro",
    desc: "Veja na hora o valor total e o preço proporcional calculado por medida (R$/kg, R$/L ou R$/un).",
  },
  {
    id: "pilar-cesta",
    iconSrc: ECONOMIZE_ICONS["cesta-completa"].src,
    title: "Cesta Completa vs. Parcial",
    desc: "Itens sem estoque ou sem preço nunca entram como R$ 0,00: separamos cestas completas de parciais.",
  },
  {
    id: "pilar-fonte",
    iconSrc: ECONOMIZE_ICONS["fonte-rastreavel"].src,
    title: "Fonte e Horário da Coleta",
    desc: "Saiba sempre de onde veio o preço (planilha do parceiro, encarte revisado ou coleta em loja) e o horário exato.",
  },
];

export default function HomePage() {
  const {
    categories,
    products,
    markets,
    prices,
    location,
    shoppingList,
    catalogLoading,
    addToList,
    setIsLocationModalOpen,
  } = useApp();

  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("todos");
  const [homeFeedbackRating, setHomeFeedbackRating] = useState<number>(5);

  const activeMarkets = useMemo(
    () =>
      markets
        .filter(
          (m) =>
            m.status === "ativo" &&
            (m.distanceKm === null || m.distanceKm <= location.maxRadiusKm)
        )
        .sort((a, b) => {
          if (a.distanceKm === null && b.distanceKm === null) return 0;
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        }),
    [markets, location.maxRadiusKm]
  );

  // Produtos com preços publicados para o comparativo rápido do topo
  const productsWithPrices = useMemo(() => {
    return products.filter((prod) =>
      prices.some(
        (p) =>
          p.productId === prod.id &&
          p.inStock &&
          activeMarkets.some((m) => m.id === p.marketId)
      )
    );
  }, [products, prices, activeMarkets]);

  const featuredProducts = useMemo(
    () => productsWithPrices.slice(0, 4),
    [productsWithPrices]
  );

  const [selectedFeaturedId, setSelectedFeaturedId] = useState<string | null>(
    null
  );

  const selectedFeaturedProduct =
    featuredProducts.find((p) => p.id === selectedFeaturedId) ||
    featuredProducts[0] ||
    null;

  const featuredComparisonEntries = useMemo(() => {
    if (!selectedFeaturedProduct) return [];
    return prices
      .filter((p) => p.productId === selectedFeaturedProduct.id && p.inStock)
      .map((priceEntry) => {
        const market = activeMarkets.find(
          (m) => m.id === priceEntry.marketId
        );
        return market ? { market, priceEntry } : null;
      })
      .filter(Boolean) as Array<{
      market: (typeof markets)[0];
      priceEntry: (typeof prices)[0];
    }>;
  }, [selectedFeaturedProduct, prices, activeMarkets]);

  const sortedFeatured = useMemo(
    () =>
      [...featuredComparisonEntries].sort(
        (a, b) => a.priceEntry.price - b.priceEntry.price
      ),
    [featuredComparisonEntries]
  );
  const lowestFeatured = sortedFeatured[0] || null;
  const highestFeatured =
    sortedFeatured.length > 1
      ? sortedFeatured[sortedFeatured.length - 1]
      : null;
  const featuredSavings =
    lowestFeatured && highestFeatured
      ? highestFeatured.priceEntry.price - lowestFeatured.priceEntry.price
      : 0;

  const filteredProducts = useMemo(() => {
    const base =
      selectedCategoryFilter === "todos"
        ? productsWithPrices
        : productsWithPrices.filter(
            (p) => p.categoryId === selectedCategoryFilter
          );
    return base.slice(0, 8);
  }, [productsWithPrices, selectedCategoryFilter]);

  // Cálculo dinâmico e ordenado da Lista de Compras Inteligente na Home
  const activeListItems = useMemo(
    () => shoppingList.filter((i) => i.checked),
    [shoppingList]
  );

  const homeBasketSummaries = useMemo(() => {
    const computed = activeMarkets.map((market) => {
      let subtotal = 0;
      let foundCount = 0;

      activeListItems.forEach((item) => {
        const mp = prices.find(
          (p) =>
            p.marketId === market.id &&
            p.productId === item.productId &&
            p.inStock
        );
        if (mp) {
          subtotal += mp.price * item.quantity;
          foundCount += 1;
        }
      });

      const missingCount = activeListItems.length - foundCount;
      const isComplete =
        activeListItems.length > 0 && missingCount === 0 && subtotal > 0;

      return {
        market,
        subtotal,
        foundCount,
        missingCount,
        isComplete,
      };
    });

    return computed.sort((a, b) => {
      if (a.isComplete && !b.isComplete) return -1;
      if (!a.isComplete && b.isComplete) return 1;
      return a.subtotal - b.subtotal;
    });
  }, [activeMarkets, activeListItems, prices]);

  const bestCompleteHomeMarketId =
    homeBasketSummaries.find((s) => s.isComplete)?.market.id || null;

  return (
    <div className="space-y-12 pb-12">
      {/* 1. SUPER VITRINE HERO VAREJO ESTILO MAGALU + COMPARADOR AO VIVO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E6F7FB] via-[#F4FAFC] to-transparent pt-5 pb-6 sm:pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
            {/* Palco Varejo Principal (Esquerda) */}
            <div className="relative flex min-w-0 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-[#084B8A] to-brand-blue p-5 text-white shadow-xl sm:p-8 lg:col-span-7">
              {/* Faixa superior tricolor */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-yellow via-brand-green to-brand-blue"
              />

              <div className="relative z-10 grid grid-cols-1 items-center gap-6 md:grid-cols-12">
                <div className="md:col-span-7">
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-3.5 py-1 text-xs font-extrabold text-brand-navy shadow-sm">
                    <img
                      src={ECONOMIZE_ICONS["scanner-ean"].src}
                      alt=""
                      className="h-4 w-4 rounded-full bg-white object-cover"
                    />
                    <span>Super-App de Comparação Local</span>
                  </div>

                  <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:leading-[1.12]">
                    Compare preços nos mercados da sua região e{" "}
                    <span className="text-brand-yellow">
                      economize na cesta inteira.
                    </span>
                  </h1>

                  <p className="mt-3 text-sm leading-relaxed text-brand-light sm:text-base">
                    Consulte ofertas publicadas por supermercados parceiros ou
                    coletadas em loja, compare embalagens idênticas pelo código
                    EAN e confira o preço por quilo ou litro antes de sair de
                    casa.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href="/buscar"
                      className="inline-flex min-h-[46px] items-center gap-2.5 rounded-2xl bg-brand-yellow px-5 py-3 text-sm font-extrabold text-brand-navy shadow-md transition hover:bg-amber-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      <img
                        src={ECONOMIZE_ICONS["scanner-ean"].src}
                        alt=""
                        className="h-6 w-6 rounded-full bg-white object-cover shadow-2xs"
                      />
                      Comparar preços agora
                    </Link>

                    <Link
                      href="/lista"
                      className="inline-flex min-h-[46px] items-center gap-2.5 rounded-2xl border-2 border-white/30 bg-white/12 px-4 py-3 text-sm font-bold text-white backdrop-blur-xs transition hover:bg-white/22 active:scale-95"
                    >
                      <img
                        src={ECONOMIZE_ICONS["minha-cesta"].src}
                        alt=""
                        className="h-6 w-6 rounded-full bg-white object-cover shadow-2xs"
                      />
                      Montar Lista Inteligente
                    </Link>
                  </div>
                </div>

                {/* Arte 3D Realista da Vitrine Principal */}
                <div className="flex justify-center md:col-span-5">
                  <div className="relative w-full max-w-[260px] overflow-hidden rounded-3xl border-4 border-brand-yellow/80 bg-brand-light shadow-2xl">
                    <img
                      src={ECONOMIZE_ICONS["hero-magalu"].src}
                      alt="Carrinho de supermercado Economize+ com produtos reais comparados por código de barras"
                      className="aspect-square h-full w-full object-cover"
                    />
                    <div className="absolute right-2.5 bottom-2.5 left-2.5 flex items-center gap-2 rounded-2xl bg-brand-navy/95 px-3 py-2 text-[11px] font-bold text-white shadow-md backdrop-blur-xs">
                      <img
                        src={ECONOMIZE_ICONS["fonte-rastreavel"].src}
                        alt=""
                        className="h-5 w-5 shrink-0 rounded-full bg-white object-cover"
                      />
                      <span>Fonte e horário reais em cada item</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé do Palco Hero com Selos Rápidos */}
              <div className="relative z-10 mt-6 grid grid-cols-1 gap-2.5 border-t border-white/15 pt-4 text-xs sm:grid-cols-3">
                <div className="flex items-center gap-2 text-brand-light">
                  <img
                    src={ECONOMIZE_ICONS["preco-medida"].src}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full bg-white object-cover"
                  />
                  <span>Cálculo automático R$/kg e R$/L</span>
                </div>
                <div className="flex items-center gap-2 text-brand-light">
                  <img
                    src={ECONOMIZE_ICONS["cesta-completa"].src}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full bg-white object-cover"
                  />
                  <span>Separação de cesta completa e parcial</span>
                </div>
                <div className="flex items-center gap-2 text-brand-light">
                  <img
                    src={ECONOMIZE_ICONS["passo-cep-gps"].src}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full bg-white object-cover"
                  />
                  <span>Raio configurável por CEP ou GPS</span>
                </div>
              </div>
            </div>

            {/* Card "Compare o Mesmo Produto Ao Vivo" (Direita) */}
            <div className="flex min-w-0 flex-col justify-between rounded-3xl border-2 border-brand-blue/25 bg-white p-5 shadow-lg sm:p-6 lg:col-span-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={ECONOMIZE_ICONS["scanner-ean"].src}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-brand-blue/30 bg-white object-cover shadow-2xs"
                    />
                    <div>
                      <span className="inline-block rounded-md bg-brand-yellow px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-brand-navy">
                        Comparativo Instantâneo
                      </span>
                      <h2 className="font-heading text-base font-extrabold text-brand-navy sm:text-lg">
                        Compare o mesmo produto
                      </h2>
                    </div>
                  </div>

                  {featuredProducts.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                      {featuredProducts.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => setSelectedFeaturedId(prod.id)}
                          className={`min-h-[38px] rounded-xl px-2.5 py-1 text-xs font-bold transition active:scale-95 ${
                            selectedFeaturedProduct?.id === prod.id
                              ? "bg-brand-navy text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-brand-light hover:text-brand-navy"
                          }`}
                        >
                          {prod.name.split(" ")[0]} {prod.sizeLabel || ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {catalogLoading ? (
                  <div className="mt-4 animate-pulse space-y-3 py-6">
                    <div className="h-16 w-full rounded-2xl bg-slate-100" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-20 rounded-2xl bg-slate-100" />
                      <div className="h-20 rounded-2xl bg-slate-100" />
                      <div className="h-20 rounded-2xl bg-slate-100" />
                    </div>
                  </div>
                ) : !selectedFeaturedProduct ? (
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
                    <img
                      src={ECONOMIZE_ICONS["qr-supermercado-ativo"].src}
                      alt=""
                      className="mx-auto h-14 w-14 rounded-full bg-white object-cover shadow-xs"
                    />
                    <p className="mt-3 font-heading text-sm font-bold text-brand-navy">
                      Nenhum preço publicado na sua região ainda
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Assim que mercados parceiros ou coletas presenciais forem
                      publicados perto de você, o comparativo aparecerá aqui sem
                      dados fictícios.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsLocationModalOpen(true)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white hover:bg-brand-blue"
                      >
                        <img
                          src={ECONOMIZE_ICONS["passo-cep-gps"].src}
                          alt=""
                          className="h-5 w-5 rounded-full bg-white object-cover"
                        />
                        Definir CEP ou GPS
                      </button>
                      <Link
                        href="/seja-parceiro"
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-brand-navy hover:border-brand-blue"
                      >
                        <img
                          src={ECONOMIZE_ICONS["seja-parceiro"].src}
                          alt=""
                          className="h-5 w-5 rounded-full bg-white object-cover"
                        />
                        Cadastrar mercado
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 flex items-center gap-3.5 rounded-2xl bg-slate-50/90 p-3">
                      <div className="flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5">
                        {selectedFeaturedProduct.imageUrl ? (
                          <img
                            src={selectedFeaturedProduct.imageUrl}
                            alt={selectedFeaturedProduct.name}
                            className="h-full w-full rounded-xl object-contain"
                          />
                        ) : (
                          <img
                            src={getCategoryIconSrc(
                              selectedFeaturedProduct.categoryId
                            )}
                            alt={selectedFeaturedProduct.name}
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-flex items-center gap-1 rounded-md bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand-navy">
                          {selectedFeaturedProduct.brand || "Marca registrada"}
                          {selectedFeaturedProduct.ean
                            ? ` • EAN ${selectedFeaturedProduct.ean}`
                            : ""}
                        </span>
                        <h3 className="mt-1 truncate font-heading text-sm font-extrabold text-brand-navy sm:text-base">
                          {selectedFeaturedProduct.name}
                          {selectedFeaturedProduct.sizeLabel
                            ? ` — ${selectedFeaturedProduct.sizeLabel}`
                            : ""}
                        </h3>
                        {lowestFeatured && (
                          <p className="tabular-price text-xs font-semibold text-emerald-700">
                            Menor valor: {formatBRL(lowestFeatured.priceEntry.price)}
                            {(() => {
                              const u = calculateUnitPrice(
                                lowestFeatured.priceEntry.price,
                                selectedFeaturedProduct
                              );
                              return u ? ` (${u.formatted})` : "";
                            })()}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addToList(selectedFeaturedProduct.id, 1)}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-blue active:scale-95"
                      >
                        <img
                          src={ECONOMIZE_ICONS["minha-cesta"].src}
                          alt=""
                          className="h-4 w-4 rounded-full bg-white object-cover"
                        />
                        + Cesta
                      </button>
                    </div>

                    <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {sortedFeatured
                        .slice(0, 3)
                        .map(({ market, priceEntry }) => {
                          const isLowest =
                            lowestFeatured?.market.id === market.id;
                          return (
                            <div
                              key={market.id}
                              className={`rounded-2xl border p-3 transition ${
                                isLowest
                                  ? "border-2 border-brand-green bg-emerald-50/60 shadow-2xs"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate text-xs font-bold text-brand-navy">
                                  {market.shortName}
                                </span>
                                {isLowest && (
                                  <span className="rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-extrabold text-brand-navy">
                                    Menor
                                  </span>
                                )}
                              </div>
                              <p
                                className={`tabular-price mt-1 font-heading text-lg font-extrabold ${
                                  isLowest
                                    ? "text-emerald-700"
                                    : "text-brand-navy"
                                }`}
                              >
                                {formatBRL(priceEntry.price)}
                              </p>
                              <p className="tabular-price mt-0.5 text-[10px] text-slate-500">
                                {market.distanceKm !== null
                                  ? `~ ${market.distanceKm} km`
                                  : priceEntry.updatedAt}
                              </p>
                            </div>
                          );
                        })}
                    </div>

                    {lowestFeatured && highestFeatured && featuredSavings > 0 && (
                      <div className="mt-3.5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3">
                        <img
                          src={ECONOMIZE_ICONS["passo-economia"].src}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full bg-white object-cover shadow-2xs"
                        />
                        <div>
                          <p className="text-xs font-extrabold text-brand-navy">
                            Menor preço publicado:{" "}
                            {lowestFeatured.market.shortName}
                          </p>
                          <p className="tabular-price text-xs font-semibold text-emerald-800">
                            Economia de {formatBRL(featuredSavings)} por unidade
                            em relação ao {highestFeatured.market.shortName}.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <p className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
                {TRANSPARENCY_DISCLAIMER}.
              </p>
            </div>
          </div>

          {/* Barra de Super-Atalhos Estilo Super-App Magalu (com Posição 1: Avaliar & Relatar Bug) */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SUPER_APP_SHORTCUTS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs transition hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-md active:scale-98"
              >
                <img
                  src={item.iconSrc}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full border border-slate-100 bg-white object-cover shadow-xs transition-transform duration-300 group-hover:scale-108"
                />
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-block rounded-full px-2 py-0.2 text-[9px] font-extrabold uppercase ${item.badgeClass}`}
                  >
                    {item.badge}
                  </span>
                  <p className="mt-0.5 truncate font-heading text-xs font-extrabold text-brand-navy sm:text-sm">
                    {item.title}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {item.subtitle}
                  </p>
                </div>
              </Link>
            ))}

            {/* Posição 1 Aprovada: Atalho Rápido com o Novo Ícone Realista nº 25 */}
            <button
              type="button"
              onClick={() =>
                triggerFeedbackModal({ rating: 5, category: "sugestao" })
              }
              className="group flex items-center gap-3 rounded-2xl border-2 border-brand-blue/60 bg-gradient-to-br from-white to-brand-light/70 p-3 text-left shadow-2xs transition hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-md active:scale-98"
            >
              <img
                src={ECONOMIZE_ICONS["avaliacao-feedback"].src}
                alt={ECONOMIZE_ICONS["avaliacao-feedback"].alt}
                className="h-12 w-12 shrink-0 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-xs transition-transform duration-300 group-hover:scale-108"
              />
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-full bg-brand-yellow px-2 py-0.2 text-[9px] font-extrabold uppercase text-brand-navy">
                  Opinião &amp; Bugs
                </span>
                <p className="mt-0.5 truncate font-heading text-xs font-extrabold text-brand-navy sm:text-sm">
                  Avaliar &amp; Sugerir
                </p>
                <p className="truncate text-[11px] text-slate-600">
                  Cai direto no nosso Gmail
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 2. COMPRE POR DEPARTAMENTO (ÍCONES REALISTAS DE ESTÚDIO ESTILO MAGALU) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={ECONOMIZE_ICONS.mercearia.src}
              alt=""
              className="h-11 w-11 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-xs"
            />
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue">
                Corredores do Supermercado
              </span>
              <h2 className="font-heading text-xl font-extrabold text-brand-navy sm:text-2xl">
                Compre e compare por departamento
              </h2>
            </div>
          </div>
          <Link
            href="/buscar"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-light px-4 py-2 text-xs font-extrabold text-brand-navy transition hover:bg-brand-navy hover:text-white"
          >
            Ver todos os departamentos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.id;
            return (
              <div
                key={cat.id}
                className={`group flex flex-col items-center justify-between rounded-3xl border p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  isSelected
                    ? "border-2 border-brand-navy bg-brand-light/70 shadow-md"
                    : "border-slate-200/90 bg-white shadow-2xs hover:border-brand-blue"
                }`}
              >
                <Link
                  href={`/buscar?categoria=${encodeURIComponent(cat.id)}`}
                  className="flex flex-col items-center focus:outline-none"
                >
                  <div className="relative flex h-22 w-22 items-center justify-center overflow-hidden rounded-full border-2 border-brand-yellow/60 bg-white p-0.5 shadow-sm transition-transform duration-300 group-hover:scale-108 sm:h-24 sm:w-24">
                    <img
                      src={getCategoryIconSrc(cat.id)}
                      alt={cat.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <span className="mt-3 font-heading text-sm font-extrabold text-brand-navy group-hover:text-brand-blue">
                    {cat.name}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategoryFilter((prev) =>
                      prev === cat.id ? "todos" : cat.id
                    )
                  }
                  className={`mt-2 min-h-[34px] w-full rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                    isSelected
                      ? "bg-brand-navy text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-brand-yellow hover:text-brand-navy"
                  }`}
                >
                  {isSelected ? "Filtro ativo" : "Filtrar vitrine"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. VITRINE DE PRODUTOS COM FILTRO AO VIVO POR DEPARTAMENTO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <img
                src={ECONOMIZE_ICONS["preco-medida"].src}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full border-2 border-brand-green bg-white object-cover shadow-xs"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow px-3 py-0.5 text-[11px] font-extrabold text-brand-navy">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Vitrine de Preços Publicados com Origem Rastreável
                </div>
                <h2 className="mt-1 font-heading text-xl font-extrabold text-brand-navy sm:text-2xl">
                  {location.configured && location.neighborhood
                    ? `Ofertas comparadas perto de ${location.neighborhood}`
                    : "Ofertas e produtos com preços publicados"}
                </h2>
              </div>
            </div>

            <Link
              href="/buscar"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-brand-navy px-4 py-2.5 text-xs font-extrabold text-white shadow-2xs transition hover:bg-brand-blue"
            >
              <Search className="h-4 w-4 text-brand-yellow" />
              Abrir comparador completo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Pílulas de Filtro Rápido por Corredor na Própria Vitrine */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter("todos")}
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-2xl px-3.5 py-1.5 text-xs font-extrabold transition ${
                selectedCategoryFilter === "todos"
                  ? "bg-brand-navy text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-brand-light"
              }`}
            >
              <img
                src={ECONOMIZE_ICONS["scanner-ean"].src}
                alt=""
                className="h-5 w-5 rounded-full bg-white object-cover"
              />
              Todos os corredores ({productsWithPrices.length})
            </button>

            {categories.map((cat) => {
              const active = selectedCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition ${
                    active
                      ? "bg-brand-blue text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-brand-light"
                  }`}
                >
                  <img
                    src={getCategoryIconSrc(cat.id)}
                    alt=""
                    className="h-5 w-5 rounded-full bg-white object-cover"
                  />
                  {cat.name}
                </button>
              );
            })}
          </div>

          {catalogLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-8 text-center">
              <img
                src={ECONOMIZE_ICONS["scanner-ean"].src}
                alt=""
                className="mx-auto h-16 w-16 rounded-full border-2 border-brand-blue bg-white object-cover shadow-xs"
              />
              <h3 className="mt-3 font-heading text-base font-extrabold text-brand-navy">
                Nenhum produto com preço publicado neste filtro ou raio
              </h3>
              <p className="mx-auto mt-1 max-w-lg text-xs text-slate-600">
                Seguimos nossa regra mestra: jamais exibimos preços fictícios.
                Amplie o raio de localização, selecione outro corredor ou
                cadastre um supermercado parceiro.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                {selectedCategoryFilter !== "todos" && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter("todos")}
                    className="min-h-[44px] rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white"
                  >
                    Mostrar todos os corredores
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white hover:bg-brand-blue"
                >
                  <img
                    src={ECONOMIZE_ICONS["passo-cep-gps"].src}
                    alt=""
                    className="h-5 w-5 rounded-full bg-white object-cover"
                  />
                  Configurar CEP ou Raio
                </button>
                <Link
                  href="/seja-parceiro"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-brand-navy hover:border-brand-blue"
                >
                  <img
                    src={ECONOMIZE_ICONS["seja-parceiro"].src}
                    alt=""
                    className="h-5 w-5 rounded-full bg-white object-cover"
                  />
                  Seja um Mercado Parceiro
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product) => {
                const productPrices = prices
                  .filter((p) => p.productId === product.id)
                  .map((priceEntry) => {
                    const market = activeMarkets.find(
                      (m) => m.id === priceEntry.marketId
                    );
                    return market ? { priceEntry, market } : null;
                  })
                  .filter(Boolean) as Array<{
                  priceEntry: (typeof prices)[0];
                  market: (typeof markets)[0];
                }>;

                return (
                  <ProductComparisonCard
                    key={product.id}
                    product={product}
                    productPrices={productPrices}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. OS 4 PILARES DE TRANSPARÊNCIA E CONFIANÇA NO VAREJO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RETAIL_PILLARS.map((pillar) => (
            <div
              key={pillar.id}
              className="flex items-start gap-3.5 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:border-brand-blue/40 hover:shadow-md"
            >
              <img
                src={pillar.iconSrc}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-xs"
              />
              <div>
                <h3 className="font-heading text-sm font-extrabold text-brand-navy sm:text-base">
                  {pillar.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {pillar.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. COMO FUNCIONA EM 3 PASSOS (ÍCONES 21, 22, 23) + SIMULADOR DA LISTA INTELIGENTE */}
      <section className="bg-gradient-to-b from-brand-light/80 via-brand-light/50 to-transparent py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-navy px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-yellow">
                Simples, Transparente e Local
              </span>
              <h2 className="mt-2.5 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
                Como economizar em 3 passos
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Planeje suas compras com dados auditáveis e descubra onde sua
                cesta completa custa menos perto de você.
              </p>

              <div className="mt-6 space-y-4">
                {[
                  {
                    step: "1",
                    iconSrc: ECONOMIZE_ICONS["passo-cep-gps"].src,
                    title: "Informe seu CEP ou autorize o GPS",
                    desc: "Calculamos a distância aproximada em linha reta até cada supermercado ativo na sua cidade.",
                  },
                  {
                    step: "2",
                    iconSrc: ECONOMIZE_ICONS["passo-busca-ean"].src,
                    title: "Busque produtos ou escaneie o código EAN",
                    desc: "Consultamos nosso catálogo e o Open Food Facts Brasil comparando sempre embalagens idênticas.",
                  },
                  {
                    step: "3",
                    iconSrc: ECONOMIZE_ICONS["passo-economia"].src,
                    title: "Compare o subtotal real da sua cesta",
                    desc: "Veja o subtotal em cada mercado, os itens faltantes destacados e a diferença na cesta completa.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:border-brand-blue"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={item.iconSrc}
                        alt=""
                        className="h-14 w-14 rounded-full border-2 border-brand-blue bg-white object-cover shadow-xs"
                      />
                      <span className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy font-heading text-xs font-extrabold text-brand-yellow shadow-2xs">
                        {item.step}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-extrabold text-brand-navy sm:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prévia da Lista de Compras Inteligente */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border-2 border-brand-navy/15 bg-white p-6 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={ECONOMIZE_ICONS["cesta-completa"].src}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full border border-brand-green bg-white object-cover shadow-xs"
                    />
                    <div>
                      <span className="rounded-md bg-brand-green/25 px-2 py-0.5 text-[11px] font-extrabold text-brand-navy">
                        Lista de Compras Inteligente
                      </span>
                      <h3 className="mt-0.5 font-heading text-lg font-extrabold text-brand-navy">
                        Compare sua cesta entre os mercados
                      </h3>
                    </div>
                  </div>
                  <Link
                    href="/lista"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-brand-navy px-4 py-2 text-xs font-extrabold text-white transition hover:bg-brand-blue"
                  >
                    <img
                      src={ECONOMIZE_ICONS["minha-cesta"].src}
                      alt=""
                      className="h-5 w-5 rounded-full bg-white object-cover"
                    />
                    Abrir Minha Lista ({shoppingList.length})
                  </Link>
                </div>

                {activeListItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <img
                      src={ECONOMIZE_ICONS["minha-cesta"].src}
                      alt=""
                      className="mx-auto h-16 w-16 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-xs"
                    />
                    <p className="mt-3 font-heading text-sm font-extrabold text-brand-navy">
                      Sua cesta inteligente ainda está vazia
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                      Adicione itens ou escaneie códigos de barras na página
                      Minha Lista para comparar o subtotal entre supermercados.
                    </p>
                    <Link
                      href="/lista"
                      className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-brand-green px-5 py-2.5 text-xs font-extrabold text-brand-navy shadow-xs hover:opacity-95"
                    >
                      Começar minha lista agora
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : homeBasketSummaries.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Nenhum mercado ativo encontrado no raio selecionado para
                    calcular o subtotal da sua lista.
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    {homeBasketSummaries
                      .slice(0, 3)
                      .map(({ market, subtotal, foundCount, missingCount }) => {
                        const isBestComplete =
                          bestCompleteHomeMarketId === market.id;

                        return (
                          <div
                            key={market.id}
                            className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3.5 ${
                              isBestComplete
                                ? "border-2 border-emerald-600 bg-emerald-50/60"
                                : "border-slate-200 bg-slate-50/60"
                            }`}
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-heading text-sm font-extrabold text-brand-navy">
                                  {market.shortName}
                                </span>
                                {isBestComplete && (
                                  <span className="rounded-full bg-brand-green px-2.5 py-0.5 text-[10px] font-extrabold text-brand-navy">
                                    Menor total estimado
                                  </span>
                                )}
                                {missingCount > 0 && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                    Cesta Parcial
                                  </span>
                                )}
                              </div>
                              <p className="tabular-price mt-0.5 text-xs text-slate-500">
                                ✓ Encontrados: {foundCount} de{" "}
                                {activeListItems.length} itens
                                {market.distanceKm !== null
                                  ? ` • ~ ${market.distanceKm} km`
                                  : ""}
                                {missingCount > 0 && (
                                  <span className="ml-1 font-semibold text-amber-700">
                                    ({missingCount} sem preço)
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="block text-[10px] text-slate-500">
                                Subtotal estimado
                              </span>
                              <span
                                className={`tabular-price font-heading text-lg font-extrabold ${
                                  isBestComplete
                                    ? "text-emerald-700"
                                    : "text-brand-navy"
                                }`}
                              >
                                {formatBRL(subtotal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                <p className="mt-4 text-[11px] text-slate-500">
                  * {TRANSPARENCY_DISCLAIMER}. Itens sem preço cadastrado nunca
                  são somados como zero.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MERCADOS PARCEIROS PERTO DE VOCÊ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={ECONOMIZE_ICONS["qr-supermercado-ativo"].src}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full border-2 border-brand-blue bg-white object-cover shadow-xs"
            />
            <div>
              <h2 className="font-heading text-xl font-extrabold text-brand-navy sm:text-2xl">
                Mercados parceiros perto de você
              </h2>
              <p className="text-xs text-slate-500 sm:text-sm">
                {location.configured ? (
                  <>
                    Exibindo estabelecimentos em um raio de até{" "}
                    <strong>{location.maxRadiusKm} km</strong>
                    {location.neighborhood
                      ? ` de ${location.neighborhood}`
                      : ""}{" "}
                    (distância em linha reta).
                  </>
                ) : (
                  "Defina seu CEP ou GPS para calcular a distância até cada supermercado."
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-brand-navy hover:border-brand-blue"
            >
              <img
                src={ECONOMIZE_ICONS["passo-cep-gps"].src}
                alt=""
                className="h-5 w-5 rounded-full bg-white object-cover"
              />
              Alterar raio / CEP
            </button>
            <Link
              href="/mercados"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white hover:bg-brand-blue"
            >
              Ver todos os mercados
            </Link>
          </div>
        </div>

        {activeMarkets.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
            <img
              src={ECONOMIZE_ICONS["seja-parceiro"].src}
              alt=""
              className="mx-auto h-16 w-16 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-xs"
            />
            <p className="mt-3 font-heading text-base font-extrabold text-brand-navy">
              Nenhum mercado parceiro por aqui ainda — indique um mercado
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
              Estamos expandindo o cadastro de mercados reais verificados. Você
              pode ampliar o raio de busca ou cadastrar um supermercado parceiro.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="min-h-[44px] rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white"
              >
                Configurar localização / raio
              </button>
              <Link
                href="/seja-parceiro"
                className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-green px-4 py-2 text-xs font-extrabold text-brand-navy"
              >
                Cadastrar mercado parceiro
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeMarkets.map((market) => (
              <div
                key={market.id}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="relative flex h-32 w-full items-center justify-center bg-brand-navy text-white">
                    {market.coverImage ? (
                      <img
                        src={market.coverImage}
                        alt={market.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <img
                        src={ECONOMIZE_ICONS["seja-parceiro"].src}
                        alt={market.name}
                        className="h-20 w-20 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-md"
                        loading="lazy"
                      />
                    )}
                    {market.verifiedAt && (
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-brand-navy/90 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        <CheckCircle2 className="h-3 w-3 text-brand-green" />
                        Verificado
                      </span>
                    )}
                    {market.distanceKm !== null && (
                      <span className="tabular-price absolute top-2.5 right-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-extrabold text-brand-navy shadow-2xs">
                        ~ {market.distanceKm} km
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-heading text-base font-extrabold text-brand-navy">
                      {market.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-blue" />
                      {market.neighborhood} • {market.city}/{market.state}
                    </p>
                    {market.lastCatalogUpdate && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        Atualizado em {market.lastCatalogUpdate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 p-4 pt-3">
                  <Link
                    href={`/mercados/${market.id}`}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-light py-2 text-xs font-extrabold text-brand-navy transition hover:bg-brand-navy hover:text-white"
                  >
                    <Store className="h-3.5 w-3.5" />
                    Visualizar Catálogo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. DUPLO BANNER MARKETPLACE B2B (COMERCIANTES + ENTREGADORES) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Card Mercados Parceiros */}
          <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-6 text-white shadow-lg sm:p-8 lg:col-span-7">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow px-3 py-1 text-xs font-extrabold text-brand-navy">
                  Área para Comerciantes Locais
                </span>
                <h2 className="mt-3 font-heading text-xl font-extrabold sm:text-2xl">
                  Seu supermercado onde o consumidor pesquisa antes de comprar.
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
                  Importe sua planilha CSV validada por GTIN/EAN ou extraia
                  ofertas de encartes com revisão humana obrigatória antes da
                  publicação.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/seja-parceiro"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-brand-yellow px-5 py-2.5 text-xs font-extrabold text-brand-navy shadow-sm transition hover:bg-amber-300"
                  >
                    Seja um mercado parceiro
                  </Link>
                  <Link
                    href="/painel-parceiro"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
                  >
                    Acessar Painel do Parceiro
                  </Link>
                </div>
              </div>

              <img
                src={ECONOMIZE_ICONS["seja-parceiro"].src}
                alt="Supermercado Parceiro Economize+"
                className="mx-auto h-32 w-32 shrink-0 rounded-full border-4 border-brand-yellow bg-white object-cover shadow-xl sm:h-36 sm:w-36"
              />
            </div>
          </div>

          {/* Card Entregadores & Kit QR Code */}
          <div className="flex flex-col justify-between rounded-3xl border-2 border-brand-blue/30 bg-gradient-to-br from-white via-[#F4FAFC] to-brand-light p-6 shadow-md sm:p-8 lg:col-span-5">
            <div className="flex items-center gap-4">
              <img
                src={ECONOMIZE_ICONS.entregas.src}
                alt="Entregas Economize+"
                className="h-24 w-24 shrink-0 rounded-full border-2 border-brand-blue bg-white object-cover shadow-md"
              />
              <div>
                <span className="inline-block rounded-full bg-brand-green px-2.5 py-0.5 text-[10px] font-extrabold text-brand-navy">
                  Logística & Divulgação Local
                </span>
                <h3 className="mt-1.5 font-heading text-lg font-extrabold text-brand-navy">
                  Entregas Parceiras & Kit QR Code
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Cadastre-se como entregador parceiro ou baixe os cartazes
                  oficiais com QR Code para divulgar o Economize+.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5 border-t border-slate-200/80 pt-4">
              <Link
                href="/entregas"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-navy px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-brand-blue"
              >
                Cadastro de Entregadores
              </Link>
              <Link
                href="/divulgacao"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-brand-navy/20 bg-white px-4 py-2.5 text-xs font-extrabold text-brand-navy transition hover:bg-brand-yellow"
              >
                <img
                  src={ECONOMIZE_ICONS["qr-geral"].src}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
                Baixar QR Codes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. POSIÇÃO 2 APROVADA: SEÇÃO INTERATIVA DE AVALIAÇÃO, SUGESTÕES E RELATO DE BUGS (DIRETO NO GMAIL) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border-2 border-brand-blue/50 bg-gradient-to-r from-brand-navy via-[#094D8A] to-brand-navy p-6 text-white shadow-xl sm:p-8">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-blue via-brand-green to-brand-yellow"
          />

          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <img
                src={ECONOMIZE_ICONS["avaliacao-feedback"].src}
                alt={ECONOMIZE_ICONS["avaliacao-feedback"].alt}
                className="h-20 w-20 shrink-0 rounded-full border-4 border-brand-green bg-white object-cover shadow-lg sm:h-24 sm:w-24"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-brand-yellow">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span>SUA VOZ CONSTRÓI O ECONOMIZE+</span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-extrabold text-white sm:text-2xl">
                  Encontrou algum bug, quer indicar um mercado ou sugerir uma melhoria?
                </h2>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-brand-light sm:text-sm">
                  Deixe sua avaliação aqui mesmo sem sair da página. Sua mensagem
                  é enviada direto para a equipe do Economize+ em Bertioga/SP no
                  e-mail oficial{" "}
                  <strong className="font-mono text-brand-yellow">
                    empresaeconomizemais@gmail.com
                  </strong>
                  .
                </p>

                {/* Botões Rápidos por Estrela (1 a 5) + Os 4 Canais de Atendimento */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">
                    Escolha de 1 a 5 estrelas:
                  </span>
                  {[1, 2, 3, 4, 5].map((starNum) => {
                    const isFilled = starNum <= homeFeedbackRating;
                    return (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => {
                          setHomeFeedbackRating(starNum);
                          triggerFeedbackModal({
                            rating: starNum,
                          });
                        }}
                        aria-label={`Avaliar com ${starNum} de 5 estrelas`}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition hover:scale-105 active:scale-95 ${
                          isFilled
                            ? "border-brand-yellow bg-brand-yellow/25"
                            : "border-white/25 bg-white/10 opacity-60"
                        }`}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            isFilled
                              ? "fill-brand-yellow text-brand-yellow"
                              : "text-white"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="rounded-lg bg-white/15 px-2 py-1 text-[11px] font-extrabold text-brand-yellow">
                    {homeFeedbackRating}/5 selecionada
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      triggerFeedbackModal({
                        rating: homeFeedbackRating,
                        category: "sugestao",
                      })
                    }
                    className="min-h-[36px] rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95"
                  >
                    💡 Sugestão de Melhoria
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerFeedbackModal({
                        rating: homeFeedbackRating,
                        category: "bug",
                      })
                    }
                    className="min-h-[36px] rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95"
                  >
                    🐛 Relatar um Bug
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerFeedbackModal({
                        rating: homeFeedbackRating,
                        category: "indicar_mercado",
                      })
                    }
                    className="min-h-[36px] rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95"
                  >
                    🏪 Indicar Mercado
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerFeedbackModal({
                        rating: homeFeedbackRating,
                        category: "duvida",
                      })
                    }
                    className="min-h-[36px] rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95"
                  >
                    💬 Dúvida / Conversa Conosco
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                triggerFeedbackModal({ rating: homeFeedbackRating })
              }
              className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-3 text-sm font-black text-brand-navy shadow-lg transition hover:brightness-95 active:scale-95"
            >
              <span>Avaliar Agora</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
