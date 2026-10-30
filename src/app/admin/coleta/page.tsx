"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Package,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { validateGtin } from "@/lib/format";
import { lookupProductByEan } from "@/services/productLookup";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";

export default function AdminColetaPage() {
  const { user, markets, categories, refreshCatalog, showToast } = useApp();

  const [selectedMarketId, setSelectedMarketId] = useState(
    markets[0]?.id || ""
  );
  const [ean, setEan] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("mercearia");
  const [sizeLabel, setSizeLabel] = useState("");
  const [unitType, setUnitType] = useState<"kg" | "L" | "un" | "rolo">("un");
  const [unitValue, setUnitValue] = useState("");
  const [price, setPrice] = useState("");
  const [isPromo, setIsPromo] = useState(false);
  const [promoLabel, setPromoLabel] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loadingEan, setLoadingEan] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleLookupEan = async (targetEan: string) => {
    const clean = targetEan.replace(/\D/g, "");
    setEan(clean);
    const check = validateGtin(clean);
    if (!check.valid) {
      setErrorMsg(
        check.reason ||
          "Código EAN inválido (verifique o dígito verificador GTIN)."
      );
      return;
    }
    setErrorMsg(null);
    setLoadingEan(true);
    try {
      const prod = await lookupProductByEan(check.normalized);
      if (prod) {
        setName(prod.name);
        if (prod.brand) setBrand(prod.brand);
        if (prod.categoryId) setCategory(prod.categoryId);
        if (prod.sizeLabel) setSizeLabel(prod.sizeLabel);
        if (prod.unitType) setUnitType(prod.unitType);
        if (prod.unitMultiplier) setUnitValue(String(prod.unitMultiplier));
        showToast(`Produto preenchido via EAN ${check.normalized}!`);
      } else {
        showToast(
          "EAN válido, mas ainda sem cadastro no Open Food Facts. Preencha o nome abaixo."
        );
      }
    } finally {
      setLoadingEan(false);
    }
  };

  const handleSubmitColeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLastSaved(null);

    const targetMarketId = selectedMarketId || markets[0]?.id;
    if (!targetMarketId) {
      setErrorMsg("Cadastre um supermercado no Painel Admin antes de coletar preços.");
      return;
    }

    const cleanEan = ean.replace(/\D/g, "");
    const gtinCheck = validateGtin(cleanEan);
    if (!gtinCheck.valid) {
      setErrorMsg(
        gtinCheck.reason || "Informe um código de barras GTIN/EAN válido."
      );
      return;
    }

    if (!price || parseFloat(price.replace(",", ".")) <= 0) {
      setErrorMsg("Informe o preço coletado na etiqueta.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setErrorMsg("Sessão expirada. Faça login novamente.");
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("supermarket_id", targetMarketId);
      formData.append("ean", cleanEan);
      formData.append("name", name.trim());
      if (brand.trim()) formData.append("brand", brand.trim());
      formData.append("category", category);
      if (sizeLabel.trim()) formData.append("size_label", sizeLabel.trim());
      if (unitValue) {
        formData.append("unit_type", unitType);
        formData.append("unit_value", unitValue);
      }
      formData.append("price", price.replace(",", "."));
      formData.append("is_promo", String(isPromo));
      if (isPromo && promoLabel.trim()) {
        formData.append("promo_label", promoLabel.trim());
      }
      if (validUntil) {
        formData.append("valid_until", validUntil);
      }
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const res = await fetch("/api/admin/coleta", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = (await res.json()) as {
        success: boolean;
        error?: string;
        product_name?: string;
      };

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Erro ao registrar coleta presencial.");
      } else {
        setLastSaved(
          `Preço de "${data.product_name || name}" salvo e publicado com source = 'team_collected'!`
        );
        setEan("");
        setName("");
        setBrand("");
        setSizeLabel("");
        setUnitValue("");
        setPrice("");
        setPhotoFile(null);
        await refreshCatalog();
        showToast("Coleta presencial publicada com sucesso!");
      }
    } catch {
      setErrorMsg("Falha de conexão ao salvar coleta.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-brand-navy" />
        <h1 className="mt-3 font-heading text-xl font-bold text-brand-navy">
          Acesso Restrito à Equipe de Coleta (Admin)
        </h1>
        <Link
          href="/conta"
          className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-brand-navy px-5 py-2.5 text-xs font-bold text-white"
        >
          Fazer Login Administrativo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetectedEan={(code) => {
          setIsScannerOpen(false);
          void handleLookupEan(code);
        }}
      />

      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Painel Administrativo
      </Link>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-navy text-brand-green">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
              Operação de Campo • Coleta Presencial
            </span>
            <h1 className="font-heading text-xl font-extrabold text-brand-navy">
              Registrar Preço Coletado em Loja
            </h1>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {errorMsg}
          </div>
        )}

        {lastSaved && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{lastSaved}</span>
          </div>
        )}

        <form onSubmit={handleSubmitColeta} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              1. Supermercado da Coleta *
            </label>
            {markets.length === 0 ? (
              <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                Nenhum mercado cadastrado.{" "}
                <Link href="/admin" className="font-bold underline">
                  Cadastre o supermercado primeiro no Painel Admin
                </Link>
                .
              </div>
            ) : (
              <select
                value={selectedMarketId || markets[0]?.id || ""}
                onChange={(e) => setSelectedMarketId(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-brand-navy"
              >
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.neighborhood} - {m.city})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              2. Código de Barras EAN-8 / EAN-13 *
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                type="text"
                inputMode="numeric"
                required
                value={ean}
                onChange={(e) => setEan(e.target.value)}
                placeholder="Digite ou escaneie o EAN"
                className="min-h-[44px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void handleLookupEan(ean)}
                disabled={loadingEan}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-brand-light px-3.5 py-2 text-xs font-bold text-brand-navy"
              >
                {loadingEan ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Buscar EAN
              </button>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-brand-yellow"
              >
                <Camera className="h-4 w-4" />
                Câmera EAN
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Nome do Produto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Preenchido pelo EAN ou manual"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Marca
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                Medida no Rótulo
              </label>
              <input
                type="text"
                value={sizeLabel}
                onChange={(e) => setSizeLabel(e.target.value)}
                placeholder="Ex.: 5 kg, 900 ml"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Fator p/ Cálculo
              </label>
              <div className="mt-1 flex gap-1.5">
                <select
                  value={unitType}
                  onChange={(e) =>
                    setUnitType(
                      e.target.value as "kg" | "L" | "un" | "rolo"
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs"
                >
                  <option value="kg">kg</option>
                  <option value="L">L</option>
                  <option value="un">un</option>
                  <option value="rolo">rolo</option>
                </select>
                <input
                  type="number"
                  step="0.001"
                  value={unitValue}
                  onChange={(e) => setUnitValue(e.target.value)}
                  placeholder="Ex: 5"
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                3. Preço na Etiqueta da Gôndola (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="tabular-price mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-base font-extrabold text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Validade da Oferta (opcional)
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isPromo}
                onChange={(e) => setIsPromo(e.target.checked)}
                className="h-4 w-4 rounded text-brand-navy"
              />
              Etiqueta Promocional / Oferta
            </label>
            {isPromo && (
              <input
                type="text"
                value={promoLabel}
                onChange={(e) => setPromoLabel(e.target.value)}
                placeholder="Descrição da etiqueta"
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              4. Foto da Etiqueta de Preço na Gôndola (Salva no bucket privado{" "}
              <code>evidencias</code>)
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="mt-1.5 block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-light file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-brand-navy"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-navy py-3 text-sm font-extrabold text-white shadow-sm hover:bg-brand-blue disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4 text-brand-green" />
            )}
            Publicar Preço Coletado (source = team_collected)
          </button>
        </form>
      </div>
    </div>
  );
}
