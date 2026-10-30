"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShoppingBasket,
  Tag,
  Truck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  DEMO_DISCLAIMER,
  calculateUnitPrice,
  formatBRL,
} from "@/data/mockData";

export default function MercadoPerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { markets, products, prices, categories, addToList, showToast } =
    useApp();

  const [searchCat, setSearchCat] = useState("todas");
  const [searchText, setSearchText] = useState("");

  const market = markets.find((m) => m.id === id);

  if (!market) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-navy">
          Mercado não encontrado
        </h1>
        <Link
          href="/mercados"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para mercados próximos
        </Link>
      </div>
    );
  }

  const catalogItems = prices
    .filter((p) => p.marketId === market.id)
    .map((priceEntry) => {
      const product = products.find((prod) => prod.id === priceEntry.productId);
      return product ? { priceEntry, product } : null;
    })
    .filter(Boolean)
    .filter((item) => {
      if (
        searchCat !== "todas" &&
        item!.product.categoryId !== searchCat
      ) {
        return false;
      }
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        return (
          item!.product.name.toLowerCase().includes(q) ||
          item!.product.brand.toLowerCase().includes(q)
        );
      }
      return true;
    }) as Array<{
    priceEntry: (typeof prices)[0];
    product: (typeof products)[0];
  }>;

  const handleStartListFromMarket = () => {
    catalogItems.slice(0, 4).forEach(({ product }) => {
      addToList(product.id, 1);
    });
    showToast(
      `Itens principais do ${market.shortName} adicionados à sua Lista Inteligente!`
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/mercados"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para mercados próximos
      </Link>

      {/* Cabeçalho do Perfil do Mercado */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs">
        <div className="relative h-48 w-full bg-slate-100 sm:h-60">
          <img
            src={market.coverImage}
            alt={market.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/85 via-brand-navy/30 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-4 text-white sm:bottom-6 sm:left-6 sm:right-6">
            <div>
              <span className="rounded-md bg-brand-yellow px-2.5 py-0.5 text-[11px] font-extrabold text-brand-navy">
                Perfil Demonstrativo • {market.distanceKm} km
              </span>
              <h1 className="mt-1.5 font-heading text-2xl font-extrabold sm:text-3xl">
                {market.name}
              </h1>
              <p className="text-xs text-brand-light">
                {market.address} • {market.neighborhood}, {market.city}/
                {market.state} • CEP {market.zipCode}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStartListFromMarket}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <ShoppingBasket className="h-4 w-4" />
                Iniciar Lista com Ofertas Deste Mercado
              </button>
              <Link
                href="/lista"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-brand-navy hover:bg-brand-light"
              >
                Ver Minha Lista
              </Link>
            </div>
          </div>
        </div>

        {/* Informações de Funcionamento, Contato, Mapa Demonstrativo e Entrega */}
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 p-6 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
              <Clock className="h-4 w-4 text-brand-green" />
              Horário e Atualização
            </p>
            <p className="mt-1 text-xs text-slate-600">{market.openingHours}</p>
            <p className="mt-1 text-[11px] font-semibold text-brand-green">
              Última atualização de preços: {market.lastCatalogUpdate}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
              <Phone className="h-4 w-4 text-brand-blue" />
              Contato e Responsável
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Tel: {market.phone} • Resp.: {market.responsibleName}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <Mail className="h-3 w-3" /> {market.email}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
              <MapPin className="h-4 w-4 text-brand-blue" />
              Localização no Bairro (Fictícia)
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {market.neighborhood} — Distância simulada: {market.distanceKm} km
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Mapa demonstrativo compatível com integração futura.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Truck className="h-4 w-4 text-amber-600" />
              Status de Entrega
            </p>
            <p className="mt-1 text-xs text-amber-900">{market.deliveryInfo}</p>
            <Link
              href="/entregas"
              className="mt-1 inline-block text-[11px] font-bold text-brand-blue hover:underline"
            >
              Saiba como funcionará a entrega parceira →
            </Link>
          </div>
        </div>
      </div>

      {/* Catálogo Completo do Mercado */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-brand-navy">
              Catálogo de Produtos e Promoções ({catalogItems.length})
            </h2>
            <p className="text-xs text-slate-500">{DEMO_DISCLAIMER}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar neste mercado..."
                className="rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-3 text-xs focus:border-brand-blue focus:outline-none"
              />
              <Search className="absolute top-2.5 right-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            <select
              value={searchCat}
              onChange={(e) => setSearchCat(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-navy"
            >
              <option value="todas">Todas as categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {catalogItems.map(({ priceEntry, product }) => {
            const unit = calculateUnitPrice(priceEntry.price, product);

            return (
              <div
                key={priceEntry.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-bold text-brand-blue">
                      {product.sizeLabel}
                    </span>
                    {priceEntry.isPromo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow px-2.5 py-0.5 text-[11px] font-extrabold text-brand-navy">
                        <Tag className="h-3 w-3" />
                        {priceEntry.promoLabel || "Oferta"}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/produto/${product.id}`}
                    className="mt-3 flex items-center gap-3"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-16 w-16 rounded-xl border border-slate-100 object-cover"
                    />
                    <div>
                      <p className="text-[11px] text-slate-400">
                        {product.brand}
                      </p>
                      <h3 className="font-heading text-sm font-bold text-brand-navy hover:text-brand-blue">
                        {product.name}
                      </h3>
                    </div>
                  </Link>

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        {priceEntry.regularPrice && (
                          <span className="block text-[11px] text-slate-400 line-through">
                            {formatBRL(priceEntry.regularPrice)}
                          </span>
                        )}
                        <span className="font-heading text-xl font-extrabold text-brand-green">
                          {formatBRL(priceEntry.price)}
                        </span>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {unit.formatted}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Atualizado: {priceEntry.updatedAt} •{" "}
                      {priceEntry.inStock ? "Disponível" : "Indisponível"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => addToList(product.id, 1)}
                  disabled={!priceEntry.inStock}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-blue py-2.5 text-xs font-bold text-white transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Plus className="h-4 w-4" />
                  {priceEntry.inStock
                    ? "Adicionar à Lista"
                    : "Produto Indisponível"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
