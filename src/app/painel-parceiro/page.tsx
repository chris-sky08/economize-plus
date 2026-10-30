"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatBRL } from "@/data/mockData";
import type { ExtractedFlyerItem } from "@/app/api/ingest/flyer/route";
import type { ParsedCsvRow } from "@/app/api/ingest/csv/route";

export default function PainelParceiroPage() {
  const {
    user,
    markets,
    products,
    prices,
    categories,
    loginDemoRole,
    upsertMarketPrice,
    addNewProductWithPrice,
    removeMarketPrice,
    updateMarketProfile,
    showToast,
  } = useApp();

  const partnerMarketId = user?.marketId || "mercado-a";
  const myMarket =
    markets.find((m) => m.id === partnerMarketId) || markets[0];

  const [activeTab, setActiveTab] = useState<
    "catalogo" | "novo_produto" | "importar" | "encarte_ia" | "perfil" | "metricas"
  >("catalogo");

  const [editingPriceMap, setEditingPriceMap] = useState<
    Record<string, string>
  >({});

  // Novo produto
  const [newEan, setNewEan] = useState("7896006711155");
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCat, setNewCat] = useState("mercearia");
  const [newSizeLabel, setNewSizeLabel] = useState("1 kg");
  const [newUnitType, setNewUnitType] = useState<"kg" | "L" | "un" | "rolo">(
    "kg"
  );
  const [newMultiplier, setNewMultiplier] = useState("1");
  const [newPrice, setNewPrice] = useState("9.90");
  const [newPromo, setNewPromo] = useState(false);
  const [newPromoLabel, setNewPromoLabel] = useState("Oferta do Bairro");

  // Perfil
  const [editHours, setEditHours] = useState(myMarket.openingHours);
  const [editPhone, setEditPhone] = useState(myMarket.phone);
  const [editDeliveryInfo, setEditDeliveryInfo] = useState(
    myMarket.deliveryInfo
  );

  // Importação CSV (/api/ingest/csv)
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState(
    "ean,nome,preco,oferta\n7896036090244,Óleo de Soja Refinado 900ml,7.49,Oferta CSV\n7896006711117,Arroz Branco Tipo 1 5kg,25.90,true\n7898215151784,Leite UHT Integral 1L,4.89,Menor Preço"
  );
  const [loadingCsv, setLoadingCsv] = useState(false);

  // Leitura de Encarte IA (/api/ingest/flyer)
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [loadingFlyer, setLoadingFlyer] = useState(false);
  const [extractedFlyerItems, setExtractedFlyerItems] = useState<
    ExtractedFlyerItem[]
  >([]);

  if (!user || (user.role !== "mercado" && user.role !== "admin")) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
          <ShieldAlert className="mx-auto h-12 w-12 text-brand-blue" />
          <h1 className="mt-3 font-heading text-2xl font-extrabold text-brand-navy">
            Área Exclusiva do Mercado Parceiro
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-600 sm:text-sm">
            Para gerenciar o catálogo, subir planilhas CSV, extrair ofertas de
            encartes via IA e atualizar o perfil do estabelecimento, entre com
            perfil de <strong>Mercado Parceiro</strong>.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => loginDemoRole("mercado")}
              className="min-h-[44px] rounded-xl bg-brand-blue px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-brand-navy sm:text-sm"
            >
              Acessar como Mercado Parceiro
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myPrices = prices
    .filter((p) => p.marketId === myMarket.id)
    .map((priceEntry) => {
      const product = products.find((prod) => prod.id === priceEntry.productId);
      return product ? { priceEntry, product } : null;
    })
    .filter(Boolean) as Array<{
    priceEntry: (typeof prices)[0];
    product: (typeof products)[0];
  }>;

  const outdatedItems = myPrices.filter(
    ({ priceEntry }) =>
      priceEntry.needsUpdateAlert || priceEntry.updatedAt.includes("dias")
  );

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(newPrice.replace(",", "."));
    const parsedMult = parseFloat(newMultiplier.replace(",", ".")) || 1;
    if (!newName.trim() || isNaN(parsedPrice) || parsedPrice <= 0) return;

    addNewProductWithPrice(
      myMarket.id,
      {
        ean: newEan.trim() || `${Date.now()}`,
        name: newName.trim(),
        brand: newBrand.trim() || "Marca Local",
        categoryId: newCat,
        sizeLabel: newSizeLabel.trim() || "1 un",
        unitType: newUnitType,
        unitMultiplier: parsedMult,
        imageUrl: "/logo-oficial.jpg",
        isPopular: true,
        description: `${newName} (${newSizeLabel}) cadastrado pelo painel do parceiro.`,
      },
      parsedPrice,
      newPromo,
      newPromoLabel,
      "partner_csv"
    );
    setNewName("");
    setNewBrand("");
    setActiveTab("catalogo");
  };

  const handleCsvIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCsv(true);
    try {
      let response: Response;
      if (csvFile) {
        const formData = new FormData();
        formData.append("file", csvFile);
        formData.append("supermarket_id", myMarket.id);
        response = await fetch("/api/ingest/csv", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/ingest/csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            csvText,
            supermarket_id: myMarket.id,
          }),
        });
      }

      const data = (await response.json()) as {
        success: boolean;
        count: number;
        items: ParsedCsvRow[];
      };

      if (data.success && Array.isArray(data.items)) {
        data.items.forEach((row) => {
          const existingProd = products.find(
            (p) =>
              p.ean === row.ean ||
              p.name.toLowerCase() === row.nome.toLowerCase()
          );
          if (existingProd) {
            upsertMarketPrice(
              myMarket.id,
              existingProd.id,
              row.preco,
              row.oferta,
              row.promo_label,
              true,
              "partner_csv"
            );
          } else {
            addNewProductWithPrice(
              myMarket.id,
              {
                ean: row.ean,
                name: row.nome,
                brand: "Catálogo CSV",
                categoryId: "mercearia",
                sizeLabel: "1 un",
                unitType: "un",
                unitMultiplier: 1,
                imageUrl: "/logo-oficial.jpg",
                isPopular: true,
                description: `${row.nome} (EAN ${row.ean}) importado via CSV.`,
              },
              row.preco,
              row.oferta,
              row.promo_label,
              "partner_csv"
            );
          }
        });
        showToast(
          `${data.count} produtos processados via /api/ingest/csv e salvos no catálogo!`
        );
        setActiveTab("catalogo");
      }
    } catch {
      showToast("Erro ao processar a planilha CSV.");
    } finally {
      setLoadingCsv(false);
    }
  };

  const handleFlyerIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingFlyer(true);
    try {
      const formData = new FormData();
      if (flyerFile) {
        formData.append("file", flyerFile);
      }
      formData.append("supermarket_id", myMarket.id);

      const res = await fetch("/api/ingest/flyer", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as {
        success: boolean;
        items: ExtractedFlyerItem[];
      };

      if (data.success && Array.isArray(data.items)) {
        setExtractedFlyerItems(data.items);
        showToast(
          `${data.items.length} ofertas identificadas do encarte via IA!`
        );
      }
    } catch {
      showToast("Não foi possível analisar o encarte no momento.");
    } finally {
      setLoadingFlyer(false);
    }
  };

  const applyExtractedFlyerToCatalog = () => {
    extractedFlyerItems.forEach((item) => {
      const matched = products.find(
        (p) =>
          p.ean === item.ean_or_name ||
          p.name.toLowerCase().includes(item.ean_or_name.toLowerCase())
      );
      if (matched) {
        upsertMarketPrice(
          myMarket.id,
          matched.id,
          item.price,
          true,
          item.promo_label,
          true,
          "flyer_ocr"
        );
      } else {
        addNewProductWithPrice(
          myMarket.id,
          {
            ean: `${Date.now().toString().slice(-13)}`,
            name: item.ean_or_name,
            brand: item.brand || "Oferta Encarte",
            categoryId: "mercearia",
            sizeLabel: item.weight || "1 un",
            unitType: "un",
            unitMultiplier: 1,
            imageUrl: "/logo-oficial.jpg",
            isPopular: true,
            description: `${item.ean_or_name} (${item.weight}) extraído via OCR de encarte.`,
          },
          item.price,
          true,
          item.promo_label,
          "flyer_ocr"
        );
      }
    });
    setExtractedFlyerItems([]);
    setActiveTab("catalogo");
    showToast("Ofertas do encarte publicadas no catálogo do mercado!");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateMarketProfile(myMarket.id, {
      openingHours: editHours,
      phone: editPhone,
      deliveryInfo: editDeliveryInfo,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-brand-navy p-6 text-white shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-brand-yellow px-2.5 py-0.5 text-xs font-extrabold text-brand-navy">
              Painel do Mercado Parceiro • Plano{" "}
              {myMarket.planId.toUpperCase()}
            </span>
            <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs">
              CNPJ: {myMarket.cnpj}
            </span>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-extrabold sm:text-3xl">
            {myMarket.name}
          </h1>
          <p className="text-xs text-brand-light">
            Última atualização geral do catálogo: {myMarket.lastCatalogUpdate}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              {
                id: "catalogo",
                label: `Catálogo (${myPrices.length})`,
              },
              { id: "novo_produto", label: "+ Novo Produto" },
              { id: "importar", label: "Subir Planilha CSV" },
              { id: "encarte_ia", label: "Ler Encarte com IA (OCR)" },
              { id: "perfil", label: "Perfil e Horários" },
              { id: "metricas", label: "Métricas" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === t.id
                  ? "bg-brand-yellow text-brand-navy"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerta de Preços Desatualizados */}
      {outdatedItems.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h2 className="font-heading text-sm font-bold text-amber-950">
                Alerta de Preços Desatualizados ({outdatedItems.length}{" "}
                {outdatedItems.length === 1 ? "item" : "itens"})
              </h2>
              <p className="text-xs text-amber-900">
                Manter os preços confirmados ajuda o consumidor a confiar no
                catálogo do seu mercado.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {outdatedItems.map(({ product, priceEntry }) => (
              <button
                key={priceEntry.id}
                type="button"
                onClick={() =>
                  upsertMarketPrice(
                    myMarket.id,
                    product.id,
                    priceEntry.price,
                    priceEntry.isPromo,
                    priceEntry.promoLabel,
                    priceEntry.inStock
                  )
                }
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Confirmar {product.name} ({formatBRL(priceEntry.price)})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ABA 1: CATÁLOGO E PREÇOS */}
      {activeTab === "catalogo" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-brand-navy">
                Gerenciar Produtos, Preços e Promoções
              </h2>
              <p className="text-xs text-slate-500">
                Altere o valor ou clique em Promoção para destacar a oferta em
                amarelo para os consumidores.
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {myPrices.map(({ priceEntry, product }) => {
              const currentInputVal =
                editingPriceMap[product.id] ?? priceEntry.price.toFixed(2);

              return (
                <div
                  key={priceEntry.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-12 w-12 rounded-xl border border-slate-100 bg-white object-contain p-0.5"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-sm font-bold text-brand-navy">
                          {product.name} — {product.sizeLabel}
                        </h3>
                        {priceEntry.isPromo && (
                          <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-extrabold text-brand-navy">
                            {priceEntry.promoLabel || "Em Oferta"}
                          </span>
                        )}
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          Fonte: {priceEntry.source}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {product.brand} • EAN {product.ean} • Atualizado:{" "}
                        {priceEntry.updatedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={currentInputVal}
                        onChange={(e) =>
                          setEditingPriceMap((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        aria-label={`Preço de ${product.name}`}
                        className="tabular-price w-24 rounded-xl border border-slate-200 px-2.5 py-1.5 text-sm font-bold text-brand-navy"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const val = parseFloat(currentInputVal);
                        if (!isNaN(val) && val > 0) {
                          upsertMarketPrice(
                            myMarket.id,
                            product.id,
                            val,
                            priceEntry.isPromo,
                            priceEntry.promoLabel,
                            priceEntry.inStock
                          );
                        }
                      }}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-brand-green px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Salvar Preço
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        upsertMarketPrice(
                          myMarket.id,
                          product.id,
                          priceEntry.price,
                          !priceEntry.isPromo,
                          !priceEntry.isPromo ? "Oferta do Dia" : undefined,
                          priceEntry.inStock
                        )
                      }
                      className={`inline-flex min-h-[40px] items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
                        priceEntry.isPromo
                          ? "bg-brand-yellow text-brand-navy"
                          : "border border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <Tag className="h-3.5 w-3.5" />
                      {priceEntry.isPromo ? "Promo Ativa" : "Ativar Promo"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        upsertMarketPrice(
                          myMarket.id,
                          product.id,
                          priceEntry.price,
                          priceEntry.isPromo,
                          priceEntry.promoLabel,
                          !priceEntry.inStock
                        )
                      }
                      className={`min-h-[40px] rounded-xl px-3 py-2 text-xs font-bold ${
                        priceEntry.inStock
                          ? "bg-emerald-50 text-brand-green"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {priceEntry.inStock ? "Em Estoque" : "Sem Estoque"}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeMarketPrice(myMarket.id, product.id)}
                      className="min-h-[40px] min-w-[40px] rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Remover ${product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: ADICIONAR NOVO PRODUTO */}
      {activeTab === "novo_produto" && (
        <form
          onSubmit={handleCreateProduct}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs"
        >
          <h2 className="font-heading text-lg font-bold text-brand-navy">
            Cadastrar Novo Produto no Catálogo
          </h2>
          <p className="text-xs text-slate-500">
            Informe o código EAN-13 e a medida exata (ex: 5 kg, 900 ml) para
            cálculo proporcional por unidade.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Código EAN-13 *
              </label>
              <input
                type="text"
                required
                value={newEan}
                onChange={(e) => setNewEan(e.target.value)}
                placeholder="Ex.: 7896006711155"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Nome do Produto *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex.: Macarrão Espaguete"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Marca *
              </label>
              <input
                type="text"
                required
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Ex.: Adria"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Categoria
              </label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Tamanho / Peso na Embalagem *
              </label>
              <input
                type="text"
                required
                value={newSizeLabel}
                onChange={(e) => setNewSizeLabel(e.target.value)}
                placeholder="Ex.: 500 g"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Unidade de Medida Base (Cálculo)
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  value={newUnitType}
                  onChange={(e) =>
                    setNewUnitType(
                      e.target.value as "kg" | "L" | "un" | "rolo"
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="kg">kg</option>
                  <option value="L">L</option>
                  <option value="un">un</option>
                  <option value="rolo">rolo</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={newMultiplier}
                  onChange={(e) => setNewMultiplier(e.target.value)}
                  placeholder="Fator (ex: 0.5)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Preço no Mercado (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-brand-green"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={newPromo}
                onChange={(e) => setNewPromo(e.target.checked)}
                className="h-4 w-4 rounded text-brand-blue"
              />
              Produto em Promoção
            </label>
            {newPromo && (
              <input
                type="text"
                value={newPromoLabel}
                onChange={(e) => setNewPromoLabel(e.target.value)}
                placeholder="Selo da Promoção (ex: -15% OFF)"
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
              />
            )}
          </div>

          <button
            type="submit"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-xs font-bold text-white hover:bg-brand-navy"
          >
            <Plus className="h-4 w-4" />
            Adicionar Produto ao Catálogo
          </button>
        </form>
      )}

      {/* ABA 3: IMPORTAR CATÁLOGO VIA ROTA POST /api/ingest/csv */}
      {activeTab === "importar" && (
        <form
          onSubmit={handleCsvIngest}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs"
        >
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
            <FileSpreadsheet className="h-5 w-5 text-brand-blue" />
            Importação de Planilha CSV em Massa (<code>POST /api/ingest/csv</code>)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Envie um arquivo <code>.csv</code> ou cole os dados abaixo no
            formato padrão: <code>ean,nome,preco,oferta</code>
          </p>

          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700">
              Selecionar arquivo .csv do computador (Opcional):
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="mt-1.5 block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-light file:px-4 file:py-2 file:text-xs file:font-bold file:text-brand-blue hover:file:bg-brand-blue hover:file:text-white"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700">
              Ou edite/cole as linhas CSV diretamente:
            </label>
            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loadingCsv}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingCsv ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            Processar Planilha CSV e Atualizar Catálogo
          </button>
        </form>
      )}

      {/* ABA 4: CAPTURA DE PREÇOS DE ENCARTE VIA GEMINI OCR (/api/ingest/flyer) */}
      {activeTab === "encarte_ia" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
            <Sparkles className="h-5 w-5 text-brand-blue" />
            Extração de Preços de Encarte por IA (<code>POST /api/ingest/flyer</code>)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Envie a foto ou PDF do encarte de ofertas do mercado. O serviço
            multimodal extrai automaticamente{" "}
            <code>[{"{ ean_or_name, brand, weight, price, promo_label }"}]</code>{" "}
            pronto para publicar em <code>market_prices</code>.
          </p>

          <form onSubmit={handleFlyerIngest} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Foto ou PDF do Encarte do Supermercado:
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFlyerFile(e.target.files?.[0] || null)}
                className="mt-1.5 block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-light file:px-4 file:py-2 file:text-xs file:font-bold file:text-brand-blue hover:file:bg-brand-blue hover:file:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loadingFlyer}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-navy disabled:opacity-50"
            >
              {loadingFlyer ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Extrair Ofertas do Encarte com IA
            </button>
          </form>

          {extractedFlyerItems.length > 0 && (
            <div className="mt-6 rounded-2xl border border-brand-green/30 bg-emerald-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-sm font-bold text-brand-navy">
                  Ofertas extraídas do encarte ({extractedFlyerItems.length}):
                </h3>
                <button
                  type="button"
                  onClick={applyExtractedFlyerToCatalog}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar e Salvar em market_prices
                </button>
              </div>
              <div className="mt-3 divide-y divide-emerald-100">
                {extractedFlyerItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-brand-navy">
                        {it.ean_or_name}
                      </span>{" "}
                      • {it.brand} •{" "}
                      <span className="font-semibold text-brand-blue">
                        {it.weight}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-brand-yellow px-2 py-0.5 text-[10px] font-bold text-brand-navy">
                        {it.promo_label}
                      </span>
                      <span className="tabular-price font-heading text-sm font-extrabold text-brand-green">
                        {formatBRL(it.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 5: PERFIL DO ESTABELECIMENTO */}
      {activeTab === "perfil" && (
        <form
          onSubmit={handleSaveProfile}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs"
        >
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
            <Building2 className="h-5 w-5 text-brand-blue" />
            Dados do Estabelecimento, Horários e Entrega
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Horário de Funcionamento
              </label>
              <input
                type="text"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Telefone de Atendimento
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                Informações de Entrega / Retirada
              </label>
              <input
                type="text"
                value={editDeliveryInfo}
                onChange={(e) => setEditDeliveryInfo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white"
          >
            <CheckCircle2 className="h-4 w-4" />
            Salvar Alterações do Perfil
          </button>
        </form>
      )}

      {/* ABA 6: MÉTRICAS DE VISIBILIDADE */}
      {activeTab === "metricas" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
                <BarChart3 className="h-5 w-5 text-brand-green" />
                Indicadores de Visibilidade do Estabelecimento
              </h2>
              <p className="text-xs text-slate-500">
                Resumo consolidado dos itens ativos e buscas na região de{" "}
                {myMarket.neighborhood}.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-brand-light/50 p-4">
              <span className="text-xs font-semibold text-slate-600">
                Produtos com Preço Ativo
              </span>
              <p className="tabular-price mt-1 font-heading text-2xl font-extrabold text-brand-blue">
                {myPrices.length} itens
              </p>
              <span className="text-[11px] text-slate-500">
                Catálogo sincronizado
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-emerald-50/60 p-4">
              <span className="text-xs font-semibold text-slate-600">
                Ofertas Promocionais Ativas
              </span>
              <p className="tabular-price mt-1 font-heading text-2xl font-extrabold text-brand-green">
                {myPrices.filter((p) => p.priceEntry.isPromo).length} ofertas
              </p>
              <span className="text-[11px] text-slate-500">
                Destaques no comparador
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-amber-50/70 p-4">
              <span className="text-xs font-semibold text-slate-600">
                Principais Categorias Cadastradas
              </span>
              <p className="mt-1 font-heading text-base font-extrabold text-brand-navy">
                Mercearia • Laticínios • Hortifruti
              </p>
              <span className="text-[11px] text-slate-500">
                Cobertura regional: {myMarket.neighborhood}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
