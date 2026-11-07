"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShoppingBasket,
  Store,
  Truck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { TRANSPARENCY_DISCLAIMER } from "@/lib/format";
import { ECONOMIZE_ICONS } from "@/lib/icons";

export default function MercadosPage() {
  const { markets, prices, location, catalogLoading, setIsLocationModalOpen } =
    useApp();

  const visibleMarkets = markets
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
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <span className="rounded-md bg-brand-light px-2.5 py-0.5 text-xs font-bold text-brand-navy">
            Mercados de Bairro
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
            Mercados Parceiros Próximos ({visibleMarkets.length})
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {TRANSPARENCY_DISCLAIMER} •{" "}
            {location.configured ? (
              <>
                Região:{" "}
                <strong>
                  {location.neighborhood || location.city || "CEP ativo"}
                </strong>{" "}
                (Raio até <strong>{location.maxRadiusKm} km</strong> em linha
                reta)
              </>
            ) : (
              "Defina seu CEP ou GPS para filtrar por distância em linha reta."
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-brand-navy hover:border-brand-blue"
          >
            {location.configured
              ? `Alterar CEP ou Raio (${location.maxRadiusKm} km)`
              : "Definir CEP ou GPS"}
          </button>
          <Link
            href="/seja-parceiro"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-brand-navy hover:opacity-90"
          >
            Cadastrar Meu Mercado
          </Link>
        </div>
      </div>

      {catalogLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
            />
          ))}
        </div>
      ) : visibleMarkets.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-2xs">
          <img
            src={ECONOMIZE_ICONS["seja-parceiro"].src}
            alt=""
            width={80}
            height={80}
            loading="lazy"
            className="mx-auto h-20 w-20 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-sm"
          />
          <h2 className="mt-3 font-heading text-lg font-bold text-brand-navy">
            Nenhum mercado parceiro por aqui ainda — indique um mercado
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
            Amplie o raio de busca nas opções de localização ou cadastre um
            supermercado parceiro para publicar ofertas reais na sua região.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="min-h-[44px] rounded-xl bg-brand-navy px-5 py-2.5 text-xs font-bold text-white"
            >
              Configurar Raio de Distância
            </button>
            <Link
              href="/seja-parceiro"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-brand-navy hover:border-brand-blue"
            >
              Indicar ou Cadastrar Mercado
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {visibleMarkets.map((market) => {
            const marketOffersCount = prices.filter(
              (p) => p.marketId === market.id && p.inStock
            ).length;
            const promoCount = prices.filter(
              (p) => p.marketId === market.id && p.isPromo && p.inStock
            ).length;

            return (
              <article
                key={market.id}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs transition hover:shadow-md"
              >
                <div>
                  <div className="relative flex h-40 w-full items-center justify-center bg-brand-navy text-white">
                    {market.coverImage ? (
                      <img
                        src={market.coverImage}
                        alt={market.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={ECONOMIZE_ICONS["seja-parceiro"].src}
                        alt=""
                        width={88}
                        height={88}
                        loading="lazy"
                        className="h-22 w-22 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-md"
                      />
                    )}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      {market.verifiedAt && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-brand-navy/90 px-2.5 py-1 text-[11px] font-bold text-white">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
                          Mercado Verificado
                        </span>
                      )}
                      {market.planId === "premium" && (
                        <span className="rounded-lg bg-brand-yellow px-2.5 py-1 text-[11px] font-extrabold text-brand-navy">
                          Parceiro Destaque
                        </span>
                      )}
                    </div>
                    {market.distanceKm !== null && (
                      <span className="tabular-price absolute top-3 right-3 rounded-lg bg-white/95 px-3 py-1 text-xs font-extrabold text-brand-navy shadow-xs">
                        ~ {market.distanceKm} km em linha reta
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <h2 className="font-heading text-xl font-bold text-brand-navy">
                      {market.name}
                    </h2>
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-brand-blue" />
                        <span>
                          {market.address} — {market.neighborhood},{" "}
                          {market.city}/{market.state}
                          {market.zipCode ? ` (${market.zipCode})` : ""}
                        </span>
                      </p>
                      {(market.openingHours || market.lastCatalogUpdate) && (
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span>
                            {market.openingHours
                              ? `${market.openingHours} • `
                              : ""}
                            {market.lastCatalogUpdate ? (
                              <>
                                Catálogo atualizado em{" "}
                                <strong>{market.lastCatalogUpdate}</strong>
                              </>
                            ) : (
                              "Sem atualização recente registrada"
                            )}
                          </span>
                        </p>
                      )}
                      {market.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 shrink-0 text-brand-blue" />
                          <span>{market.phone}</span>
                        </p>
                      )}
                      {market.deliveryInfo && (
                        <p className="flex items-center gap-2">
                          <Truck className="h-4 w-4 shrink-0 text-amber-600" />
                          <span>{market.deliveryInfo}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-brand-light px-3 py-1 text-xs font-bold text-brand-navy">
                        {marketOffersCount} produtos com preço publicado
                      </span>
                      {promoCount > 0 && (
                        <span className="rounded-lg bg-brand-yellow/40 px-3 py-1 text-xs font-bold text-brand-navy">
                          {promoCount} ofertas ativas
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                  <Link
                    href={`/mercados/${market.id}`}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-blue"
                  >
                    <Store className="h-4 w-4" />
                    Visualizar Catálogo e Ofertas
                  </Link>
                  <Link
                    href="/lista"
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-brand-navy bg-white px-4 py-2.5 text-xs font-bold text-brand-navy transition hover:bg-brand-light"
                  >
                    <ShoppingBasket className="h-4 w-4" />
                    Comparar Minha Lista
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
