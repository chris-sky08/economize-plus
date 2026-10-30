"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  Phone,
  ShoppingBasket,
  Store,
  Truck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DEMO_DISCLAIMER } from "@/data/mockData";

export default function MercadosPage() {
  const { markets, prices, location, setIsLocationModalOpen } = useApp();

  const visibleMarkets = markets
    .filter((m) => m.status === "ativo" && m.distanceKm <= location.maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <span className="rounded-md bg-brand-light px-2.5 py-0.5 text-xs font-bold text-brand-blue">
            Mercados de Bairro
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
            Mercados Parceiros Próximos ({visibleMarkets.length})
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {DEMO_DISCLAIMER} • Região selecionada:{" "}
            <strong>{location.neighborhood}</strong> (Raio até{" "}
            <strong>{location.maxRadiusKm} km</strong>)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-brand-navy hover:border-brand-blue"
          >
            Alterar Bairro ou Raio ({location.maxRadiusKm} km)
          </button>
          <Link
            href="/seja-parceiro"
            className="rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Cadastrar Meu Mercado
          </Link>
        </div>
      </div>

      {visibleMarkets.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
          <h2 className="font-heading text-lg font-bold text-brand-navy">
            Nenhum mercado encontrado dentro do raio de {location.maxRadiusKm} km
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Amplie o raio de busca para visualizar estabelecimentos demonstrativos
            em bairros vizinhos.
          </p>
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="mt-4 rounded-xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white"
          >
            Configurar Raio de Distância
          </button>
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
                  <div className="relative h-44 w-full bg-slate-100">
                    <img
                      src={market.coverImage}
                      alt={market.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="rounded-lg bg-brand-navy/90 px-2.5 py-1 text-[11px] font-bold text-white">
                        Estabelecimento Demonstrativo
                      </span>
                      {market.planId === "premium" && (
                        <span className="rounded-lg bg-brand-yellow px-2.5 py-1 text-[11px] font-extrabold text-brand-navy">
                          Parceiro Destaque
                        </span>
                      )}
                    </div>
                    <span className="absolute top-3 right-3 rounded-lg bg-white/95 px-3 py-1 text-xs font-extrabold text-brand-blue shadow-xs">
                      {market.distanceKm} km
                    </span>
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
                          {market.city}/{market.state} ({market.zipCode})
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-brand-green" />
                        <span>
                          {market.openingHours} • Catálogo atualizado:{" "}
                          <strong>{market.lastCatalogUpdate}</strong>
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-brand-blue" />
                        <span>{market.phone}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Truck className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>{market.deliveryInfo}</span>
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-brand-light px-3 py-1 text-xs font-bold text-brand-blue">
                        {marketOffersCount} produtos com preço ativo
                      </span>
                      <span className="rounded-lg bg-brand-yellow/40 px-3 py-1 text-xs font-bold text-brand-navy">
                        {promoCount} ofertas em destaque
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                  <Link
                    href={`/mercados/${market.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-navy"
                  >
                    <Store className="h-4 w-4" />
                    Visualizar Catálogo e Ofertas
                  </Link>
                  <Link
                    href="/lista"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-green bg-white px-4 py-2.5 text-xs font-bold text-brand-green transition hover:bg-emerald-50"
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
