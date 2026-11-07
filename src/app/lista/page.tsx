"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Barcode,
  Camera,
  CheckCircle2,
  CloudUpload,
  Loader2,
  MapPin,
  Package,
  Plus,
  Search,
  ShoppingBasket,
  Store,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ECONOMIZE_ICONS } from "@/lib/icons";
import { Product } from "@/types/domain";
import {
  TRANSPARENCY_DISCLAIMER,
  calculateUnitPrice,
  formatBRL,
} from "@/lib/format";
import {
  lookupProductByEan,
  searchProductsForAutocomplete,
} from "@/services/productLookup";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";

export default function ListaInteligentePage() {
  const {
    shoppingList,
    products,
    markets,
    prices,
    location,
    registerExternalProduct,
    addToList,
    removeFromList,
    updateListQuantity,
    toggleListItemChecked,
    clearList,
    saveListToSupabase,
    showToast,
  } = useApp();

  // Estados de Autocomplete (Debounce 300ms no banco Supabase + Scanner EAN)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [dbResults, setDbResults] = useState<Product[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Debounce de 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Busca trigram no banco de dados (ou por EAN exato) quando debouncedTerm muda
  useEffect(() => {
    let active = true;
    if (debouncedTerm.length < 2) {
      setDbResults([]);
      setIsSearchingDb(false);
      return;
    }

    setIsSearchingDb(true);
    searchProductsForAutocomplete(debouncedTerm)
      .then((res) => {
        if (active) {
          setDbResults(res);
          setIsSearchingDb(false);
        }
      })
      .catch(() => {
        if (active) setIsSearchingDb(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedTerm]);

  const localMatches =
    debouncedTerm.length >= 1
      ? products.filter((p) => {
          const q = debouncedTerm.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            (p.brand || "").toLowerCase().includes(q) ||
            (p.ean || "").includes(q)
          );
        })
      : [];

  const combinedSuggestions = [
    ...localMatches,
    ...dbResults.filter(
      (rem) =>
        !localMatches.some(
          (loc) =>
            (loc.ean && rem.ean && loc.ean === rem.ean) || loc.id === rem.id
        )
    ),
  ].slice(0, 8);

  const handleSelectSuggestion = async (product: Product) => {
    registerExternalProduct(product);
    addToList(product.id, 1);
    setSearchTerm("");
    setDbResults([]);
  };

  const handleBarcodeDetected = async (ean: string) => {
    setIsScannerOpen(false);
    const localProd = products.find((p) => p.ean === ean);
    if (localProd) {
      addToList(localProd.id, 1);
      return;
    }

    showToast(`Consultando código EAN ${ean}...`);
    const remoteProd = await lookupProductByEan(ean);
    if (remoteProd) {
      registerExternalProduct(remoteProd);
      addToList(remoteProd.id, 1);
    } else {
      showToast(
        `Produto com código EAN ${ean} não encontrado no banco nem no Open Food Facts.`
      );
    }
  };

  // Filtra apenas itens reais que existem no catálogo de produtos carregado
  const validShoppingList = shoppingList.filter(
    (item) =>
      item.quantity > 0 && products.some((p) => p.id === item.productId)
  );
  const activeItems = validShoppingList.filter((i) => i.checked);
  const activeMarkets = markets.filter(
    (m) =>
      m.status === "ativo" &&
      (m.distanceKm === null || m.distanceKm <= location.maxRadiusKm)
  );

  const marketComparisons = activeMarkets
    .map((market) => {
      let subtotal = 0;
      const foundItems: Array<{
        product: Pick<Product, "id" | "name"> & Partial<Product>;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        unitFormatted: string | null;
        isPromo: boolean;
        promoLabel?: string;
      }> = [];
      const missingItems: Array<{
        product: Pick<Product, "id" | "name"> & Partial<Product>;
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
          const unitCalc = calculateUnitPrice(priceEntry.price, product);
          foundItems.push({
            product,
            quantity: item.quantity,
            unitPrice: priceEntry.price,
            lineTotal,
            unitFormatted: unitCalc ? unitCalc.formatted : null,
            isPromo: priceEntry.isPromo,
            promoLabel: priceEntry.promoLabel,
          });
        }
      });

      const isComplete =
        activeItems.length > 0 &&
        foundItems.length === activeItems.length &&
        missingItems.length === 0 &&
        subtotal > 0;

      return {
        market,
        subtotal,
        foundItems,
        missingItems,
        isComplete,
      };
    })
    .sort((a, b) => {
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
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetectedEan={handleBarcodeDetected}
      />

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-light px-2.5 py-0.5 text-xs font-bold text-brand-navy">
            <ShoppingBasket className="h-3.5 w-3.5 text-brand-blue" />
            Lista de Compras Inteligente • Leitor EAN
          </span>
          <h1 className="mt-1 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
            Monte sua lista e compare o total entre mercados
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {TRANSPARENCY_DISCLAIMER} • Itens sem preço cadastrado são
            destacados e <strong>nunca somados como zero</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveListToSupabase}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-brand-blue"
          >
            <CloudUpload className="h-4 w-4" />
            Salvar Lista na Conta
          </button>
          {validShoppingList.length > 0 && (
            <button
              type="button"
              onClick={clearList}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar Lista
            </button>
          )}
        </div>
      </div>

      {/* Layout em 2 Colunas */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Coluna Esquerda: Autocomplete + Scanner EAN + Itens da Lista */}
        <div className="space-y-4 lg:col-span-5">
          {/* Barra de Busca Dinâmica com Autocomplete (300ms debounce) + Scanner */}
          <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="autocomplete-product-search"
                className="block text-xs font-bold text-brand-navy"
              >
                Buscar produto por nome, marca ou código EAN:
              </label>
              <span className="text-[11px] font-medium text-brand-blue">
                Catálogo + EAN Open Food Facts
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <input
                  id="autocomplete-product-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite nome ou código EAN-13..."
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-3.5 text-xs text-slate-800 focus:border-brand-blue focus:bg-white focus:outline-none"
                />
                {isSearchingDb ? (
                  <Loader2 className="absolute top-3 right-3 h-4 w-4 animate-spin text-brand-blue" />
                ) : (
                  <Search className="absolute top-3 right-3 h-4 w-4 text-slate-400" />
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-bold text-brand-yellow transition hover:bg-brand-blue hover:text-white"
              >
                <Camera className="h-4 w-4" />
                Escanear Código de Barras
              </button>
            </div>

            {/* Dropdown de Autocomplete */}
            {debouncedTerm.length >= 1 && (
              <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                {combinedSuggestions.length === 0 && !isSearchingDb ? (
                  <p className="p-3 text-center text-xs text-slate-500">
                    Nenhum produto encontrado para &ldquo;{debouncedTerm}&rdquo;.
                    Se tiver a embalagem em mãos, escaneie ou digite o código
                    EAN-13 completo.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {combinedSuggestions.map((item) => {
                      const isFromOff = item.source === "open_food_facts";
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl p-2.5 text-left transition hover:bg-brand-light/60"
                        >
                          <div className="flex items-center gap-2.5">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 bg-white object-contain"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                                <Package className="h-5 w-5 text-slate-300" />
                              </div>
                            )}
                            <div>
                              <p className="font-heading text-xs font-bold text-brand-navy">
                                {item.name}
                                {item.sizeLabel ? ` — ${item.sizeLabel}` : ""}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                                {item.brand && <span>{item.brand}</span>}
                                {item.ean && (
                                  <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-0.5">
                                      <Barcode className="h-2.5 w-2.5" />
                                      {item.ean}
                                    </span>
                                  </>
                                )}
                                {isFromOff && (
                                  <span className="rounded bg-brand-light px-1.5 py-0.5 font-bold text-brand-navy">
                                    Open Food Facts
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1 rounded-lg bg-brand-navy px-2.5 py-1 text-[11px] font-bold text-white">
                            <Plus className="h-3 w-3" />
                            Adicionar
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lista de Itens */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-heading text-base font-bold text-brand-navy">
                Itens na sua lista ({validShoppingList.length})
              </h2>
              <span className="tabular-price text-xs text-slate-500">
                {activeItems.reduce((a, b) => a + b.quantity, 0)} unidades
                ativas
              </span>
            </div>

            {validShoppingList.length === 0 ? (
              <div className="py-10 text-center">
                <img
                  src={ECONOMIZE_ICONS["minha-cesta"].src}
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                  className="mx-auto h-20 w-20 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-sm"
                />
                <p className="mt-3 font-heading text-sm font-bold text-brand-navy">
                  Sua lista está vazia
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Pesquise um produto na barra acima ou escaneie o código de
                  barras EAN da embalagem para iniciar sua cesta.
                </p>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white"
                >
                  <Camera className="h-4 w-4 text-brand-yellow" />
                  Escanear Código de Barras
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {validShoppingList.map((item) => {
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
                          className="h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-blue"
                        />
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-12 w-12 rounded-xl border border-slate-100 bg-white object-contain p-0.5"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                            <Package className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/produto/${product.id}`}
                            className="font-heading text-xs font-bold text-brand-navy hover:text-brand-blue sm:text-sm"
                          >
                            {product.name}
                          </Link>
                          <p className="text-[11px] text-slate-500">
                            {product.brand || "Marca não informada"}
                            {product.sizeLabel ? (
                              <>
                                {" "}
                                •{" "}
                                <span className="font-semibold text-brand-navy">
                                  {product.sizeLabel}
                                </span>
                              </>
                            ) : null}
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
                            className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-95"
                            aria-label="Diminuir quantidade"
                          >
                            -
                          </button>
                          <span className="tabular-price px-2.5 text-xs font-bold text-brand-navy">
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
                            className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-95"
                            aria-label="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromList(item.productId)}
                          className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
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

        {/* Coluna Direita: Comparativo de Cesta por Mercado */}
        <div className="space-y-5 lg:col-span-7">
          {bestCompleteBasket && estimatedSavings > 0.05 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-300 bg-emerald-50/90 p-5 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-green text-brand-navy">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-heading text-base font-extrabold text-brand-navy">
                    Menor custo estimado completo:{" "}
                    {bestCompleteBasket.market.shortName}
                  </p>
                  <p className="tabular-price text-xs font-semibold text-emerald-800">
                    Diferença estimada de {formatBRL(estimatedSavings)} na cesta
                    completa em relação ao{" "}
                    {highestCompleteBasket?.market.shortName}.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase text-emerald-800">
                  Total estimado
                </span>
                <span className="tabular-price font-heading text-2xl font-extrabold text-emerald-700">
                  {formatBRL(bestCompleteBasket.subtotal)}
                </span>
              </div>
            </div>
          )}

          {marketComparisons.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-2xs">
              <img
                src={ECONOMIZE_ICONS["seja-parceiro"].src}
                alt=""
                width={80}
                height={80}
                loading="lazy"
                className="mx-auto h-20 w-20 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-sm"
              />
              <h3 className="mt-3 font-heading text-base font-bold text-brand-navy">
                Nenhum mercado ativo no raio selecionado
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Sua lista fica salva automaticamente no seu dispositivo ou na
                sua conta. Assim que mercados parceiros estiverem ativos no seu
                raio de busca, o comparativo completo aparecerá aqui.
              </p>
            </div>
          ) : (
            marketComparisons.map(
              ({ market, subtotal, foundItems, missingItems, isComplete }) => {
                const isBestComplete =
                  bestCompleteBasket?.market.id === market.id;

                return (
                  <div
                    key={market.id}
                    className={`overflow-hidden rounded-3xl border bg-white shadow-xs transition ${
                      isBestComplete
                        ? "border-2 border-emerald-600"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="border-b border-slate-100 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-heading text-lg font-extrabold text-brand-navy">
                              {market.name}
                            </h3>
                            {isBestComplete && (
                              <span className="rounded-full bg-brand-green px-3 py-0.5 text-xs font-bold text-brand-navy">
                                Menor preço estimado (Cesta Completa)
                              </span>
                            )}
                            {!isComplete && activeItems.length > 0 && (
                              <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">
                                Cesta Parcial ({missingItems.length} sem preço)
                              </span>
                            )}
                          </div>

                          <p className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-emerald-700">
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
                            {market.distanceKm !== null && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="tabular-price flex items-center gap-1 text-slate-500">
                                  <MapPin className="h-3.5 w-3.5 text-brand-blue" />
                                  ~ {market.distanceKm} km ({market.neighborhood})
                                </span>
                              </>
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">
                            {isComplete
                              ? "Total estimado da cesta"
                              : "Subtotal parcial (incompleto)"}
                          </span>
                          <span
                            className={`tabular-price font-heading text-2xl font-extrabold ${
                              isBestComplete
                                ? "text-emerald-700"
                                : "text-brand-navy"
                            }`}
                          >
                            {formatBRL(subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 px-5 py-2">
                      {foundItems.map((fi) => (
                        <div
                          key={fi.product.id}
                          className="flex items-center justify-between gap-3 py-2.5 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {fi.product.imageUrl ? (
                              <img
                                src={fi.product.imageUrl}
                                alt={fi.product.name}
                                className="h-9 w-9 rounded-lg border border-slate-100 bg-white object-contain p-0.5"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                                <Package className="h-4 w-4 text-slate-300" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-brand-navy">
                                {fi.product.name}
                                {fi.product.sizeLabel
                                  ? ` — ${fi.product.sizeLabel}`
                                  : ""}
                              </p>
                              <div className="tabular-price flex items-center gap-2 text-[11px] text-slate-500">
                                <span>
                                  Qtd: <strong>{fi.quantity}x</strong>{" "}
                                  {formatBRL(fi.unitPrice)}
                                </span>
                                {fi.unitFormatted && (
                                  <span>({fi.unitFormatted})</span>
                                )}
                                {fi.isPromo && (
                                  <span className="rounded-sm bg-brand-yellow px-1.5 py-0.5 text-[10px] font-bold text-brand-navy">
                                    {fi.promoLabel || "Oferta"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="tabular-price font-heading text-sm font-bold text-brand-navy">
                              {formatBRL(fi.lineTotal)}
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </div>
                        </div>
                      ))}

                      {missingItems.length > 0 && (
                        <div className="my-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                          <p className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                            Itens não incluídos neste subtotal (nunca somados
                            como R$ 0,00):
                          </p>
                          <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px]">
                            {missingItems.map((mi) => (
                              <li key={mi.product.id}>
                                <strong>
                                  {mi.product.name}
                                  {mi.product.sizeLabel
                                    ? ` (${mi.product.sizeLabel})`
                                    : ""}
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

                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-5 py-3.5">
                      <div>
                        <span className="text-xs font-semibold text-slate-600">
                          {market.deliveryInfo ||
                            "Consulte opções de retirada ou entrega diretamente com a loja."}
                        </span>
                      </div>
                      <Link
                        href={`/mercados/${market.id}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-blue"
                      >
                        <Store className="h-3.5 w-3.5" />
                        Ver catálogo do {market.shortName}
                      </Link>
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </div>
    </div>
  );
}
