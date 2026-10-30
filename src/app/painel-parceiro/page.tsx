"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatBRL, validateGtin } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { CsvLineError } from "@/app/api/ingest/csv/route";

interface PendingReviewItem {
  id: string;
  supermarket_id: string;
  product_id: string;
  price: number;
  is_promo: boolean;
  promo_label: string | null;
  source: string;
  status: string;
  valid_from: string | null;
  valid_until: string | null;
  updated_at: string;
  products: {
    id: string;
    ean: string | null;
    name: string;
    brand: string | null;
    size_label: string | null;
    unit_type: string | null;
    unit_value: number | null;
  } | null;
}

export default function PainelParceiroPage() {
  const {
    user,
    markets,
    products,
    prices,
    categories,
    upsertMarketPrice,
    addNewProductWithPrice,
    removeMarketPrice,
    updateMarketProfile,
    refreshCatalog,
    showToast,
  } = useApp();

  const [selectedAdminMarketId, setSelectedAdminMarketId] =
    useState<string>("");

  const effectiveMarketId =
    user?.role === "admin"
      ? selectedAdminMarketId || user?.marketId || markets[0]?.id || null
      : user?.marketId || null;

  const myMarket = markets.find((m) => m.id === effectiveMarketId) || null;

  const [activeTab, setActiveTab] = useState<
    "catalogo" | "novo_produto" | "importar" | "encarte_ia" | "perfil" | "metricas"
  >("catalogo");

  const [editingPriceMap, setEditingPriceMap] = useState<
    Record<string, string>
  >({});

  // Novo produto
  const [newEan, setNewEan] = useState("");
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCat, setNewCat] = useState("mercearia");
  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [newUnitType, setNewUnitType] = useState<"kg" | "L" | "un" | "rolo">(
    "kg"
  );
  const [newMultiplier, setNewMultiplier] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPromo, setNewPromo] = useState(false);
  const [newPromoLabel, setNewPromoLabel] = useState("");
  const [newProdError, setNewProdError] = useState<string | null>(null);

  // Perfil
  const [editHours, setEditHours] = useState(myMarket?.openingHours || "");
  const [editPhone, setEditPhone] = useState(myMarket?.phone || "");
  const [editDeliveryInfo, setEditDeliveryInfo] = useState(
    myMarket?.deliveryInfo || ""
  );

  // Importação CSV (/api/ingest/csv)
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [csvLineErrors, setCsvLineErrors] = useState<CsvLineError[]>([]);
  const [csvSummary, setCsvSummary] = useState<string | null>(null);

  // Leitura de Encarte IA (/api/ingest/flyer) + Revisão (/api/ingest/review)
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [loadingFlyer, setLoadingFlyer] = useState(false);
  const [flyerError, setFlyerError] = useState<string | null>(null);
  const [pendingReviewItems, setPendingReviewItems] = useState<
    PendingReviewItem[]
  >([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewEdits, setReviewEdits] = useState<
    Record<string, { price: string; promo_label: string }>
  >({});

  useEffect(() => {
    if (myMarket) {
      setEditHours(myMarket.openingHours || "");
      setEditPhone(myMarket.phone || "");
      setEditDeliveryInfo(myMarket.deliveryInfo || "");
    }
  }, [myMarket]);

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  const fetchPendingReviewItems = useCallback(async () => {
    if (!myMarket) return;
    setLoadingReview(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(
        `/api/ingest/review?supermarket_id=${encodeURIComponent(myMarket.id)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = (await res.json()) as { items: PendingReviewItem[] };
        setPendingReviewItems(data.items || []);
      }
    } catch {
      // ignora erro silencioso na busca de pendentes
    } finally {
      setLoadingReview(false);
    }
  }, [myMarket]);

  useEffect(() => {
    if (activeTab === "encarte_ia" && myMarket) {
      void fetchPendingReviewItems();
    }
  }, [activeTab, myMarket, fetchPendingReviewItems]);

  if (!user || (user.role !== "mercado" && user.role !== "admin")) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
          <ShieldAlert className="mx-auto h-12 w-12 text-brand-navy" />
          <h1 className="mt-3 font-heading text-2xl font-extrabold text-brand-navy">
            Área Restrita ao Mercado Parceiro
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-600 sm:text-sm">
            Para gerenciar o catálogo, subir planilhas CSV e revisar ofertas
            extraídas de encartes, faça login com uma conta vinculada a um
            supermercado em <code>public.market_members</code>.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/conta"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-navy px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-brand-blue sm:text-sm"
            >
              Fazer Login na Conta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!myMarket) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
          <Building2 className="mx-auto h-12 w-12 text-brand-blue" />
          <h1 className="mt-3 font-heading text-2xl font-extrabold text-brand-navy">
            Nenhum supermercado vinculado à sua conta
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-600 sm:text-sm">
            Sua conta ainda não possui vínculo ativo em{" "}
            <code>public.market_members</code> ou ainda não há mercados
            cadastrados.{user.role === "admin" && " Cadastre um mercado no Painel Admin."}
          </p>
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="mt-5 inline-flex min-h-[44px] items-center rounded-xl bg-brand-navy px-5 py-2.5 text-xs font-bold text-white"
            >
              Cadastrar Mercado no Painel Admin
            </Link>
          )}
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
    ({ priceEntry }) => priceEntry.isStale
  );

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewProdError(null);
    const cleanEan = newEan.replace(/\D/g, "");
    const gtinCheck = validateGtin(cleanEan);
    if (!gtinCheck.valid) {
      setNewProdError(
        gtinCheck.reason ||
          "Informe um código GTIN/EAN real de 8, 12, 13 ou 14 dígitos com dígito verificador válido."
      );
      return;
    }
    const parsedPrice = parseFloat(newPrice.replace(",", "."));
    const parsedMult = newMultiplier
      ? parseFloat(newMultiplier.replace(",", "."))
      : null;
    if (!newName.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      setNewProdError("Informe o nome do produto e um preço válido.");
      return;
    }

    await addNewProductWithPrice(
      myMarket.id,
      {
        ean: gtinCheck.normalized,
        name: newName.trim(),
        brand: newBrand.trim() || null,
        categoryId: newCat,
        sizeLabel: newSizeLabel.trim() || null,
        unitType: parsedMult ? newUnitType : null,
        unitMultiplier: parsedMult && parsedMult > 0 ? parsedMult : null,
        imageUrl: null,
        isPopular: true,
        description: null,
      },
      parsedPrice,
      newPromo,
      newPromo ? newPromoLabel.trim() || "Oferta" : undefined,
      "partner_csv"
    );
    setNewEan("");
    setNewName("");
    setNewBrand("");
    setNewPrice("");
    setActiveTab("catalogo");
  };

  const handleCsvIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCsv(true);
    setCsvLineErrors([]);
    setCsvSummary(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        showToast("Faça login novamente para enviar a planilha CSV.");
        setLoadingCsv(false);
        return;
      }

      let response: Response;
      if (csvFile) {
        const formData = new FormData();
        formData.append("file", csvFile);
        formData.append("supermarket_id", myMarket.id);
        response = await fetch("/api/ingest/csv", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        response = await fetch("/api/ingest/csv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            csvText,
            supermarket_id: myMarket.id,
          }),
        });
      }

      const data = (await response.json()) as {
        success: boolean;
        count?: number;
        errors?: CsvLineError[];
        error?: string;
      };

      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setCsvLineErrors(data.errors);
      }

      if (!response.ok || !data.success) {
        setCsvSummary(data.error || "Erro ao processar a planilha CSV.");
      } else {
        setCsvSummary(
          `${data.count || 0} preços importados e publicados com sucesso.`
        );
        await refreshCatalog();
        showToast(`${data.count || 0} preços atualizados via CSV!`);
      }
    } catch {
      setCsvSummary("Falha de conexão ao enviar a planilha CSV.");
    } finally {
      setLoadingCsv(false);
    }
  };

  const handleFlyerIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flyerFile) {
      setFlyerError("Selecione uma imagem ou PDF do encarte para enviar.");
      return;
    }
    setLoadingFlyer(true);
    setFlyerError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setFlyerError("Sessão expirada. Faça login novamente.");
        setLoadingFlyer(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", flyerFile);
      formData.append("supermarket_id", myMarket.id);

      const res = await fetch("/api/ingest/flyer", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = (await res.json()) as {
        success: boolean;
        count?: number;
        error?: string;
        message?: string;
      };

      if (!res.ok || !data.success) {
        setFlyerError(
          data.error || "Não foi possível extrair ofertas deste encarte."
        );
      } else {
        showToast(
          data.message ||
            `${data.count || 0} ofertas extraídas com status pendente de revisão!`
        );
        await fetchPendingReviewItems();
      }
    } catch {
      setFlyerError("Falha ao enviar o encarte para leitura OCR.");
    } finally {
      setLoadingFlyer(false);
    }
  };

  const handleReviewAction = async (
    action: "approve" | "reject" | "approve_batch",
    priceId?: string
  ) => {
    const token = await getAccessToken();
    if (!token) return;

    const edit = priceId ? reviewEdits[priceId] : undefined;
    const payload =
      action === "approve_batch"
        ? {
            action: "approve_batch",
            supermarket_id: myMarket.id,
            price_ids: pendingReviewItems.map((i) => i.id),
          }
        : {
            action,
            supermarket_id: myMarket.id,
            price_id: priceId,
            price: edit?.price ? parseFloat(edit.price) : undefined,
            promo_label: edit?.promo_label,
          };

    const res = await fetch("/api/ingest/review", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showToast(
        action === "reject"
          ? "Item rejeitado."
          : "Oferta(s) aprovada(s) e publicada(s) no catálogo!"
      );
      await fetchPendingReviewItems();
      await refreshCatalog();
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMarketProfile(myMarket.id, {
      openingHours: editHours.trim() || null,
      phone: editPhone.trim() || null,
      deliveryInfo: editDeliveryInfo.trim() || null,
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
            {myMarket.cnpj && (
              <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs">
                CNPJ: {myMarket.cnpj}
              </span>
            )}
            {user.role === "admin" && markets.length > 1 && (
              <select
                value={myMarket.id}
                onChange={(e) => setSelectedAdminMarketId(e.target.value)}
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-brand-navy"
                aria-label="Selecionar mercado para gerenciar"
              >
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <h1 className="mt-2 font-heading text-2xl font-extrabold sm:text-3xl">
            {myMarket.name}
          </h1>
          <p className="text-xs text-brand-light">
            {myMarket.lastCatalogUpdate
              ? `Última atualização do catálogo: ${myMarket.lastCatalogUpdate}`
              : "Nenhuma atualização registrada ainda"}
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
              { id: "encarte_ia", label: "Encartes IA & Revisão" },
              { id: "perfil", label: "Perfil e Horários" },
              { id: "metricas", label: "Resumo" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`min-h-[44px] rounded-xl px-3.5 py-2 text-xs font-bold transition ${
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
                Preços com mais de 7 dias ({outdatedItems.length}{" "}
                {outdatedItems.length === 1 ? "item" : "itens"})
              </h2>
              <p className="text-xs text-amber-900">
                Confirme se os valores continuam vigentes na loja para remover o
                selo de desatualizado.
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
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
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
                Produtos e Preços Publicados ({myPrices.length})
              </h2>
              <p className="text-xs text-slate-500">
                Altere o valor ou marque itens em oferta.
              </p>
            </div>
          </div>

          {myPrices.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Nenhum preço publicado neste mercado ainda. Cadastre um produto,
              importe uma planilha CSV ou envie um encarte.
            </div>
          ) : (
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
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-sm font-bold text-brand-navy">
                            {product.name}
                            {product.sizeLabel ? ` — ${product.sizeLabel}` : ""}
                          </h3>
                          {priceEntry.isPromo && (
                            <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-extrabold text-brand-navy">
                              {priceEntry.promoLabel || "Oferta"}
                            </span>
                          )}
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {priceEntry.sourceLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {product.brand || "Sem marca"} •{" "}
                          {product.ean ? `EAN ${product.ean} • ` : ""}
                          Atualizado em {priceEntry.updatedAt}
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
                          min="0.01"
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
                            void upsertMarketPrice(
                              myMarket.id,
                              product.id,
                              val,
                              priceEntry.isPromo,
                              priceEntry.promoLabel,
                              priceEntry.inStock
                            );
                          }
                        }}
                        className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-brand-navy px-3 py-2 text-xs font-bold text-white hover:bg-brand-blue"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Salvar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void upsertMarketPrice(
                            myMarket.id,
                            product.id,
                            priceEntry.price,
                            !priceEntry.isPromo,
                            !priceEntry.isPromo ? "Oferta" : undefined,
                            priceEntry.inStock
                          )
                        }
                        className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
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
                          void removeMarketPrice(myMarket.id, product.id)
                        }
                        className="min-h-[44px] min-w-[44px] rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
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
      )}

      {/* ABA 2: ADICIONAR NOVO PRODUTO */}
      {activeTab === "novo_produto" && (
        <form
          onSubmit={handleCreateProduct}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs"
        >
          <h2 className="font-heading text-lg font-bold text-brand-navy">
            Cadastrar Produto com Código EAN Validado
          </h2>
          <p className="text-xs text-slate-500">
            Informe o código GTIN/EAN real e a medida da embalagem para cálculo
            proporcional.
          </p>

          {newProdError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {newProdError}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Código GTIN / EAN-13 *
              </label>
              <input
                type="text"
                required
                value={newEan}
                onChange={(e) => setNewEan(e.target.value)}
                placeholder="13 dígitos verificados"
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
                placeholder="Descrição da embalagem"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Marca
              </label>
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Marca do fabricante"
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
                Peso / Volume na Embalagem
              </label>
              <input
                type="text"
                value={newSizeLabel}
                onChange={(e) => setNewSizeLabel(e.target.value)}
                placeholder="Ex.: 500 g, 1 L, 5 kg"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Medida para Cálculo Proporcional
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
                  step="0.001"
                  value={newMultiplier}
                  onChange={(e) => setNewMultiplier(e.target.value)}
                  placeholder="Fator (ex: 0.5)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Preço na Loja (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={newPromo}
                onChange={(e) => setNewPromo(e.target.checked)}
                className="h-4 w-4 rounded text-brand-navy"
              />
              Produto em Promoção
            </label>
            {newPromo && (
              <input
                type="text"
                value={newPromoLabel}
                onChange={(e) => setNewPromoLabel(e.target.value)}
                placeholder="Selo da Promoção"
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
              />
            )}
          </div>

          <button
            type="submit"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-xs font-bold text-white hover:bg-brand-blue"
          >
            <Plus className="h-4 w-4" />
            Publicar Produto e Preço
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
            Importação de Planilha CSV (<code>POST /api/ingest/csv</code>)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Envie um arquivo <code>.csv</code> (máx. 2 MB / 5.000 linhas) no
            formato <code>ean,nome,preco,oferta</code>. Todos os códigos EAN são
            validados pelo dígito verificador GTIN.
          </p>

          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700">
              Selecionar arquivo .csv do computador:
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="mt-1.5 block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-light file:px-4 file:py-2 file:text-xs file:font-bold file:text-brand-navy hover:file:bg-brand-navy hover:file:text-white"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700">
              Ou cole as linhas CSV diretamente (cabeçalho:{" "}
              <code>ean,nome,preco,oferta</code>):
            </label>
            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"ean,nome,preco,oferta\n"}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs text-slate-800"
            />
          </div>

          {csvSummary && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-brand-navy">
              {csvSummary}
            </div>
          )}

          {csvLineErrors.length > 0 && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
              <p className="font-bold">
                Erros por linha encontrados na planilha ({csvLineErrors.length}):
              </p>
              <ul className="mt-2 max-h-40 list-inside list-disc space-y-1 overflow-y-auto">
                {csvLineErrors.map((err, i) => (
                  <li key={i}>
                    <strong>Linha {err.line}:</strong> {err.reason}{" "}
                    {err.rawEan && (
                      <code className="text-[10px] text-rose-700">
                        (EAN: {err.rawEan})
                      </code>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={loadingCsv}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-blue disabled:opacity-50"
          >
            {loadingCsv ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            Validar e Importar Planilha CSV
          </button>
        </form>
      )}

      {/* ABA 4: CAPTURA DE PREÇOS DE ENCARTE VIA GEMINI OCR + REVISÃO HUMANA */}
      {activeTab === "encarte_ia" && (
        <div className="mt-6 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
              <Sparkles className="h-5 w-5 text-brand-blue" />
              1. Enviar Encarte para Leitura Assistida por IA (
              <code>POST /api/ingest/flyer</code>)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              O encarte original é arquivado no bucket privado{" "}
              <code>encartes</code> e os itens extraídos entram com{" "}
              <code>status = &apos;pendente&apos;</code> para sua revisão abaixo
              antes de irem ao ar.
            </p>

            {flyerError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {flyerError}
              </div>
            )}

            <form onSubmit={handleFlyerIngest} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Foto ou PDF do Encarte do Supermercado:
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFlyerFile(e.target.files?.[0] || null)}
                  className="mt-1.5 block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-light file:px-4 file:py-2 file:text-xs file:font-bold file:text-brand-navy hover:file:bg-brand-navy hover:file:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loadingFlyer}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-blue disabled:opacity-50"
              >
                {loadingFlyer ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Extrair Ofertas para Revisão
              </button>
            </form>
          </div>

          {/* Fila de Revisão de Encartes (status = 'pendente') */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-heading text-base font-bold text-brand-navy">
                  2. Revisão de Ofertas Extraídas Pendentes (
                  {pendingReviewItems.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Confira o nome, peso e valor extraídos pelo OCR antes de
                  publicar para os consumidores.
                </p>
              </div>
              {pendingReviewItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleReviewAction("approve_batch")}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-brand-navy"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aprovar Todos em Lote ({pendingReviewItems.length})
                </button>
              )}
            </div>

            {loadingReview ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Carregando itens pendentes de revisão...
              </div>
            ) : pendingReviewItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Nenhum item de encarte aguardando revisão no momento.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {pendingReviewItems.map((item) => {
                  const editState = reviewEdits[item.id] || {
                    price: String(item.price),
                    promo_label: item.promo_label || "Oferta de Encarte",
                  };

                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-4 py-3.5 text-xs"
                    >
                      <div>
                        <p className="font-heading text-sm font-bold text-brand-navy">
                          {item.products?.name || "Produto extraído"}
                          {item.products?.size_label
                            ? ` (${item.products.size_label})`
                            : ""}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.products?.brand || "Marca não identificada"} •{" "}
                          {item.products?.ean
                            ? `EAN ${item.products.ean}`
                            : "Sem EAN no encarte"}{" "}
                          • Validade:{" "}
                          {item.valid_until || "Não impressa no encarte"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editState.price}
                          onChange={(e) =>
                            setReviewEdits((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...editState,
                                price: e.target.value,
                              },
                            }))
                          }
                          className="tabular-price w-24 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-brand-navy"
                          aria-label="Editar preço extraído"
                        />
                        <input
                          type="text"
                          value={editState.promo_label}
                          onChange={(e) =>
                            setReviewEdits((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...editState,
                                promo_label: e.target.value,
                              },
                            }))
                          }
                          className="w-36 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs"
                          aria-label="Editar selo promocional"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void handleReviewAction("approve", item.id)
                          }
                          className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-brand-green px-3 py-1.5 font-bold text-brand-navy"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleReviewAction("reject", item.id)
                          }
                          className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 font-bold text-rose-700"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
            Dados do Estabelecimento, Horários e Atendimento
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
                placeholder="Ex.: Seg a Sáb: 08h às 21h"
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
                placeholder="DDD + Número"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                Informações de Retirada / Entrega
              </label>
              <input
                type="text"
                value={editDeliveryInfo}
                onChange={(e) => setEditDeliveryInfo(e.target.value)}
                placeholder="Informe as condições reais da loja"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-xs font-bold text-white"
          >
            <CheckCircle2 className="h-4 w-4" />
            Salvar Alterações do Perfil
          </button>
        </form>
      )}

      {/* ABA 6: RESUMO DO CATÁLOGO */}
      {activeTab === "metricas" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
                <BarChart3 className="h-5 w-5 text-brand-blue" />
                Resumo do Catálogo Publicado
              </h2>
              <p className="text-xs text-slate-500">
                Contagem real de preços e promoções ativas em {myMarket.name}.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-brand-light/50 p-4">
              <span className="text-xs font-semibold text-slate-600">
                Produtos com Preço Publicado
              </span>
              <p className="tabular-price mt-1 font-heading text-2xl font-extrabold text-brand-navy">
                {myPrices.length} itens
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-emerald-50/60 p-4">
              <span className="text-xs font-semibold text-slate-600">
                Ofertas Promocionais Ativas
              </span>
              <p className="tabular-price mt-1 font-heading text-2xl font-extrabold text-emerald-700">
                {myPrices.filter((p) => p.priceEntry.isPromo).length} ofertas
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-amber-50/70 p-4">
              <span className="text-xs font-semibold text-slate-600">
                Itens com mais de 7 dias
              </span>
              <p className="tabular-price mt-1 font-heading text-2xl font-extrabold text-amber-800">
                {outdatedItems.length} itens
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
