"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
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
import { ECONOMIZE_ICONS, getCategoryIconSrc } from "@/lib/icons";

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
    <article className="group/card relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-blue/50 hover:shadow-lg">
      {/* Faixa superior de acento varejo */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-green opacity-85"
      />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {bestOffer?.priceEntry.isPromo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow px-2.5 py-0.5 text-[11px] font-extrabold text-brand-navy shadow-2xs">
                <Tag className="h-3 w-3" />
                {bestOffer.priceEntry.promoLabel || "Oferta Publicada"}
              </span>
            )}
            {product.sizeLabel && (
              <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-bold text-brand-navy">
                {product.sizeLabel}
              </span>
            )}
          </div>

          {product.ean && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              <img
                src={ECONOMIZE_ICONS["scanner-ean"].src}
                alt=""
                className="h-3.5 w-3.5 rounded-full object-cover"
              />
              EAN {product.ean}
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
          <div className="relative flex h-22 w-22 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 p-1.5">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={
                  product.sizeLabel
                    ? `${product.name} - ${product.sizeLabel}`
                    : product.name
                }
                className="h-full w-full rounded-xl object-contain transition duration-300 group-hover:scale-108"
                loading="lazy"
              />
            ) : (
              <img
                src={getCategoryIconSrc(product.categoryId)}
                alt={product.name}
                className="h-14 w-14 rounded-full object-cover opacity-90 transition group-hover:scale-105"
                loading="lazy"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {product.brand && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
                {product.brand}
              </p>
            )}
            <h3 className="font-heading text-sm font-extrabold leading-snug text-brand-navy group-hover:text-brand-blue sm:text-base">
              {product.name}
              {product.sizeLabel ? ` — ${product.sizeLabel}` : ""}
            </h3>
            {bestOffer ? (
              <div className="mt-1.5">
                <span className="block text-[10px] font-semibold text-slate-500">
                  Menor preço publicado:
                </span>
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="tabular-price font-heading text-xl font-extrabold text-emerald-700">
                    {formatBRL(bestOffer.priceEntry.price)}
                  </span>
                  {bestUnitPrice && (
                    <span className="tabular-price inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-navy">
                      <img
                        src={ECONOMIZE_ICONS["preco-medida"].src}
                        alt=""
                        className="h-3.5 w-3.5 rounded-full object-cover"
                      />
                      {bestUnitPrice.formatted}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs font-semibold text-amber-700">
                Sem preço publicado no raio selecionado
              </p>
            )}
          </div>
        </Link>

        {bestOffer && potentialSavings > 0.05 && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-900">
              <TrendingDown className="h-4 w-4 shrink-0 text-emerald-700" />
              Menor no {bestOffer.market.shortName}
            </span>
            <span className="tabular-price rounded-full bg-brand-green px-2 py-0.5 text-[11px] font-extrabold text-brand-navy">
              Diferença {formatBRL(potentialSavings)}
            </span>
          </div>
        )}

        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Comparativo nos mercados ({sorted.length}):
          </p>
          {sorted.slice(0, 3).map(({ priceEntry, market }) => {
            const unit = calculateUnitPrice(priceEntry.price, product);
            const isLowest =
              bestOffer?.priceEntry.id === priceEntry.id && priceEntry.inStock;
            return (
              <div
                key={priceEntry.id}
                className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs ${
                  isLowest
                    ? "border border-brand-blue/25 bg-brand-light/80 font-semibold text-brand-navy"
                    : "bg-slate-50/80 text-slate-600"
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/mercados/${market.id}`}
                      className="truncate font-bold hover:text-brand-blue hover:underline"
                    >
                      {market.shortName}
                    </Link>
                    {market.verifiedAt && (
                      <span
                        title="Mercado verificado pela equipe Economize+"
                        className="inline-flex items-center gap-1 rounded-full bg-white px-1.5 py-0.2 text-[9px] font-bold text-brand-navy shadow-2xs"
                      >
                        <img
                          src={ECONOMIZE_ICONS["fonte-rastreavel"].src}
                          alt=""
                          className="h-3 w-3 rounded-full object-cover"
                        />
                        Verificado
                      </span>
                    )}
                    {isLowest && (
                      <span className="rounded-full bg-brand-green px-2 py-0.2 text-[10px] font-extrabold text-brand-navy">
                        Menor
                      </span>
                    )}
                    {priceEntry.isStale && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-semibold text-amber-800">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Desatualizado
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    {market.distanceKm !== null && (
                      <span className="tabular-price flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5 text-brand-blue" />~{" "}
                        {market.distanceKm} km
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
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-navy px-3 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-brand-blue active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
        >
          <img
            src={ECONOMIZE_ICONS["minha-cesta"].src}
            alt=""
            className="h-5 w-5 rounded-full bg-white object-cover"
          />
          <Plus className="h-3.5 w-3.5" />
          Adicionar à Cesta
        </button>
        <Link
          href={`/produto/${product.id}`}
          className="flex min-h-[44px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-brand-navy transition hover:border-brand-blue hover:bg-brand-light"
        >
          Ver mais
        </Link>
      </div>
    </article>
  );
}
