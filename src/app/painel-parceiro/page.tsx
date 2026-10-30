"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  FileUp,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Tag,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatBRL } from "@/data/mockData";

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

  // Isolate to partner's own market (default Mercado Exemplo A)
  const partnerMarketId = user?.marketId || "mercado-a";
  const myMarket =
    markets.find((m) => m.id === partnerMarketId) || markets[0];

  const [activeTab, setActiveTab] = useState<
    "catalogo" | "novo_produto" | "importar" | "perfil" | "metricas"
  >("catalogo");

  // Edit price inline state
  const [editingPriceMap, setEditingPriceMap] = useState<
    Record<string, string>
  >({});

  // New Product form state
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

  // Profile form state
  const [editHours, setEditHours] = useState(myMarket.openingHours);
  const [editPhone, setEditPhone] = useState(myMarket.phone);
  const [editDeliveryInfo, setEditDeliveryInfo] = useState(
    myMarket.deliveryInfo
  );

  // Batch CSV import state
  const [csvText, setCsvText] = useState(
    "oleo-soja-900ml;7.99;true;Oferta Relâmpago\narroz-5kg;27.90;false;"
  );

  if (!user || (user.role !== "mercado" && user.role !== "admin")) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
          <ShieldAlert className="mx-auto h-12 w-12 text-brand-blue" />
          <h1 className="mt-3 font-heading text-2xl font-extrabold text-brand-navy">
            Área Exclusiva do Mercado Parceiro
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-600 sm:text-sm">
            Para gerenciar o catálogo, preços, promoções e perfil do
            estabelecimento, autentique-se com perfil de{" "}
            <strong>Mercado Parceiro</strong>.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => loginDemoRole("mercado")}
              className="rounded-xl bg-brand-blue px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-brand-navy sm:text-sm"
            >
              Entrar como Mercado Parceiro (Demonstração)
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
        name: newName.trim(),
        brand: newBrand.trim() || "Marca Local",
        categoryId: newCat,
        sizeLabel: newSizeLabel.trim() || "1 un",
        unitType: newUnitType,
        unitMultiplier: parsedMult,
        imageUrl:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80",
        isPopular: true,
        description: `${newName} (${newSizeLabel}) cadastrado pelo painel do parceiro.`,
      },
      parsedPrice,
      newPromo,
      newPromoLabel
    );
    setNewName("");
    setNewBrand("");
    setActiveTab("catalogo");
  };

  const handleBatchImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csvText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    let count = 0;
    lines.forEach((line) => {
      const [prodId, priceStr, promoStr, label] = line.split(";");
      const val = parseFloat((priceStr || "").replace(",", "."));
      if (prodId && !isNaN(val) && val > 0) {
        upsertMarketPrice(
          myMarket.id,
          prodId.trim(),
          val,
          promoStr?.trim() === "true",
          label?.trim()
        );
        count += 1;
      }
    });
    showToast(`${count} preços importados e atualizados no catálogo!`);
    setActiveTab("catalogo");
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
      {/* Cabeçalho do Painel */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-brand-navy p-6 text-white shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-brand-yellow px-2.5 py-0.5 text-xs font-extrabold text-brand-navy">
              Painel do Mercado Parceiro • Plano{" "}
              {myMarket.planId.toUpperCase()}
            </span>
            <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs">
              Isolamento de Dados Ativo (Apenas {myMarket.shortName})
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
              { id: "catalogo", label: `Catálogo e Preços (${myPrices.length})` },
              { id: "novo_produto", label: "+ Novo Produto" },
              { id: "importar", label: "Importar Planilha/CSV" },
              { id: "perfil", label: "Perfil e Horários" },
              { id: "metricas", label: "Métricas (Demo)" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
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
                      className="h-12 w-12 rounded-xl border border-slate-100 object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-sm font-bold text-brand-navy">
                          {product.name} — {product.sizeLabel}
                        </h3>
                        {priceEntry.isPromo && (
                          <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-extrabold text-brand-navy">
                            {priceEntry.promoLabel || "Em Oferta"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {product.brand} • Atualizado: {priceEntry.updatedAt}
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
                        className="w-24 rounded-xl border border-slate-200 px-2.5 py-1.5 text-sm font-bold text-brand-navy"
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
                      className="inline-flex items-center gap-1 rounded-xl bg-brand-green px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
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
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
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
                      className={`rounded-xl px-3 py-2 text-xs font-bold ${
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
                      className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
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
            Informe a medida exata (ex: 5 kg, 900 ml) para cálculo correto de
            preço por unidade.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                placeholder="Ex.: Adria (Fictício)"
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
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-xs font-bold text-white hover:bg-brand-navy"
          >
            <Plus className="h-4 w-4" />
            Adicionar Produto ao Catálogo
          </button>
        </form>
      )}

      {/* ABA 3: IMPORTAR CATÁLOGO (CSV/TEXTO) */}
      {activeTab === "importar" && (
        <form
          onSubmit={handleBatchImport}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs"
        >
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
            <FileUp className="h-5 w-5 text-brand-blue" />
            Importação Rápida de Preços (CSV / Lote)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Formato por linha:{" "}
            <code>id_do_produto;preco;em_promocao(true/false);selo_oferta</code>
          </p>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs text-slate-800"
          />
          <button
            type="submit"
            className="mt-3 rounded-xl bg-brand-green px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Processar e Atualizar Preços em Lote
          </button>
        </form>
      )}

      {/* ABA 4: PERFIL DO ESTABELECIMENTO */}
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
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-xs font-bold text-white"
          >
            <CheckCircle2 className="h-4 w-4" />
            Salvar Alterações do Perfil
          </button>
        </form>
      )}

      {/* ABA 5: MÉTRICAS DE VISIBILIDADE (DEMONSTRAÇÃO CLARA) */}
      {activeTab === "metricas" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
                <BarChart3 className="h-5 w-5 text-brand-green" />
                Painel de Visibilidade Local (Dados Simulados de Demonstração)
              </h2>
              <p className="text-xs text-slate-500">
                Aviso: Estes indicadores são ilustrativos para demonstrar o
                painel do parceiro e não representam tráfego real.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-brand-light/50 p-4">
              <span className="text-xs font-semibold text-slate-600">
                Visualizações do Perfil (Simulado)
              </span>
              <p className="mt-1 font-heading text-2xl font-extrabold text-brand-blue">
                340 exibições
              </p>
              <span className="text-[11px] text-slate-500">
                Dado fictício de demonstração
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-emerald-50/60 p-4">
              <span className="text-xs font-semibold text-slate-600">
                Inclusões em Listas de Compras (Simulado)
              </span>
              <p className="mt-1 font-heading text-2xl font-extrabold text-brand-green">
                85 cestas comparadas
              </p>
              <span className="text-[11px] text-slate-500">
                Dado fictício de demonstração
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-amber-50/70 p-4">
              <span className="text-xs font-semibold text-slate-600">
                Produtos Mais Buscados no Bairro (Simulado)
              </span>
              <p className="mt-1 font-heading text-base font-extrabold text-brand-navy">
                1. Arroz 5 kg • 2. Leite 1 L • 3. Óleo 900 ml
              </p>
              <span className="text-[11px] text-slate-500">
                Dado fictício de demonstração
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
