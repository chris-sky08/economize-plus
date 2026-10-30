"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flag,
  MapPin,
  Plus,
  Store,
  Tag,
  TrendingDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  DEMO_DISCLAIMER,
  calculateUnitPrice,
  formatBRL,
} from "@/data/mockData";

export default function ProdutoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { products, markets, prices, categories, addToList, submitPriceReport } =
    useApp();

  const [qty, setQty] = useState(1);
  const [reportingMarketId, setReportingMarketId] = useState<string | null>(
    null
  );
  const [reportReason, setReportReason] = useState("Preço divergente na loja");
  const [reportDetails, setReportDetails] = useState("");

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-navy">
          Produto não encontrado
        </h1>
        <Link
          href="/buscar"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white"
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

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingMarketId) return;
    await submitPriceReport(
      reportingMarketId,
      product.id,
      reportReason,
      reportDetails
    );
    setReportingMarketId(null);
    setReportDetails("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/buscar"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para busca e comparação
      </Link>

      {/* Card Principal do Produto */}
      <div className="mt-4 grid grid-cols-1 gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs lg:grid-cols-12">
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-6 lg:col-span-4">
          <img
            src={product.imageUrl}
            alt={`${product.name} - ${product.sizeLabel}`}
            className="max-h-64 rounded-2xl object-contain"
          />
        </div>

        <div className="flex flex-col justify-between lg:col-span-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-blue">
                {category?.name || "Produto"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                Medida Exata: {product.sizeLabel}
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-900">
                Dados de Demonstração
              </span>
            </div>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Marca: {product.brand}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
              {product.name} — {product.sizeLabel}
            </h1>
            <p className="mt-2 text-sm text-slate-600">{product.description}</p>

            {bestOffer && (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-brand-green/30 bg-emerald-50/70 p-4">
                  <span className="text-xs font-bold text-brand-green">
                    Menor Preço Total Encontrado
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-heading text-3xl font-extrabold text-brand-green">
                      {formatBRL(bestOffer.priceEntry.price)}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      no {bestOffer.market.shortName}
                    </span>
                  </div>
                  {maxSavings > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand-green">
                      <TrendingDown className="h-3.5 w-3.5" />
                      Diferença de até {formatBRL(maxSavings)} por unidade
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-brand-blue/20 bg-brand-light/50 p-4">
                  <span className="text-xs font-bold text-brand-blue">
                    Menor Preço por Medida ({product.unitType})
                  </span>
                  <div className="mt-1 font-heading text-2xl font-extrabold text-brand-navy">
                    {
                      calculateUnitPrice(bestOffer.priceEntry.price, product)
                        .formatted
                    }
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Embalagem padronizada de {product.sizeLabel}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Adicionar à Lista com Quantidade */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
                aria-label="Diminuir quantidade"
              >
                -
              </button>
              <span className="px-4 text-sm font-bold text-brand-navy">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => addToList(product.id, qty)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-brand-navy sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              Adicionar {qty} {qty > 1 ? "unidades" : "unidade"} à Lista
              Inteligente
            </button>
          </div>
        </div>
      </div>

      {/* Tabela Comparativa em Diferentes Mercados */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-xl font-bold text-brand-navy">
              Comparação deste produto nos mercados locais
            </h2>
            <p className="text-xs text-slate-500">{DEMO_DISCLAIMER}</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Ordenado do menor para o maior preço
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {productOffers.map(({ priceEntry, market }, index) => {
            const unit = calculateUnitPrice(priceEntry.price, product);
            const isBest = index === 0 && priceEntry.inStock;

            return (
              <div
                key={priceEntry.id}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                  isBest
                    ? "border-brand-green bg-emerald-50/40"
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
                    {isBest && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-green px-2.5 py-0.5 text-[11px] font-bold text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        Menor Preço
                      </span>
                    )}
                    {priceEntry.isPromo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow px-2.5 py-0.5 text-[11px] font-extrabold text-brand-navy">
                        <Tag className="h-3 w-3" />
                        {priceEntry.promoLabel || "Promoção"}
                      </span>
                    )}
                    {!priceEntry.inStock && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                        Sem estoque no momento
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-brand-blue" />
                      {market.neighborhood} • {market.distanceKm} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-brand-green" />
                      Atualizado: {priceEntry.updatedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right">
                    {priceEntry.regularPrice && (
                      <span className="block text-xs text-slate-400 line-through">
                        {formatBRL(priceEntry.regularPrice)}
                      </span>
                    )}
                    <span
                      className={`font-heading text-xl font-extrabold ${
                        isBest ? "text-brand-green" : "text-brand-navy"
                      }`}
                    >
                      {formatBRL(priceEntry.price)}
                    </span>
                    <span className="block text-xs font-medium text-slate-500">
                      {unit.formatted}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Link
                      href={`/mercados/${market.id}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-brand-light px-3 py-1.5 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white"
                    >
                      <Store className="h-3.5 w-3.5" />
                      Ver mercado
                    </Link>
                    <button
                      type="button"
                      onClick={() => setReportingMarketId(market.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-rose-600"
                    >
                      <Flag className="h-3 w-3" />
                      Informar erro
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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
                onClick={() => setReportingMarketId(null)}
                className="text-xs font-semibold text-slate-500 hover:underline"
              >
                Cancelar
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Motivo
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
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
                  placeholder="Ex.: O preço na gôndola mudou hoje..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-3 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white hover:bg-brand-blue"
            >
              Enviar para análise administrativa
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
