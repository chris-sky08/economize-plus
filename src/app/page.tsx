"use client";

import React, { useState } from "react";
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
import { DEMO_DISCLAIMER, formatBRL } from "@/data/mockData";
import ProductComparisonCard from "@/components/ProductComparisonCard";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  mercearia: <Package className="h-6 w-6" />,
  hortifruti: <Apple className="h-6 w-6" />,
  laticinios: <Milk className="h-6 w-6" />,
  bebidas: <CupSoda className="h-6 w-6" />,
  limpeza: <Sparkles className="h-6 w-6" />,
  higiene: <HeartHandshake className="h-6 w-6" />,
  padaria: <Croissant className="h-6 w-6" />,
};

export default function HomePage() {
  const {
    categories,
    products,
    markets,
    prices,
    location,
    shoppingList,
    addToList,
    setIsLocationModalOpen,
  } = useApp();

  // Interactive demo product selector for the "Compare o mesmo produto" card
  const demoProductIds = ["oleo-soja-900ml", "arroz-5kg", "leite-integral-1l"];
  const [selectedDemoId, setSelectedDemoId] = useState("oleo-soja-900ml");

  const activeMarkets = markets.filter(
    (m) => m.status === "ativo" && m.distanceKm <= location.maxRadiusKm
  );

  const selectedDemoProduct =
    products.find((p) => p.id === selectedDemoId) || products[0];

  const demoComparisonEntries = ["mercado-a", "mercado-b", "mercado-c"]
    .map((mId) => {
      const market = markets.find((m) => m.id === mId);
      const priceEntry = prices.find(
        (p) => p.marketId === mId && p.productId === selectedDemoProduct.id
      );
      return market && priceEntry ? { market, priceEntry } : null;
    })
    .filter(Boolean) as Array<{
    market: (typeof markets)[0];
    priceEntry: (typeof prices)[0];
  }>;

  const sortedDemo = [...demoComparisonEntries].sort(
    (a, b) => a.priceEntry.price - b.priceEntry.price
  );
  const lowestDemo = sortedDemo[0];
  const highestDemo = sortedDemo[sortedDemo.length - 1];
  const demoSavings =
    lowestDemo && highestDemo
      ? highestDemo.priceEntry.price - lowestDemo.priceEntry.price
      : 0;

  const popularProducts = products.filter((p) => p.isPopular).slice(0, 8);

  return (
    <div className="space-y-14 pb-8">
      {/* HERO SECTION + CARD "COMPARE O MESMO PRODUTO" */}
      <section className="bg-gradient-to-b from-brand-light via-brand-light/60 to-transparent pt-6 pb-8 sm:pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Texto e CTAs Principais */}
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-blue shadow-2xs">
                <Tag className="h-3.5 w-3.5 text-brand-green" />
                <span>Compare. Escolha. Economize.</span>
              </div>

              <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
                Compare preços.{" "}
                <span className="text-brand-blue">
                  Economize perto de você.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Encontre preços e promoções em mercados do seu bairro, compare
                produtos equivalentes e descubra onde sua lista de compras pode
                sair mais em conta.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/buscar"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                >
                  <Search className="h-4 w-4" />
                  Comparar preços
                </Link>
                <Link
                  href="/lista"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-green bg-white px-5 py-3 text-sm font-bold text-brand-green transition hover:bg-emerald-50"
                >
                  <ListChecks className="h-4 w-4" />
                  Monte sua lista de compras
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-brand-green" />
                  Gratuito para consumidores
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-brand-green" />
                  Cálculo por quilo, litro ou unidade
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-brand-green" />
                  Apoio aos mercados de bairro
                </span>
              </div>
            </div>

            {/* Card Demonstrativo Fiel à Foto Enviada: "Compare o mesmo produto" */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-brand-navy sm:text-xl">
                      Compare o mesmo produto
                    </h2>
                    <p className="text-xs text-slate-500">
                      Exemplo fictício para demonstrar o layout e o comparador.
                    </p>
                  </div>

                  {/* Seletor rápido de exemplo */}
                  <div className="flex gap-1.5">
                    {demoProductIds.map((id) => {
                      const prod = products.find((p) => p.id === id);
                      if (!prod) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedDemoId(id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            selectedDemoId === id
                              ? "bg-brand-blue text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {prod.name.split(" ")[0]} {prod.sizeLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Produto em Destaque */}
                <div className="mt-4 flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-1.5">
                    <img
                      src={selectedDemoProduct.imageUrl}
                      alt={selectedDemoProduct.name}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="inline-block rounded-md bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-blue">
                      {selectedDemoProduct.brand}
                    </span>
                    <h3 className="mt-1 font-heading text-base font-bold text-brand-navy sm:text-lg">
                      {selectedDemoProduct.name} —{" "}
                      {selectedDemoProduct.sizeLabel}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Compare preços em mercados próximos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToList(selectedDemoProduct.id, 1)}
                    className="rounded-xl bg-brand-light px-3 py-2 text-xs font-bold text-brand-blue transition hover:bg-brand-blue hover:text-white"
                  >
                    + Lista
                  </button>
                </div>

                {/* Colunas Mercado A, Mercado B, Mercado C */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {demoComparisonEntries.map(({ market, priceEntry }) => {
                    const isLowest =
                      lowestDemo?.market.id === market.id;
                    return (
                      <div
                        key={market.id}
                        className={`rounded-2xl border p-3.5 transition ${
                          isLowest
                            ? "border-brand-green bg-emerald-50/40"
                            : "border-slate-100 bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            {market.shortName}
                          </span>
                          {isLowest && (
                            <span className="rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold text-white">
                              Menor
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-1.5 font-heading text-xl font-extrabold ${
                            isLowest ? "text-brand-green" : "text-brand-navy"
                          }`}
                        >
                          {formatBRL(priceEntry.price)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {market.distanceKm < 1
                            ? `${market.distanceKm * 1000} m de distância`
                            : `${market.distanceKm
                                .toString()
                                .replace(".", ",")} km de distância`}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Box Verde de Menor Preço Encontrado */}
                {lowestDemo && highestDemo && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-brand-green/25 bg-emerald-50/90 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                    <div>
                      <p className="text-sm font-bold text-brand-navy">
                        Menor preço encontrado: {lowestDemo.market.shortName}
                      </p>
                      <p className="text-xs font-semibold text-brand-green">
                        Economia estimada de {formatBRL(demoSavings)} por unidade
                        em relação ao {highestDemo.market.shortName}.
                      </p>
                    </div>
                  </div>
                )}

                <p className="mt-3 text-[11px] text-slate-400">
                  Os preços e distâncias são ilustrativos. O site utiliza dados
                  fornecidos e atualizados pelos mercados parceiros.
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
            className="flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline sm:text-sm"
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand-blue transition group-hover:bg-brand-blue group-hover:text-white">
                {CATEGORY_ICONS[cat.id] || <Package className="h-6 w-6" />}
              </div>
              <span className="mt-2.5 font-heading text-xs font-bold text-brand-navy sm:text-sm">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* OFERTAS EM DESTAQUE E PRODUTOS POPULARES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-brand-yellow px-2.5 py-0.5 text-xs font-extrabold text-brand-navy">
              <TrendingDown className="h-3.5 w-3.5" />
              Destaques Demonstrativos
            </div>
            <h2 className="mt-1.5 font-heading text-xl font-bold text-brand-navy sm:text-2xl">
              Ofertas e Produtos Populares perto de {location.neighborhood}
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              {DEMO_DISCLAIMER}
            </p>
          </div>

          <Link
            href="/buscar"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-light px-4 py-2 text-xs font-bold text-brand-blue transition hover:bg-brand-blue hover:text-white"
          >
            Abrir comparador completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularProducts.map((product) => {
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
      </section>

      {/* COMO FUNCIONA + LISTA DE COMPRAS INTELIGENTE */}
      <section className="bg-brand-light/70 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Como Funciona */}
            <div className="lg:col-span-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                Simples, Transparente e Local
              </span>
              <h2 className="mt-1 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
                Como funciona o Economize+
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Planeje suas compras antes de sair de casa e compare o custo
                estimado da sua cesta entre os mercados do bairro.
              </p>

              <div className="mt-6 space-y-4">
                {[
                  {
                    step: "1",
                    title: "Escolha sua região ou CEP",
                    desc: "Selecione seu bairro manualmente ou autorize a localização para ver mercados próximos.",
                  },
                  {
                    step: "2",
                    title: "Busque produtos ou monte sua lista",
                    desc: "Adicione os itens que sua família consome. Nunca misturamos tamanhos ou pesos diferentes.",
                  },
                  {
                    step: "3",
                    title: "Descubra onde sua compra pode sair mais barata",
                    desc: "Veja o subtotal estimado em cada mercado, itens sem preço cadastrado e a diferença entre as opções.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-3.5 rounded-2xl bg-white p-4 shadow-2xs"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue font-heading text-sm font-extrabold text-white">
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
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-brand-green">
                      Lista de Compras Inteligente
                    </span>
                    <h3 className="mt-1 font-heading text-lg font-bold text-brand-navy">
                      Descubra onde sua compra pode sair mais barata
                    </h3>
                  </div>
                  <Link
                    href="/lista"
                    className="rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    Abrir Minha Lista ({shoppingList.length})
                  </Link>
                </div>

                <div className="mt-4 space-y-2.5">
                  {activeMarkets.slice(0, 3).map((market, idx) => {
                    let subtotal = 0;
                    let foundCount = 0;
                    const activeItems = shoppingList.filter((i) => i.checked);

                    activeItems.forEach((item) => {
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

                    const missingCount = activeItems.length - foundCount;

                    return (
                      <div
                        key={market.id}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3.5 ${
                          idx === 0
                            ? "border-brand-green bg-emerald-50/50"
                            : "border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-sm font-bold text-brand-navy">
                              {market.shortName}
                            </span>
                            {idx === 0 && (
                              <span className="rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold text-white">
                                Menor total estimado
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            ✓ Encontrados: {foundCount} de {activeItems.length}{" "}
                            itens • {market.distanceKm} km
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
                          <span className="font-heading text-lg font-extrabold text-brand-green">
                            {formatBRL(subtotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 text-[11px] text-slate-500">
                  * Valores demonstrativos e estimados. Itens sem preço
                  cadastrado nunca são somados como zero.
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
              Encontre mercados perto de você
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Exibindo estabelecimentos demonstrativos em um raio de até{" "}
              <strong>{location.maxRadiusKm} km</strong> de{" "}
              <strong>{location.neighborhood}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-brand-blue"
            >
              Alterar raio / CEP
            </button>
            <Link
              href="/mercados"
              className="rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white hover:bg-brand-navy"
            >
              Ver todos os mercados
            </Link>
          </div>
        </div>

        {activeMarkets.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="font-heading text-base font-bold text-brand-navy">
              Nenhum mercado demonstrativo encontrado dentro de{" "}
              {location.maxRadiusKm} km.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Aumente o raio de distância para 5 km ou 10 km para visualizar os
              mercados da região.
            </p>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="mt-3 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white"
            >
              Aumentar raio de busca
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeMarkets.map((market) => (
              <div
                key={market.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs transition hover:shadow-md"
              >
                <div>
                  <div className="relative h-32 w-full bg-slate-100">
                    <img
                      src={market.coverImage}
                      alt={market.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-brand-navy/85 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Mercado Fictício (Demo)
                    </span>
                    <span className="absolute top-2.5 right-2.5 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-bold text-brand-blue shadow-2xs">
                      {market.distanceKm} km
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-heading text-base font-bold text-brand-navy">
                      {market.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-blue" />
                      {market.neighborhood} • {market.city}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-brand-green" />
                      Atualizado: {market.lastCatalogUpdate}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 p-4 pt-3">
                  <Link
                    href={`/mercados/${market.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-light py-2 text-xs font-bold text-brand-blue transition hover:bg-brand-blue hover:text-white"
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
                Seu mercado pode estar onde o consumidor procura.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Mais visibilidade para o seu mercado. Mais oportunidades para
                seus clientes. Cadastre seu estabelecimento, divulgue produtos e
                ofertas para moradores do seu bairro e mantenha seu catálogo
                organizado.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-brand-light">
                <span>• Planos Básico e Premium</span>
                <span>• Gestão simples de preços e promoções</span>
                <span>• Alertas de atualização de catálogo</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
              <Link
                href="/seja-parceiro"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-yellow px-6 py-4 text-center text-sm font-extrabold text-brand-navy shadow-md transition hover:bg-amber-300 sm:w-auto"
              >
                <Building2 className="h-4 w-4" />
                Seja um mercado parceiro
              </Link>
              <Link
                href="/painel-parceiro"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-center text-xs font-semibold text-white transition hover:bg-white/20 sm:w-auto"
              >
                Acessar Painel Demonstrativo do Parceiro
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
