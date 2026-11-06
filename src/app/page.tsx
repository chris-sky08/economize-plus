"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Croissant,
  CupSoda,
  HeartHandshake,
  ListChecks,
  MapPin,
  Milk,
  Package,
  Search,
  Sparkles,
  Store,
  Tag,
  TrendingDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { TRANSPARENCY_DISCLAIMER, formatBRL } from "@/lib/format";
import ProductComparisonCard from "@/components/ProductComparisonCard";
import SkeletonCard from "@/components/SkeletonCard";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  mercearia: (
    <img
      src="/icons/01-mercearia.jpg"
      alt="Mercearia"
      className="h-full w-full rounded-full object-cover"
    />
  ),
  hortifruti: (
    <img
      src="/icons/02-hortifruti.jpg"
      alt="Hortifruti"
      className="h-full w-full rounded-full object-cover"
    />
  ),
  laticinios: (
    <img
      src="/icons/03-laticinios.jpg"
      alt="Laticínios"
      className="h-full w-full rounded-full object-cover"
    />
  ),
  bebidas: (
    <img
      src="/icons/04-bebidas.jpg"
      alt="Bebidas"
      className="h-full w-full rounded-full object-cover"
    />
  ),
  limpeza: (
    <img
      src="/icons/05-limpeza.jpg"
      alt="Limpeza"
      className="h-full w-full rounded-full object-cover"
    />
  ),
  higiene: (
    <img
      src="/icons/06-higiene.jpg"
      alt="Higiene"
      className="h-full w-full rounded-full object-cover"
    />
  ),
  padaria: (
    <img
      src="/icons/07-padaria.jpg"
      alt="Padaria"
      className="h-full w-full rounded-full object-cover"
    />
  ),
};

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
    () => productsWithPrices.slice(0, 3),
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
      .filter(
        (p) => p.productId === selectedFeaturedProduct.id && p.inStock
      )
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

  const displayedProducts = useMemo(
    () => productsWithPrices.slice(0, 8),
    [productsWithPrices]
  );

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
    <div className="space-y-14 pb-8">
      {/* HERO SECTION + CARD "COMPARE O MESMO PRODUTO" */}
      <section className="bg-gradient-to-b from-brand-light via-brand-light/60 to-transparent pt-6 pb-8 sm:pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/25 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-navy shadow-2xs">
                <Tag className="h-3.5 w-3.5 text-brand-blue" />
                <span>Compare. Escolha. Economize.</span>
              </div>

              <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
                Compare preços.{" "}
                <span className="text-brand-blue">
                  Escolha melhor na sua região.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Consulte preços publicados por mercados parceiros ou coletados
                em loja, compare embalagens idênticas pelo código EAN e veja o
                horário real de cada atualização.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/buscar"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-blue active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                >
                  <Search className="h-4 w-4" />
                  Comparar preços
                </Link>
                <Link
                  href="/lista"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-brand-navy bg-white px-5 py-3 text-sm font-bold text-brand-navy transition hover:bg-brand-light active:scale-95"
                >
                  <ListChecks className="h-4 w-4" />
                  Monte sua lista de compras
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-brand-blue" />
                  Gratuito para consumidores
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-brand-blue" />
                  Cálculo proporcional por quilo, litro ou unidade
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-brand-blue" />
                  Origem e data/hora de cada preço visíveis
                </span>
              </div>
            </div>

            {/* Card "Compare o mesmo produto" */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-brand-navy sm:text-xl">
                      Compare o mesmo produto
                    </h2>
                    <p className="text-xs text-slate-500">
                      Embalagens padronizadas com código de barras EAN.
                    </p>
                  </div>

                  {featuredProducts.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {featuredProducts.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => setSelectedFeaturedId(prod.id)}
                          className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                            selectedFeaturedProduct?.id === prod.id
                              ? "bg-brand-navy text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                    <Store className="mx-auto h-8 w-8 text-brand-blue" />
                    <p className="mt-2 font-heading text-sm font-bold text-brand-navy">
                      Nenhum preço publicado na sua região ainda
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Assim que mercados parceiros ou coletas presenciais forem
                      publicados perto de você, o comparativo aparecerá aqui.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsLocationModalOpen(true)}
                        className="min-h-[44px] rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white hover:bg-brand-blue"
                      >
                        Definir CEP ou GPS
                      </button>
                      <Link
                        href="/seja-parceiro"
                        className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-brand-navy hover:border-brand-blue"
                      >
                        Indicar ou cadastrar mercado
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 flex items-center gap-4 border-b border-slate-100 pb-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-1.5">
                        {selectedFeaturedProduct.imageUrl ? (
                          <img
                            src={selectedFeaturedProduct.imageUrl}
                            alt={selectedFeaturedProduct.name}
                            className="h-full w-full rounded-xl object-contain"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="inline-block rounded-md bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-navy">
                          {selectedFeaturedProduct.brand || "Marca não informada"}
                          {selectedFeaturedProduct.ean
                            ? ` • EAN ${selectedFeaturedProduct.ean}`
                            : ""}
                        </span>
                        <h3 className="mt-1 font-heading text-base font-bold text-brand-navy sm:text-lg">
                          {selectedFeaturedProduct.name}
                          {selectedFeaturedProduct.sizeLabel
                            ? ` — ${selectedFeaturedProduct.sizeLabel}`
                            : ""}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Preços ativos em mercados próximos.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToList(selectedFeaturedProduct.id, 1)}
                        className="min-h-[44px] rounded-xl bg-brand-light px-3 py-2 text-xs font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
                      >
                        + Lista
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {sortedFeatured
                        .slice(0, 3)
                        .map(({ market, priceEntry }) => {
                          const isLowest =
                            lowestFeatured?.market.id === market.id;
                          return (
                            <div
                              key={market.id}
                              className={`rounded-2xl border p-3.5 transition ${
                                isLowest
                                  ? "border-emerald-500 bg-emerald-50/50"
                                  : "border-slate-100 bg-slate-50/60"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate text-xs font-semibold text-slate-700">
                                  {market.shortName}
                                </span>
                                {isLowest && (
                                  <span className="rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold text-brand-navy">
                                    Menor
                                  </span>
                                )}
                              </div>
                              <p
                                className={`tabular-price mt-1.5 font-heading text-xl font-extrabold ${
                                  isLowest
                                    ? "text-emerald-700"
                                    : "text-brand-navy"
                                }`}
                              >
                                {formatBRL(priceEntry.price)}
                              </p>
                              <p className="tabular-price mt-1 text-[11px] text-slate-500">
                                {market.distanceKm !== null
                                  ? `~ ${market.distanceKm} km em linha reta`
                                  : priceEntry.updatedAt}
                              </p>
                            </div>
                          );
                        })}
                    </div>

                    {lowestFeatured && highestFeatured && featuredSavings > 0 && (
                      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                        <div>
                          <p className="text-sm font-bold text-brand-navy">
                            Menor preço publicado:{" "}
                            {lowestFeatured.market.shortName}
                          </p>
                          <p className="tabular-price text-xs font-semibold text-emerald-800">
                            Diferença de {formatBRL(featuredSavings)} por
                            unidade em relação ao{" "}
                            {highestFeatured.market.shortName}.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <p className="mt-3 text-[11px] text-slate-400">
                  {TRANSPARENCY_DISCLAIMER}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS DE PRODUTOS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-brand-navy sm:text-2xl">
              Categorias de Produtos
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Navegue pelos corredores e compare itens equivalentes.
            </p>
          </div>
          <Link
            href="/buscar"
            className="inline-flex min-h-[44px] items-center gap-1 text-xs font-bold text-brand-navy hover:underline sm:text-sm"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/buscar?categoria=${cat.id}`}
              className="group flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-2xs transition hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-xs transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
                {CATEGORY_ICONS[cat.id] || <Package className="h-7 w-7 text-brand-navy" />}
              </div>
              <span className="mt-2.5 font-heading text-xs font-bold text-brand-navy sm:text-sm">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* OFERTAS E PRODUTOS PUBLICADOS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-brand-yellow px-2.5 py-0.5 text-xs font-extrabold text-brand-navy">
              <TrendingDown className="h-3.5 w-3.5" />
              Preços Publicados com Origem Rastreável
            </div>
            <h2 className="mt-1.5 font-heading text-xl font-bold text-brand-navy sm:text-2xl">
              {location.configured && location.neighborhood
                ? `Produtos comparados perto de ${location.neighborhood}`
                : "Produtos com preços publicados"}
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              {TRANSPARENCY_DISCLAIMER}
            </p>
          </div>

          <Link
            href="/buscar"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-light px-4 py-2 text-xs font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
          >
            Abrir comparador completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {catalogLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
            <Package className="mx-auto h-10 w-10 text-brand-blue" />
            <h3 className="mt-3 font-heading text-base font-bold text-brand-navy">
              Nenhum produto com preço publicado no raio selecionado
            </h3>
            <p className="mx-auto mt-1 max-w-lg text-xs text-slate-500">
              Não exibimos preços inventados. Cadastre um supermercado parceiro,
              amplie o raio de busca ou utilize a Lista de Compras para buscar
              itens por código de barras EAN.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="min-h-[44px] rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white hover:bg-brand-blue"
              >
                Configurar CEP ou Raio
              </button>
              <Link
                href="/seja-parceiro"
                className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-brand-navy hover:border-brand-blue"
              >
                Seja um Mercado Parceiro
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayedProducts.map((product) => {
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
      </section>

      {/* COMO FUNCIONA + LISTA DE COMPRAS INTELIGENTE */}
      <section className="bg-brand-light/70 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                Simples, Transparente e Local
              </span>
              <h2 className="mt-1 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
                Como funciona o Economize+
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Planeje suas compras antes de sair de casa e compare o custo
                estimado da sua cesta entre os mercados cadastrados.
              </p>

              <div className="mt-6 space-y-4">
                {[
                  {
                    step: "1",
                    title: "Informe seu CEP ou autorize o GPS",
                    desc: "Calculamos a distância aproximada em linha reta até cada supermercado cadastrado.",
                  },
                  {
                    step: "2",
                    title: "Busque produtos ou escaneie o código EAN",
                    desc: "Consultamos nosso catálogo e o Open Food Facts Brasil sem misturar tamanhos diferentes.",
                  },
                  {
                    step: "3",
                    title: "Compare o subtotal real da sua lista",
                    desc: "Veja o subtotal em cada mercado, itens sem preço cadastrado e a diferença na cesta completa.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-3.5 rounded-2xl bg-white p-4 shadow-2xs"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-navy font-heading text-sm font-extrabold text-white">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-brand-navy sm:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prévia da Lista de Compras Inteligente */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <span className="rounded-md bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-navy">
                      Lista de Compras Inteligente
                    </span>
                    <h3 className="mt-1 font-heading text-lg font-bold text-brand-navy">
                      Compare sua cesta entre os mercados
                    </h3>
                  </div>
                  <Link
                    href="/lista"
                    className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-blue"
                  >
                    Abrir Minha Lista ({shoppingList.length})
                  </Link>
                </div>

                {activeListItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <ListChecks className="mx-auto h-9 w-9 text-brand-blue" />
                    <p className="mt-2 font-heading text-sm font-bold text-brand-navy">
                      Sua lista de compras ainda está vazia
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Adicione produtos ou escaneie códigos de barras na página
                      Minha Lista para comparar o total entre mercados.
                    </p>
                    <Link
                      href="/lista"
                      className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-brand-navy"
                    >
                      Começar minha lista agora
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
                                ? "border-2 border-emerald-600 bg-emerald-50/50"
                                : "border-slate-200 bg-slate-50/50"
                            }`}
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-heading text-sm font-bold text-brand-navy">
                                  {market.shortName}
                                </span>
                                {isBestComplete && (
                                  <span className="rounded-full bg-brand-green px-2.5 py-0.5 text-[10px] font-bold text-brand-navy">
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

      {/* ENCONTRE MERCADOS PERTO DE VOCÊ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold text-brand-navy sm:text-2xl">
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-brand-blue"
            >
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
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
            <Store className="mx-auto h-10 w-10 text-brand-blue" />
            <p className="mt-2 font-heading text-base font-bold text-brand-navy">
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
                className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-brand-navy"
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
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition hover:shadow-md"
              >
                <div>
                  <div className="relative flex h-28 w-full items-center justify-center bg-brand-navy text-white">
                    {market.coverImage ? (
                      <img
                        src={market.coverImage}
                        alt={market.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Store className="h-10 w-10 text-brand-blue/60" />
                    )}
                    {market.verifiedAt && (
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-brand-navy/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <CheckCircle2 className="h-3 w-3 text-brand-green" />
                        Verificado
                      </span>
                    )}
                    {market.distanceKm !== null && (
                      <span className="tabular-price absolute top-2.5 right-2.5 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-bold text-brand-navy shadow-2xs">
                        ~ {market.distanceKm} km
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-heading text-base font-bold text-brand-navy">
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
                    className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-brand-light py-2 text-xs font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
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

      {/* SEÇÃO PARA COMERCIANTES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-brand-navy p-6 text-white shadow-lg sm:p-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow px-3 py-1 text-xs font-extrabold text-brand-navy">
                <Building2 className="h-3.5 w-3.5" />
                Área para Comerciantes Locais
              </span>
              <h2 className="mt-3 font-heading text-2xl font-extrabold sm:text-3xl">
                Seu mercado onde o consumidor pesquisa antes de comprar.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Envie sua planilha CSV de preços ou extraia ofertas de encartes
                com revisão assistida antes da publicação.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-brand-light">
                <span>• Importação de planilha CSV validada por GTIN</span>
                <span>• Leitura de encartes com revisão prévia</span>
                <span>• Rastreabilidade completa de horário e fonte</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
              <Link
                href="/seja-parceiro"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-yellow px-6 py-4 text-center text-sm font-extrabold text-brand-navy shadow-md transition hover:bg-amber-300 sm:w-auto"
              >
                <Building2 className="h-4 w-4" />
                Seja um mercado parceiro
              </Link>
              <Link
                href="/painel-parceiro"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-center text-xs font-semibold text-white transition hover:bg-white/20 sm:w-auto"
              >
                Acessar Painel do Parceiro
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
