"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Flag,
  MapPin,
  Package,
  Plus,
  Store,
  Tag,
  TrendingDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  TRANSPARENCY_DISCLAIMER,
  calculateUnitPrice,
  formatBRL,
} from "@/lib/format";
import TurnstileWidget from "@/components/TurnstileWidget";
import PriceHistorySection from "@/components/PriceHistorySection";

export default function ProdutoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    products,
    markets,
    prices,
    categories,
    catalogLoading,
    addToList,
    submitPriceReport,
  } = useApp();

  const [qty, setQty] = useState(1);
  const [reportingMarketId, setReportingMarketId] = useState<string | null>(
    null
  );
  const [reportReason, setReportReason] = useState("Preço divergente na loja");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const product = products.find((p) => p.id === id);

  if (catalogLoading && !product) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 gap-8 rounded-3xl border border-slate-200 bg-white p-6 lg:grid-cols-12">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100 lg:col-span-4" />
          <div className="space-y-4 lg:col-span-8">
            <div className="h-6 w-36 animate-pulse rounded-full bg-slate-100" />
            <div className="h-10 w-3/4 animate-pulse rounded-xl bg-slate-100" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-navy">
          Produto não encontrado
        </h1>
        <Link
          href="/buscar"
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao comparador
        </Link>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);

  const productOffers = prices
    .filter((p) => p.productId === product.id)
    .map((priceEntry) => {
      const market = markets.find((m) => m.id === priceEntry.marketId);
      return market && market.status === "ativo"
        ? { priceEntry, market }
        : null;
    })
    .filter(Boolean)
    .sort(
      (a, b) => a!.priceEntry.price - b!.priceEntry.price
    ) as Array<{
    priceEntry: (typeof prices)[0];
    market: (typeof markets)[0];
  }>;

  const availableOffers = productOffers.filter((o) => o.priceEntry.inStock);
  const bestOffer = availableOffers[0] || productOffers[0];
  const highestOffer =
    availableOffers.length > 1
      ? availableOffers[availableOffers.length - 1]
      : null;
  const maxSavings =
    bestOffer && highestOffer
      ? highestOffer.priceEntry.price - bestOffer.priceEntry.price
      : 0;

  const bestUnitPrice = bestOffer
    ? calculateUnitPrice(bestOffer.priceEntry.price, product)
    : null;

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingMarketId) return;
    setReportError(null);
    const res = await submitPriceReport(
      reportingMarketId,
      product.id,
      reportReason,
      reportDetails,
      turnstileToken
    );
    if (res.ok) {
      setReportingMarketId(null);
      setReportDetails("");
      setReportError(null);
    } else {
      setReportError(
        res.error || "Não foi possível registrar a divergência no momento."
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/buscar"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para busca e comparação
      </Link>

      {/* Card Principal do Produto */}
      <div className="mt-4 grid grid-cols-1 gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs lg:grid-cols-12">
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-6 lg:col-span-4">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={
                product.sizeLabel
                  ? `${product.name} - ${product.sizeLabel}`
                  : product.name
              }
              className="max-h-64 rounded-2xl object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Package className="h-16 w-16 text-slate-300" />
              <span className="mt-2 text-xs">Sem imagem cadastrada</span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between lg:col-span-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-navy">
                {category?.name || "Produto"}
              </span>
              {product.sizeLabel && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  Medida: {product.sizeLabel}
                </span>
              )}
              {product.ean && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] font-semibold text-slate-600">
                  EAN: {product.ean}
                </span>
              )}
            </div>

            {product.brand && (
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Marca: {product.brand}
              </p>
            )}
            <h1 className="mt-1 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
              {product.name}
              {product.sizeLabel ? ` — ${product.sizeLabel}` : ""}
            </h1>
            {product.description && (
              <p className="mt-2 text-sm text-slate-600">
                {product.description}
              </p>
            )}

            {/* Atribuição Obrigatória Open Food Facts (ODbL / CC BY-SA) */}
            {(product.source === "open_food_facts" || product.ean) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                <Database className="h-3.5 w-3.5 shrink-0 text-brand-blue" />
                <span>
                  Dados cadastrais/imagem consultados via{" "}
                  <a
                    href={
                      product.ean
                        ? `https://br.openfoodfacts.org/produto/${product.ean}`
                        : "https://br.openfoodfacts.org"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold text-brand-navy underline"
                  >
                    Open Food Facts Brasil
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>{" "}
                  (dados sob licença ODbL 1.0 • imagem sob CC BY-SA 3.0).
                </span>
              </div>
            )}

            {bestOffer && (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <span className="text-xs font-bold text-emerald-800">
                    Menor Preço Total Publicado
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="tabular-price font-heading text-3xl font-extrabold text-emerald-700">
                      {formatBRL(bestOffer.priceEntry.price)}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      no {bestOffer.market.shortName}
                    </span>
                  </div>
                  {maxSavings > 0 && (
                    <p className="tabular-price mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-800">
                      <TrendingDown className="h-3.5 w-3.5" />
                      Diferença de até {formatBRL(maxSavings)} por unidade
                    </p>
                  )}
                </div>

                {bestUnitPrice && (
                  <div className="rounded-2xl border border-brand-blue/20 bg-brand-light/50 p-4">
                    <span className="text-xs font-bold text-brand-navy">
                      Menor Preço por Medida ({product.unitType})
                    </span>
                    <div className="tabular-price mt-1 font-heading text-2xl font-extrabold text-brand-navy">
                      {bestUnitPrice.formatted}
                    </div>
                    {product.sizeLabel && (
                      <p className="mt-1 text-xs text-slate-500">
                        Embalagem de {product.sizeLabel}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Adicionar à Lista com Quantidade */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
                aria-label="Diminuir quantidade"
              >
                -
              </button>
              <span className="tabular-price px-4 text-sm font-bold text-brand-navy">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => addToList(product.id, qty)}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-brand-blue sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              Adicionar {qty} {qty > 1 ? "unidades" : "unidade"} à Lista
            </button>
          </div>
        </div>
      </div>

      {/* Tabela Comparativa em Diferentes Mercados */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-xl font-bold text-brand-navy">
              Preços publicados nos mercados locais ({productOffers.length})
            </h2>
            <p className="text-xs text-slate-500">{TRANSPARENCY_DISCLAIMER}</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Ordenado do menor para o maior preço
          </span>
        </div>

        {productOffers.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-xs text-slate-500">
            Nenhum preço publicado para este produto no momento.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {productOffers.map(({ priceEntry, market }) => {
              const unit = calculateUnitPrice(priceEntry.price, product);
              const isBest =
                bestOffer?.priceEntry.id === priceEntry.id && priceEntry.inStock;

              return (
                <div
                  key={priceEntry.id}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                    isBest
                      ? "border-emerald-500 bg-emerald-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/mercados/${market.id}`}
                        className="font-heading text-base font-bold text-brand-navy hover:text-brand-blue hover:underline"
                      >
                        {market.name}
                      </Link>
                      {market.verifiedAt && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-bold text-brand-navy">
                          <CheckCircle2 className="h-3 w-3 text-brand-blue" />
                          Verificado
                        </span>
                      )}
                      {isBest && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-green px-2.5 py-0.5 text-[11px] font-bold text-brand-navy">
                          <CheckCircle2 className="h-3 w-3" />
                          Menor Preço
                        </span>
                      )}
                      {priceEntry.isPromo && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow px-2.5 py-0.5 text-[11px] font-extrabold text-brand-navy">
                          <Tag className="h-3 w-3" />
                          {priceEntry.promoLabel || "Oferta"}
                        </span>
                      )}
                      {priceEntry.isStale && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          <AlertTriangle className="h-3 w-3" />
                          Desatualizado (&gt; 7 dias)
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-brand-blue" />
                        {market.neighborhood}
                        {market.distanceKm !== null
                          ? ` • ~ ${market.distanceKm} km em linha reta`
                          : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        Coletado em: {priceEntry.updatedAt} (
                        {priceEntry.sourceLabel})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      {priceEntry.regularPrice && (
                        <span className="tabular-price block text-xs text-slate-400 line-through">
                          {formatBRL(priceEntry.regularPrice)}
                        </span>
                      )}
                      <span
                        className={`tabular-price font-heading text-xl font-extrabold ${
                          isBest ? "text-emerald-700" : "text-brand-navy"
                        }`}
                      >
                        {formatBRL(priceEntry.price)}
                      </span>
                      {unit && (
                        <span className="tabular-price block text-xs font-medium text-slate-500">
                          {unit.formatted}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Link
                        href={`/mercados/${market.id}`}
                        className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-brand-light px-3 py-2 text-xs font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
                      >
                        <Store className="h-3.5 w-3.5" />
                        Ver mercado
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setReportingMarketId(market.id);
                          setReportError(null);
                        }}
                        className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Flag className="h-3 w-3" />
                        Informar divergência
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Formulário de Denúncia de Preço Incorreto */}
        {reportingMarketId && (
          <form
            onSubmit={handleReportSubmit}
            className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-heading text-sm font-bold text-brand-navy">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Reportar divergência de preço ou disponibilidade
              </h3>
              <button
                type="button"
                onClick={() => {
                  setReportingMarketId(null);
                  setReportError(null);
                }}
                className="min-h-[44px] px-2 text-xs font-semibold text-slate-500 hover:underline"
              >
                Cancelar
              </button>
            </div>
            {reportError && (
              <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {reportError}
              </div>
            )}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Motivo
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  <option>Preço divergente na loja</option>
                  <option>Produto indisponível no mercado</option>
                  <option>Medida ou peso incorreto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Ex.: O preço na etiqueta mudou hoje..."
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div className="mt-3">
              <TurnstileWidget onVerify={setTurnstileToken} />
            </div>
            <button
              type="submit"
              className="mt-3 min-h-[44px] rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white hover:bg-brand-blue"
            >
              Enviar para análise administrativa
            </button>
          </form>
        )}
      </div>

      {/* Histórico Real de Atualização de Preços */}
      <div className="mt-8">
        <PriceHistorySection
          productId={product.id}
          title="Histórico de Atualização de Preços deste Produto"
        />
      </div>
    </div>
  );
}
