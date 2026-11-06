"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Plus,
  Sparkles,
  Tag,
  TrendingDown,
} from "lucide-react";
import { Market, MarketPrice, Product } from "@/types/domain";
import { calculateUnitPrice, formatBRL } from "@/lib/format";
import { useApp } from "@/context/AppContext";

interface Props {
  product: Product;
  productPrices: Array<{
    priceEntry: MarketPrice;
    market: Market;
  }>;
}

export default function ProductComparisonCard({
  product,
  productPrices,
}: Props) {
  const { addToList } = useApp();

  const sorted = [...productPrices].sort(
    (a, b) => a.priceEntry.price - b.priceEntry.price
  );
  const availableSorted = sorted.filter((item) => item.priceEntry.inStock);
  const bestOffer = availableSorted[0] || sorted[0];
  const highestOffer =
    availableSorted.length > 1
      ? availableSorted[availableSorted.length - 1]
      : null;

  const potentialSavings =
    bestOffer && highestOffer
      ? highestOffer.priceEntry.price - bestOffer.priceEntry.price
      : 0;

  const bestUnitPrice = bestOffer
    ? calculateUnitPrice(bestOffer.priceEntry.price, product)
    : null;

  const hasSponsored = sorted.some((s) => s.priceEntry.isSponsored);

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-brand-blue/40 hover:shadow-md">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {bestOffer?.priceEntry.isPromo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow px-2.5 py-0.5 text-[11px] font-extrabold text-brand-navy">
                <Tag className="h-3 w-3" />
                {bestOffer.priceEntry.promoLabel || "Oferta"}
              </span>
            )}
            {product.sizeLabel && (
              <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-bold text-brand-navy">
                {product.sizeLabel}
              </span>
            )}
          </div>

          {product.ean && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              <Barcode className="h-3 w-3" />
              {product.ean}
            </span>
          )}
        </div>

        {hasSponsored && (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            <Sparkles className="h-2.5 w-2.5" />
            Destaque Patrocinado
          </div>
        )}

        <Link
          href={`/produto/${product.id}`}
          className="group mt-3 flex items-center gap-3.5"
        >
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-1">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={
                  product.sizeLabel
                    ? `${product.name} - ${product.sizeLabel}`
                    : product.name
                }
                className="h-full w-full rounded-lg object-contain transition group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <Package
                className="h-8 w-8 text-slate-300"
                aria-label="Produto sem imagem cadastrada"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {product.brand && (
              <p className="text-xs font-medium text-slate-500">
                {product.brand}
              </p>
            )}
            <h3 className="font-heading text-sm font-bold text-brand-navy group-hover:text-brand-blue sm:text-base">
              {product.name}
              {product.sizeLabel ? ` — ${product.sizeLabel}` : ""}
            </h3>
            {bestOffer ? (
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="tabular-price text-lg font-extrabold text-emerald-700">
                  {formatBRL(bestOffer.priceEntry.price)}
                </span>
                {bestUnitPrice && (
                  <span className="tabular-price rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    {bestUnitPrice.formatted}
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs font-semibold text-amber-700">
                Sem preço publicado no raio selecionado
              </p>
            )}
          </div>
        </Link>

        {bestOffer && potentialSavings > 0.05 && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <TrendingDown className="h-4 w-4 shrink-0" />
              Menor preço: {bestOffer.market.shortName}
            </span>
            <span className="tabular-price font-bold text-emerald-800">
              Economia de até {formatBRL(potentialSavings)}
            </span>
          </div>
        )}

        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Comparativo nos mercados ({sorted.length}):
          </p>
          {sorted.slice(0, 3).map(({ priceEntry, market }) => {
            const unit = calculateUnitPrice(priceEntry.price, product);
            const isLowest =
              bestOffer?.priceEntry.id === priceEntry.id && priceEntry.inStock;
            return (
              <div
                key={priceEntry.id}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                  isLowest
                    ? "bg-brand-light/70 font-semibold text-brand-navy"
                    : "bg-slate-50/70 text-slate-600"
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/mercados/${market.id}`}
                      className="truncate hover:text-brand-blue hover:underline"
                    >
                      {market.shortName}
                    </Link>
                    {market.verifiedAt && (
                      <span
                        title="Mercado verificado pela equipe Economize+"
                        className="inline-flex items-center gap-0.5 rounded-sm bg-brand-light px-1 py-0.2 text-[9px] font-bold text-brand-navy"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 text-brand-blue" />
                        Verificado
                      </span>
                    )}
                    {isLowest && (
                      <span className="rounded-sm bg-brand-green px-1.5 py-0.2 text-[10px] font-bold text-brand-navy">
                        Menor
                      </span>
                    )}
                    {priceEntry.isStale && (
                      <span className="inline-flex items-center gap-0.5 rounded-sm bg-amber-100 px-1.5 py-0.2 text-[9px] font-semibold text-amber-800">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Desatualizado
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    {market.distanceKm !== null && (
                      <span className="tabular-price flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />~ {market.distanceKm}{" "}
                        km
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {priceEntry.updatedAt}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      • {priceEntry.sourceLabel}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`tabular-price block text-xs font-extrabold ${
                      isLowest ? "text-emerald-700" : "text-brand-navy"
                    }`}
                  >
                    {formatBRL(priceEntry.price)}
                  </span>
                  {unit && (
                    <span className="tabular-price block text-[10px] text-slate-500">
                      {unit.formatted}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => addToList(product.id, 1)}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-navy px-3 py-2.5 text-xs font-bold text-white transition hover:bg-brand-blue active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
        >
          <Plus className="h-4 w-4" />
          Adicionar à Lista
        </button>
        <Link
          href={`/produto/${product.id}`}
          className="flex min-h-[44px] items-center rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-brand-blue hover:text-brand-navy"
        >
          Detalhes
        </Link>
      </div>
    </article>
  );
}
