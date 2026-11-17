"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ECONOMIZE_ICONS, getCategoryIconSrc } from "@/lib/icons";
import {
  TRANSPARENCY_DISCLAIMER,
  calculateUnitPrice,
  formatBRL,
  validateGtin,
} from "@/lib/format";
import { lookupProductByEan } from "@/services/productLookup";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import ProductComparisonCard from "@/components/ProductComparisonCard";
import SkeletonCard from "@/components/SkeletonCard";

function BuscarContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("categoria") || "todas";
  const initialScanner = searchParams.get("scanner") === "1";

  const {
    categories,
    products,
    markets,
    prices,
    location,
    catalogLoading,
    setIsLocationModalOpen,
    registerExternalProduct,
    showToast,
  } = useApp();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isScannerOpen, setIsScannerOpen] = useState(initialScanner);
  const [eanLookupLoading, setEanLookupLoading] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState<string>("todos");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyPromo, setOnlyPromo] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<
    "menor_total" | "menor_unidade" | "distancia" | "nome"
  >("menor_total");

  useEffect(() => {
    const paramQ = searchParams.get("q") || "";
    const paramCat = searchParams.get("categoria");
    const paramScanner = searchParams.get("scanner") === "1";
    if (paramQ) setQuery(paramQ);
    if (paramCat) setSelectedCategory(paramCat);
    if (paramScanner) setIsScannerOpen(true);
  }, [searchParams]);

  useEffect(() => {
    const clean = query.replace(/\D/g, "");
    if (!clean || clean !== query.trim()) return;
    const check = validateGtin(clean);
    if (!check.valid) return;

    const alreadyInState = products.some(
      (p) =>
        p.ean === check.normalized ||
        (check.normalized.length === 12 && p.ean === `0${check.normalized}`) ||
        (check.normalized.length === 13 &&
          check.normalized.startsWith("0") &&
          p.ean === check.normalized.slice(1))
    );
    if (alreadyInState) return;

    let active = true;
    setEanLookupLoading(true);
    lookupProductByEan(check.normalized)
      .then((found) => {
        if (!active) return;
        if (found) {
          registerExternalProduct(found);
          showToast(`Produto encontrado via EAN: ${found.name}`);
        }
      })
      .finally(() => {
        if (active) setEanLookupLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, products, registerExternalProduct, showToast]);

  const handleBarcodeDetected = async (ean: string) => {
    setIsScannerOpen(false);
    setQuery(ean);
    setSelectedCategory("todas");

    const localProd = products.find(
      (p) =>
        p.ean === ean ||
        (ean.length === 12 && p.ean === `0${ean}`) ||
        (ean.length === 13 && ean.startsWith("0") && p.ean === ean.slice(1))
    );
    if (localProd) {
      showToast(`Produto encontrado: ${localProd.name}`);
      return;
    }

    setEanLookupLoading(true);
    showToast(`Consultando código EAN ${ean}...`);
    try {
      const remoteProd = await lookupProductByEan(ean);
      if (remoteProd) {
        registerExternalProduct(remoteProd);
        showToast(`Produto identificado: ${remoteProd.name}`);
      } else {
        showToast(
          `Código EAN ${ean} lido, mas ainda sem cadastro no catálogo nem no Open Food Facts.`
        );
      }
    } finally {
      setEanLookupLoading(false);
    }
  };

  const activeMarkets = useMemo(
    () =>
      markets.filter(
        (m) =>
          m.status === "ativo" &&
          (m.distanceKm === null || m.distanceKm <= location.maxRadiusKm)
      ),
    [markets, location.maxRadiusKm]
  );

  const allBrands = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.brand)
            .filter((b): b is string => Boolean(b && b.trim()))
        )
      ).sort(),
    [products]
  );

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("todas");
    setSelectedBrands([]);
    setSelectedMarketId("todos");
    setMinPrice("");
    setMaxPrice("");
    setOnlyInStock(false);
    setOnlyPromo(false);
    setSortBy("menor_total");
  };

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minVal = minPrice ? parseFloat(minPrice) : null;
    const maxVal = maxPrice ? parseFloat(maxPrice) : null;

    const items = products
      .filter((product) => {
        if (
          selectedCategory !== "todas" &&
          product.categoryId !== selectedCategory
        ) {
          return false;
        }
        if (
          selectedBrands.length > 0 &&
          (!product.brand || !selectedBrands.includes(product.brand))
        ) {
          return false;
        }
        if (q) {
          const catName =
            categories.find((c) => c.id === product.categoryId)?.name || "";
          const match =
            product.name.toLowerCase().includes(q) ||
            (product.brand || "").toLowerCase().includes(q) ||
            (product.sizeLabel || "").toLowerCase().includes(q) ||
            (product.ean || "").includes(q) ||
            (q.length === 12 && product.ean === `0${q}`) ||
            (q.length === 13 &&
              q.startsWith("0") &&
              product.ean === q.slice(1)) ||
            catName.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .map((product) => {
        const productPrices = prices
          .filter((p) => p.productId === product.id)
          .filter((p) =>
            selectedMarketId === "todos" ? true : p.marketId === selectedMarketId
          )
          .filter((p) => (onlyInStock ? p.inStock : true))
          .filter((p) => (onlyPromo ? p.isPromo : true))
          .filter((p) => {
            if (minVal !== null && !isNaN(minVal) && p.price < minVal)
              return false;
            if (maxVal !== null && !isNaN(maxVal) && p.price > maxVal)
              return false;
            return true;
          })
          .map((priceEntry) => {
            const market = activeMarkets.find(
              (m) => m.id === priceEntry.marketId
            );
            return market ? { priceEntry, market } : null;
          })
          .filter(Boolean) as Array<{
          priceEntry: (typeof prices)[0];
          market: (typeof markets)[0];
        }>;

        const lowestPrice =
          productPrices.length > 0
            ? Math.min(...productPrices.map((pp) => pp.priceEntry.price))
            : Infinity;

        const unitCalc =
          productPrices.length > 0 && isFinite(lowestPrice)
            ? calculateUnitPrice(lowestPrice, product)
            : null;
        const lowestUnitPrice = unitCalc ? unitCalc.value : Infinity;

        const distances = productPrices
          .map((pp) => pp.market.distanceKm)
          .filter((d): d is number => d !== null);
        const minDistance =
          distances.length > 0 ? Math.min(...distances) : Infinity;

        return {
          product,
          productPrices,
          lowestPrice,
          lowestUnitPrice,
          minDistance,
        };
      })
      .filter((item) => {
        if (item.productPrices.length > 0) return true;
        return Boolean(q);
      });

    return items.sort((a, b) => {
      if (a.productPrices.length > 0 && b.productPrices.length === 0) return -1;
      if (a.productPrices.length === 0 && b.productPrices.length > 0) return 1;
      if (sortBy === "menor_total") return a.lowestPrice - b.lowestPrice;
      if (sortBy === "menor_unidade")
        return a.lowestUnitPrice - b.lowestUnitPrice;
      if (sortBy === "distancia") return a.minDistance - b.minDistance;
      return a.product.name.localeCompare(b.product.name);
    });
  }, [
    products,
    prices,
    activeMarkets,
    categories,
    query,
    selectedCategory,
    selectedBrands,
    selectedMarketId,
    minPrice,
    maxPrice,
    onlyInStock,
    onlyPromo,
    sortBy,
  ]);

  const finitePrices = filteredResults
    .map((r) => r.lowestPrice)
    .filter((p) => Number.isFinite(p));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetectedEan={handleBarcodeDetected}
      />

      {/* Cabeçalho da Página de Busca */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-md bg-brand-light px-2.5 py-0.5 text-xs font-bold text-brand-navy">
              Comparador de Preços Local • Leitor EAN
            </span>
            <h1 className="mt-1 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
              {query
                ? `Resultados para "${query}"`
                : "Buscar Produtos e Comparar Preços"}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {TRANSPARENCY_DISCLAIMER} • Raio atual: até{" "}
              <strong>{location.maxRadiusKm} km</strong>
              {location.neighborhood ? ` de ${location.neighborhood}` : ""}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-brand-yellow shadow-2xs transition hover:bg-brand-blue hover:text-white"
            >
              <Camera className="h-4 w-4" />
              Escanear Código de Barras
            </button>

            <label
              htmlFor="sort-select"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
            >
              <SlidersHorizontal className="h-4 w-4 text-brand-blue" />
              Ordenar por:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-brand-navy focus:border-brand-blue focus:outline-none"
            >
              <option value="menor_total">Menor Preço Total (R$)</option>
              <option value="menor_unidade">
                Menor Preço por Medida (R$/kg ou L)
              </option>
              <option value="distancia">Mercado Mais Próximo (km)</option>
              <option value="nome">Nome do Produto (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Explicação Clara sobre Preço Total vs Preço por Unidade */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand-blue/20 bg-brand-light/50 px-4 py-2.5 text-xs text-slate-700">
          <div>
            <strong>Transparência na comparação:</strong> Produtos de pesos ou
            volumes diferentes (ex.: Arroz 5 kg e Arroz 1 kg) nunca são
            misturados como o mesmo item. Compare tanto o{" "}
            <span className="font-bold text-emerald-700">Menor Preço Total</span>{" "}
            quanto o{" "}
            <span className="font-bold text-brand-navy">
              Menor Preço por Quilo/Litro
            </span>
            .
          </div>
        </div>
      </div>

      {/* Layout Principal: Barra Lateral de Filtros + Grade de Produtos */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar de Filtros */}
        <aside className="lg:col-span-3">
          <div className="sticky top-28 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="flex items-center gap-1.5 font-heading text-sm font-bold text-brand-navy">
                <Filter className="h-4 w-4 text-brand-blue" />
                Filtros de Busca
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex min-h-[44px] items-center gap-1 px-2 text-xs font-semibold text-brand-navy hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                Limpar
              </button>
            </div>

            {/* Busca por palavra-chave + Botão Câmera */}
            <div>
              <label
                htmlFor="sidebar-search"
                className="block text-xs font-bold text-slate-700"
              >
                Produto, Marca ou EAN
              </label>
              <div className="relative mt-1.5 flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    id="sidebar-search"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ex: arroz, leite, 789..."
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 py-2 pr-8 pl-3 text-xs text-slate-800 focus:border-brand-blue focus:outline-none"
                  />
                  {eanLookupLoading ? (
                    <Loader2 className="absolute top-3.5 right-2.5 h-3.5 w-3.5 animate-spin text-brand-blue" />
                  ) : (
                    <Search className="absolute top-3.5 right-2.5 h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  title="Escanear código de barras com câmera"
                  aria-label="Escanear código de barras com câmera"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-brand-navy text-brand-yellow transition hover:bg-brand-blue hover:text-white"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Categoria */}
            <div>
              <p className="text-xs font-bold text-slate-700">Categoria</p>
              <div className="mt-2 space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("todas")}
                  className={`flex min-h-[44px] w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition ${
                    selectedCategory === "todas"
                      ? "bg-brand-navy font-bold text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Todas as categorias ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex min-h-[44px] w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition ${
                      selectedCategory === cat.id
                        ? "bg-brand-navy font-bold text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <img
                      src={getCategoryIconSrc(cat.id)}
                      alt=""
                      width={28}
                      height={28}
                      loading="lazy"
                      className="h-7 w-7 shrink-0 rounded-full border border-brand-yellow bg-white object-cover"
                    />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mercado */}
            <div>
              <label
                htmlFor="filter-market"
                className="block text-xs font-bold text-slate-700"
              >
                Mercado Parceiro
              </label>
              <select
                id="filter-market"
                value={selectedMarketId}
                onChange={(e) => setSelectedMarketId(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-brand-blue focus:outline-none"
              >
                <option value="todos">
                  Todos no raio ({activeMarkets.length})
                </option>
                {activeMarkets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.shortName}
                    {m.distanceKm !== null ? ` (~ ${m.distanceKm} km)` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Marca */}
            {allBrands.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-700">Marca</p>
                <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {allBrands.map((brand) => (
                    <label
                      key={brand}
                      className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-navy focus:ring-brand-blue"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Faixa de Preço */}
            <div>
              <p className="text-xs font-bold text-slate-700">
                Faixa de Preço (R$)
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="min-price" className="sr-only">
                    Preço mínimo
                  </label>
                  <input
                    id="min-price"
                    type="number"
                    min="0"
                    step="0.5"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Mín R$"
                    className="min-h-[44px] w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="max-price" className="sr-only">
                    Preço máximo
                  </label>
                  <input
                    id="max-price"
                    type="number"
                    min="0"
                    step="0.5"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Máx R$"
                    className="min-h-[44px] w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Disponibilidade e Promoções */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-brand-navy"
                />
                <span>Apenas itens disponíveis</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyPromo}
                  onChange={(e) => setOnlyPromo(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-brand-navy"
                />
                <span>Apenas produtos em promoção</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Resultados da Busca */}
        <div className="lg:col-span-9">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-600">
            <span>
              <strong>{filteredResults.length}</strong> produtos encontrados para
              comparação
            </span>
            {finitePrices.length > 0 && (
              <span>
                Menor preço da página:{" "}
                <strong className="tabular-price text-emerald-700">
                  {formatBRL(Math.min(...finitePrices))}
                </strong>
              </span>
            )}
          </div>

          {catalogLoading || eanLookupLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-2xs">
              <img
                src={ECONOMIZE_ICONS["passo-busca-ean"].src}
                alt=""
                width={80}
                height={80}
                loading="lazy"
                className="mx-auto h-20 w-20 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-sm"
              />
              <h3 className="mt-3 font-heading text-lg font-bold text-brand-navy">
                Nenhum produto encontrado
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Escaneie o código de barras EAN da embalagem ou verifique se o
                raio de distância configurado ({location.maxRadiusKm} km) possui
                mercados com ofertas ativas.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-bold text-brand-yellow hover:bg-brand-blue hover:text-white"
                >
                  <Camera className="h-4 w-4" />
                  Escanear Código de Barras
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-brand-navy hover:border-brand-blue"
                >
                  Limpar todos os filtros
                </button>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:border-brand-blue"
                >
                  Alterar raio de localização
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredResults.map(({ product, productPrices }) => (
                <ProductComparisonCard
                  key={product.id}
                  product={product}
                  productPrices={productPrices}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl p-8 text-center text-sm text-slate-500">
          Carregando comparador de preços...
        </div>
      }
    >
      <BuscarContent />
    </Suspense>
  );
}
