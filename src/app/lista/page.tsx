"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  MapPin,
  Plus,
  RotateCcw,
  ShoppingBasket,
  Store,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  DEMO_DISCLAIMER,
  calculateUnitPrice,
  formatBRL,
} from "@/data/mockData";

export default function ListaInteligentePage() {
  const {
    shoppingList,
    products,
    markets,
    prices,
    location,
    addToList,
    removeFromList,
    updateListQuantity,
    toggleListItemChecked,
    clearList,
    restoreDefaultList,
    saveListToSupabase,
  } = useApp();

  const [quickAddProductId, setQuickAddProductId] = useState(
    products[0]?.id || ""
  );

  const activeItems = shoppingList.filter((i) => i.checked);
  const activeMarkets = markets.filter(
    (m) => m.status === "ativo" && m.distanceKm <= location.maxRadiusKm
  );

  // Calculate basket breakdown for each market
  const marketComparisons = activeMarkets
    .map((market) => {
      let subtotal = 0;
      const foundItems: Array<{
        product: (typeof products)[0];
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        unitFormatted: string;
        isPromo: boolean;
        promoLabel?: string;
      }> = [];
      const missingItems: Array<{
        product: (typeof products)[0];
        reason: "sem_preco" | "indisponivel";
      }> = [];

      activeItems.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return;

        const priceEntry = prices.find(
          (p) => p.marketId === market.id && p.productId === product.id
        );

        if (!priceEntry) {
          missingItems.push({ product, reason: "sem_preco" });
        } else if (!priceEntry.inStock) {
          missingItems.push({ product, reason: "indisponivel" });
        } else {
          const lineTotal = priceEntry.price * item.quantity;
          subtotal += lineTotal;
          foundItems.push({
            product,
            quantity: item.quantity,
            unitPrice: priceEntry.price,
            lineTotal,
            unitFormatted: calculateUnitPrice(priceEntry.price, product)
              .formatted,
            isPromo: priceEntry.isPromo,
            promoLabel: priceEntry.promoLabel,
          });
        }
      });

      const isComplete =
        activeItems.length > 0 && missingItems.length === 0;

      return {
        market,
        subtotal,
        foundItems,
        missingItems,
        isComplete,
      };
    })
    .sort((a, b) => {
      // Prioritize complete baskets first, then lowest subtotal
      if (a.isComplete && !b.isComplete) return -1;
      if (!a.isComplete && b.isComplete) return 1;
      return a.subtotal - b.subtotal;
    });

  const completeBaskets = marketComparisons.filter((m) => m.isComplete);
  const bestCompleteBasket = completeBaskets[0];
  const highestCompleteBasket =
    completeBaskets.length > 1
      ? completeBaskets[completeBaskets.length - 1]
      : null;

  const estimatedSavings =
    bestCompleteBasket && highestCompleteBasket
      ? highestCompleteBasket.subtotal - bestCompleteBasket.subtotal
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-brand-green">
            <ShoppingBasket className="h-3.5 w-3.5" />
            Lista de Compras Inteligente
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
            Monte sua lista e descubra onde economizar
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {DEMO_DISCLAIMER} • Itens sem preço cadastrado são destacados e{" "}
            <strong>nunca somados como zero</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveListToSupabase}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-brand-navy"
          >
            <CloudUpload className="h-4 w-4" />
            Salvar Lista na Conta
          </button>
          <button
            type="button"
            onClick={restoreDefaultList}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:border-brand-blue"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Exemplo
          </button>
          {shoppingList.length > 0 && (
            <button
              type="button"
              onClick={clearList}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar Lista
            </button>
          )}
        </div>
      </div>

      {/* Layout em 2 Colunas: Itens da Lista (Esquerda) + Comparativo por Mercado estilo Lidl (Direita) */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Coluna Esquerda: Minha Lista de Compras */}
        <div className="space-y-4 lg:col-span-5">
          {/* Adicionar produto rápido */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <label
              htmlFor="quick-add-select"
              className="block text-xs font-bold text-brand-navy"
            >
              Adicionar produto rapidamente à cesta:
            </label>
            <div className="mt-2 flex gap-2">
              <select
                id="quick-add-select"
                value={quickAddProductId}
                onChange={(e) => setQuickAddProductId(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-brand-blue focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.sizeLabel} ({p.brand})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addToList(quickAddProductId, 1)}
                className="inline-flex items-center gap-1 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white hover:bg-brand-navy"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            </div>
          </div>

          {/* Lista de Itens (Inspirado na Referência Cart UI) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-heading text-base font-bold text-brand-navy">
                Itens na sua lista ({shoppingList.length})
              </h2>
              <span className="text-xs text-slate-500">
                {activeItems.reduce((a, b) => a + b.quantity, 0)} unidades
                ativas
              </span>
            </div>

            {shoppingList.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingBasket className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-2 font-heading text-sm font-bold text-brand-navy">
                  Sua lista está vazia
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Adicione produtos acima ou restaure a lista demonstrativa.
                </p>
                <button
                  type="button"
                  onClick={restoreDefaultList}
                  className="mt-4 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white"
                >
                  Carregar Lista de Exemplo
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {shoppingList.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;

                  return (
                    <div
                      key={item.productId}
                      className={`flex items-center justify-between gap-3 py-3.5 ${
                        !item.checked ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() =>
                            toggleListItemChecked(item.productId)
                          }
                          aria-label={`Marcar ${product.name}`}
                          className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green"
                        />
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 rounded-xl border border-slate-100 object-cover"
                        />
                        <div>
                          <Link
                            href={`/produto/${product.id}`}
                            className="font-heading text-xs font-bold text-brand-navy hover:text-brand-blue sm:text-sm"
                          >
                            {product.name}
                          </Link>
                          <p className="text-[11px] text-slate-500">
                            {product.brand} •{" "}
                            <span className="font-semibold text-brand-blue">
                              {product.sizeLabel}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                          <button
                            type="button"
                            onClick={() =>
                              updateListQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
                            aria-label="Diminuir quantidade"
                          >
                            -
                          </button>
                          <span className="px-2.5 text-xs font-bold text-brand-navy">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateListQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
                            aria-label="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromList(item.productId)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Remover ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Comparativo de Cesta por Mercado (Inspirado na Foto Lidl) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Resumo de Economia entre Cestas Completas */}
          {bestCompleteBasket && estimatedSavings > 0.05 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-brand-green/30 bg-emerald-50/90 p-5 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-green text-white">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-heading text-base font-extrabold text-brand-navy">
                    Menor custo estimado completo:{" "}
                    {bestCompleteBasket.market.shortName}
                  </p>
                  <p className="text-xs font-semibold text-brand-green">
                    Economia estimada de {formatBRL(estimatedSavings)} na cesta
                    completa em relação ao{" "}
                    {highestCompleteBasket?.market.shortName}.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase text-brand-green">
                  Total estimado
                </span>
                <span className="font-heading text-2xl font-extrabold text-brand-green">
                  {formatBRL(bestCompleteBasket.subtotal)}
                </span>
              </div>
            </div>
          )}

          {/* Cards de Comparação por Mercado (Estilo Lidl Reference) */}
          {marketComparisons.map(
            ({ market, subtotal, foundItems, missingItems, isComplete }) => {
              const isBestComplete =
                bestCompleteBasket?.market.id === market.id;

              return (
                <div
                  key={market.id}
                  className={`overflow-hidden rounded-3xl border bg-white shadow-xs transition ${
                    isBestComplete
                      ? "border-2 border-brand-green"
                      : "border-slate-200"
                  }`}
                >
                  {/* Cabeçalho do Card do Mercado */}
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-lg font-extrabold text-brand-navy">
                            {market.name}
                          </h3>
                          {isBestComplete && (
                            <span className="rounded-full bg-brand-green px-3 py-0.5 text-xs font-bold text-white">
                              € Menor preço estimado (Cesta Completa)
                            </span>
                          )}
                          {!isComplete && activeItems.length > 0 && (
                            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">
                              Cesta Parcial ({missingItems.length} sem preço)
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-brand-green">
                          <span>
                            ✓ Encontrados: {foundItems.length} de{" "}
                            {activeItems.length}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span
                            className={
                              missingItems.length > 0
                                ? "text-amber-700"
                                : "text-slate-500"
                            }
                          >
                            Sem preço / Indisponíveis: {missingItems.length}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-brand-blue" />
                            {market.distanceKm} km ({market.neighborhood})
                          </span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="block text-[10px] font-semibold uppercase text-slate-400">
                          {isComplete
                            ? "Total estimado da cesta"
                            : "Subtotal parcial (incompleto)"}
                        </span>
                        <span
                          className={`font-heading text-2xl font-extrabold ${
                            isBestComplete
                              ? "text-brand-green"
                              : "text-brand-navy"
                          }`}
                        >
                          {formatBRL(subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Itens Encontrados neste Mercado */}
                  <div className="divide-y divide-slate-100 px-5 py-2">
                    {foundItems.map((fi) => (
                      <div
                        key={fi.product.id}
                        className="flex items-center justify-between gap-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={fi.product.imageUrl}
                            alt={fi.product.name}
                            className="h-9 w-9 rounded-lg border border-slate-100 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-brand-navy">
                              {fi.product.name} — {fi.product.sizeLabel}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span>
                                Qtd: <strong>{fi.quantity}x</strong>{" "}
                                {formatBRL(fi.unitPrice)}
                              </span>
                              <span>({fi.unitFormatted})</span>
                              {fi.isPromo && (
                                <span className="rounded-sm bg-brand-yellow px-1.5 py-0.2 text-[10px] font-bold text-brand-navy">
                                  {fi.promoLabel || "Oferta"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="font-heading text-sm font-bold text-brand-navy">
                            {formatBRL(fi.lineTotal)}
                          </span>
                          <CheckCircle2 className="h-4 w-4 text-brand-green" />
                        </div>
                      </div>
                    ))}

                    {/* Aviso explícito de itens excluídos por falta de preço/estoque */}
                    {missingItems.length > 0 && (
                      <div className="my-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                        <p className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                          Itens não incluídos neste subtotal (não tratados como
                          R$ 0,00):
                        </p>
                        <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px]">
                          {missingItems.map((mi) => (
                            <li key={mi.product.id}>
                              <strong>
                                {mi.product.name} ({mi.product.sizeLabel})
                              </strong>{" "}
                              —{" "}
                              {mi.reason === "indisponivel"
                                ? "Sem estoque informado neste mercado"
                                : "Sem preço cadastrado neste mercado"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Barra Inferior do Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-5 py-3.5">
                    <div>
                      <span className="text-xs font-semibold text-slate-600">
                        {market.deliveryInfo}
                      </span>
                    </div>
                    <Link
                      href={`/mercados/${market.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                    >
                      <Store className="h-3.5 w-3.5" />
                      Ver perfil e catálogo do {market.shortName}
                    </Link>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
