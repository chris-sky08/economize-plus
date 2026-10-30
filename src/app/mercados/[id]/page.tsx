"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Search,
  ShoppingBasket,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  TRANSPARENCY_DISCLAIMER,
  calculateUnitPrice,
  formatBRL,
} from "@/lib/format";

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
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white"
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
          (item!.product.brand || "").toLowerCase().includes(q) ||
          (item!.product.ean || "").includes(q)
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
      `Itens do ${market.shortName} adicionados à sua Lista Inteligente!`
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/mercados"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para mercados próximos
      </Link>

      {/* Cabeçalho do Perfil do Mercado */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs">
        <div className="relative flex h-48 w-full items-center justify-center bg-brand-navy sm:h-60">
          {market.coverImage ? (
            <img
              src={market.coverImage}
              alt={market.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Store className="h-16 w-16 text-brand-blue/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-4 text-white sm:bottom-6 sm:left-6 sm:right-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {market.verifiedAt && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-yellow px-2.5 py-0.5 text-[11px] font-extrabold text-brand-navy">
                    <CheckCircle2 className="h-3 w-3" />
                    Mercado Verificado
                  </span>
                )}
                {market.distanceKm !== null && (
                  <span className="tabular-price rounded-md bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    ~ {market.distanceKm} km em linha reta
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 font-heading text-2xl font-extrabold sm:text-3xl">
                {market.name}
              </h1>
              <p className="text-xs text-brand-light">
                {market.address} • {market.neighborhood}, {market.city}/
                {market.state}
                {market.zipCode ? ` • CEP ${market.zipCode}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {catalogItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartListFromMarket}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-brand-navy shadow-sm transition hover:opacity-90"
                >
                  <ShoppingBasket className="h-4 w-4" />
                  Adicionar Principais Ofertas à Lista
                </button>
              )}
              <Link
                href="/lista"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-brand-navy hover:bg-brand-light"
              >
                Ver Minha Lista
              </Link>
            </div>
          </div>
        </div>

        {/* Informações de Funcionamento, Contato, Localização e Entrega */}
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 p-6 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
              <Clock className="h-4 w-4 text-emerald-600" />
              Horário e Atualização
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {market.openingHours || "Horário não informado pela loja"}
            </p>
            {market.lastCatalogUpdate && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                Última atualização: {market.lastCatalogUpdate}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
              <Phone className="h-4 w-4 text-brand-blue" />
              Contato da Loja
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {market.phone
                ? `Tel: ${market.phone}`
                : "Telefone não informado"}
              {market.responsibleName
                ? ` • Resp.: ${market.responsibleName}`
                : ""}
            </p>
            {market.email && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                <Mail className="h-3 w-3" /> {market.email}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
              <MapPin className="h-4 w-4 text-brand-blue" />
              Localização e Distância
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {market.neighborhood} —{" "}
              {market.distanceKm !== null
                ? `~ ${market.distanceKm} km em linha reta`
                : "Defina seu CEP/GPS para ver a distância"}
            </p>
            {market.lat !== null && market.lng !== null && (
              <p className="tabular-price mt-1 text-[11px] text-slate-400">
                Coordenadas: {market.lat.toFixed(4)}, {market.lng.toFixed(4)}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Truck className="h-4 w-4 text-amber-600" />
              Modalidade de Atendimento
            </p>
            <p className="mt-1 text-xs text-amber-900">
              {market.deliveryInfo ||
                "Consulte diretamente na loja física a disponibilidade de entrega."}
            </p>
            <Link
              href="/entregas"
              className="mt-1 inline-block text-[11px] font-bold text-brand-navy hover:underline"
            >
              Saiba como funciona a entrega parceira →
            </Link>
          </div>
        </div>
      </div>

      {/* Catálogo Completo do Mercado */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-brand-navy">
              Catálogo de Produtos Publicados ({catalogItems.length})
            </h2>
            <p className="text-xs text-slate-500">{TRANSPARENCY_DISCLAIMER}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar neste mercado..."
                className="min-h-[44px] rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-3 text-xs focus:border-brand-blue focus:outline-none"
              />
              <Search className="absolute top-3.5 right-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            <select
              value={searchCat}
              onChange={(e) => setSearchCat(e.target.value)}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-navy"
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

        {catalogItems.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 font-heading text-base font-bold text-brand-navy">
              Nenhum produto com preço publicado para este filtro
            </p>
          </div>
        ) : (
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
                      {product.sizeLabel ? (
                        <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-bold text-brand-navy">
                          {product.sizeLabel}
                        </span>
                      ) : (
                        <span />
                      )}
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
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-16 w-16 rounded-xl border border-slate-100 object-contain"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                          <Package className="h-7 w-7 text-slate-300" />
                        </div>
                      )}
                      <div>
                        {product.brand && (
                          <p className="text-[11px] text-slate-400">
                            {product.brand}
                          </p>
                        )}
                        <h3 className="font-heading text-sm font-bold text-brand-navy hover:text-brand-blue">
                          {product.name}
                        </h3>
                      </div>
                    </Link>

                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          {priceEntry.regularPrice && (
                            <span className="tabular-price block text-[11px] text-slate-400 line-through">
                              {formatBRL(priceEntry.regularPrice)}
                            </span>
                          )}
                          <span className="tabular-price font-heading text-xl font-extrabold text-emerald-700">
                            {formatBRL(priceEntry.price)}
                          </span>
                        </div>
                        {unit && (
                          <span className="tabular-price rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {unit.formatted}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {priceEntry.sourceLabel} • {priceEntry.updatedAt}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToList(product.id, 1)}
                    disabled={!priceEntry.inStock}
                    className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-brand-navy py-2.5 text-xs font-bold text-white transition hover:bg-brand-blue disabled:cursor-not-allowed disabled:bg-slate-300"
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
        )}
      </div>
    </div>
  );
}
