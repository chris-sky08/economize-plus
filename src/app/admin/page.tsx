"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatBRL } from "@/lib/format";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const {
    user,
    markets,
    products,
    prices,
    partnerApplications,
    priceReports,
    updatePartnerApplicationStatus,
    updatePriceReportStatus,
    toggleMarketStatus,
    toggleSponsoredPrice,
    refreshCatalog,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<
    "mercados" | "novo_mercado" | "solicitacoes" | "denuncias" | "patrocinados"
  >("mercados");

  // Formulário de cadastro de supermercado real (/api/admin/mercados)
  const [mName, setMName] = useState("");
  const [mCnpj, setMCnpj] = useState("");
  const [mZipCode, setMZipCode] = useState("");
  const [mAddress, setMAddress] = useState("");
  const [mNeighborhood, setMNeighborhood] = useState("");
  const [mCity, setMCity] = useState("");
  const [mState, setMState] = useState("SP");
  const [mLat, setMLat] = useState("");
  const [mLng, setMLng] = useState("");
  const [mPhone, setMPhone] = useState("");
  const [mEmail, setMEmail] = useState("");
  const [mResp, setMResp] = useState("");
  const [mHours, setMHours] = useState("");
  const [mVerified, setMVerified] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);
  const [savingMarket, setSavingMarket] = useState(false);

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  const handleLookupMarketCep = async () => {
    const clean = mZipCode.replace(/\D/g, "");
    if (clean.length !== 8) {
      showToast("Digite um CEP de 8 dígitos.");
      return;
    }
    setLoadingCep(true);
    try {
      const res = await fetch(`/api/cep/${clean}`);
      if (res.ok) {
        const data = (await res.json()) as {
          street: string;
          neighborhood: string;
          city: string;
          state: string;
          lat: number | null;
          lng: number | null;
        };
        if (data.street && !mAddress) setMAddress(data.street);
        if (data.neighborhood) setMNeighborhood(data.neighborhood);
        if (data.city) setMCity(data.city);
        if (data.state) setMState(data.state);
        if (data.lat !== null && data.lng !== null) {
          setMLat(String(data.lat));
          setMLng(String(data.lng));
        }
        showToast("CEP consultado com sucesso!");
      }
    } catch {
      showToast("Não foi possível consultar o CEP.");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCreateRealMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMarket(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        showToast("Sessão expirada. Faça login novamente.");
        setSavingMarket(false);
        return;
      }

      const res = await fetch("/api/admin/mercados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: mName,
          cnpj: mCnpj || null,
          zip_code: mZipCode || null,
          address: mAddress,
          neighborhood: mNeighborhood,
          city: mCity,
          state: mState,
          lat: mLat ? parseFloat(mLat) : null,
          lng: mLng ? parseFloat(mLng) : null,
          phone: mPhone || null,
          email: mEmail || null,
          responsible_name: mResp || null,
          opening_hours: mHours || null,
          is_partner: true,
          mark_verified: mVerified,
        }),
      });

      const data = (await res.json()) as {
        success: boolean;
        error?: string;
      };

      if (!res.ok || !data.success) {
        showToast(data.error || "Erro ao cadastrar supermercado.");
      } else {
        showToast(`Supermercado "${mName}" cadastrado no banco real!`);
        setMName("");
        setMCnpj("");
        setMAddress("");
        await refreshCatalog();
        setTab("mercados");
      }
    } catch {
      showToast("Falha de conexão ao salvar mercado.");
    } finally {
      setSavingMarket(false);
    }
  };

  const handleVerifyMarket = async (id: string, currentlyVerified: boolean) => {
    const token = await getAccessToken();
    if (!token) return;
    const res = await fetch("/api/admin/mercados", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
        action: currentlyVerified ? "unverify" : "verify",
      }),
    });
    if (res.ok) {
      showToast(
        currentlyVerified
          ? "Selo Verificado removido."
          : "Mercado marcado como Verificado!"
      );
      await refreshCatalog();
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
          <ShieldAlert className="mx-auto h-12 w-12 text-brand-navy" />
          <h1 className="mt-3 font-heading text-2xl font-extrabold text-brand-navy">
            Painel Administrativo Protegido
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-600 sm:text-sm">
            Esta área exige autenticação com papel <code>admin</code> em{" "}
            <code>public.profiles</code>.
          </p>
          <Link
            href="/conta"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-brand-navy px-6 py-3 text-xs font-bold text-brand-yellow shadow-xs hover:bg-brand-blue hover:text-white sm:text-sm"
          >
            Entrar com Conta Administrativa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Topo Administrativo */}
      <div className="rounded-3xl bg-brand-navy p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-md bg-brand-yellow px-2.5 py-0.5 text-xs font-extrabold text-brand-navy">
              Governança e Moderação • Perfil Admin
            </span>
            <h1 className="mt-2 font-heading text-2xl font-extrabold sm:text-3xl">
              Painel Administrativo Economize+
            </h1>
            <p className="text-xs text-brand-light">
              Cadastre mercados reais, registre coletas presenciais, revise
              denúncias e modere solicitações.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/coleta"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-brand-green px-4 py-2.5 text-xs font-extrabold text-brand-navy shadow-xs hover:opacity-90"
            >
              <ClipboardCheck className="h-4 w-4" />
              Abrir Coleta Presencial em Loja
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/10 px-4 py-2.5">
            <span className="block text-[10px] text-brand-light">
              Mercados Cadastrados
            </span>
            <span className="tabular-price font-heading text-xl font-extrabold">
              {markets.length}
            </span>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-2.5">
            <span className="block text-[10px] text-brand-light">
              Produtos Cadastrados
            </span>
            <span className="tabular-price font-heading text-xl font-extrabold">
              {products.length}
            </span>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-2.5">
            <span className="block text-[10px] text-brand-light">
              Preços Publicados
            </span>
            <span className="tabular-price font-heading text-xl font-extrabold">
              {prices.length}
            </span>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-2.5">
            <span className="block text-[10px] text-brand-light">
              Denúncias Pendentes
            </span>
            <span className="tabular-price font-heading text-xl font-extrabold text-brand-yellow">
              {priceReports.filter((r) => r.status === "pendente").length}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-4">
          {(
            [
              { id: "mercados", label: `Mercados (${markets.length})` },
              { id: "novo_mercado", label: "+ Cadastrar Mercado Real" },
              {
                id: "solicitacoes",
                label: `Solicitações (${partnerApplications.length})`,
              },
              {
                id: "denuncias",
                label: `Denúncias (${priceReports.length})`,
              },
              {
                id: "patrocinados",
                label: "Destaques Patrocinados",
              },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`min-h-[44px] rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === t.id
                  ? "bg-brand-yellow text-brand-navy"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ABA 1: MERCADOS CADASTRADOS */}
      {tab === "mercados" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
              <Store className="h-5 w-5 text-brand-blue" />
              Supermercados Cadastrados ({markets.length})
            </h2>
            <button
              type="button"
              onClick={() => setTab("novo_mercado")}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-brand-navy px-3.5 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo Mercado Real
            </button>
          </div>

          {markets.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Nenhum supermercado cadastrado ainda. Clique em{" "}
              <strong>+ Cadastrar Mercado Real</strong> para adicionar o
              primeiro mercado verificado.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {markets.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-sm font-bold text-brand-navy">
                        {m.name}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          m.status === "ativo"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {m.status}
                      </span>
                      {m.verifiedAt && (
                        <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[10px] font-bold text-brand-navy">
                          Verificado em {m.verifiedAt}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {m.address} • {m.neighborhood}, {m.city}/{m.state}
                      {m.cnpj ? ` • CNPJ ${m.cnpj}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void handleVerifyMarket(m.id, Boolean(m.verifiedAt))
                      }
                      className="min-h-[40px] rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-brand-navy hover:border-brand-blue"
                    >
                      {m.verifiedAt ? "Remover Verificado" : "Marcar Verificado"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleMarketStatus(m.id)}
                      className={`min-h-[40px] rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                        m.status === "ativo"
                          ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "bg-brand-green text-brand-navy"
                      }`}
                    >
                      {m.status === "ativo"
                        ? "Suspender Exibição"
                        : "Reativar Mercado"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: CADASTRAR NOVO MERCADO REAL */}
      {tab === "novo_mercado" && (
        <form
          onSubmit={handleCreateRealMarket}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs"
        >
          <h2 className="font-heading text-lg font-bold text-brand-navy">
            Cadastrar Supermercado Real Verificado
          </h2>
          <p className="text-xs text-slate-500">
            Consulte o CEP para preencher endereço e coordenadas geográficas
            automaticamente.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Nome do Supermercado *
              </label>
              <input
                type="text"
                required
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                placeholder="Nome oficial do estabelecimento"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                CNPJ
              </label>
              <input
                type="text"
                value={mCnpj}
                onChange={(e) => setMCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                CEP (com Geocodificação)
              </label>
              <div className="mt-1 flex gap-1.5">
                <input
                  type="text"
                  value={mZipCode}
                  onChange={(e) => setMZipCode(e.target.value)}
                  placeholder="00000-000"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleLookupMarketCep()}
                  disabled={loadingCep}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-brand-light px-3 py-2 text-xs font-bold text-brand-navy"
                >
                  <Search className="h-3.5 w-3.5" />
                  {loadingCep ? "..." : "CEP"}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                Endereço Completo *
              </label>
              <input
                type="text"
                required
                value={mAddress}
                onChange={(e) => setMAddress(e.target.value)}
                placeholder="Rua/Av, número"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Bairro *
              </label>
              <input
                type="text"
                required
                value={mNeighborhood}
                onChange={(e) => setMNeighborhood(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Cidade *
              </label>
              <input
                type="text"
                required
                value={mCity}
                onChange={(e) => setMCity(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                UF *
              </label>
              <input
                type="text"
                required
                maxLength={2}
                value={mState}
                onChange={(e) => setMState(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Latitude
                </label>
                <input
                  type="text"
                  value={mLat}
                  onChange={(e) => setMLat(e.target.value)}
                  placeholder="-23.0000"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Longitude
                </label>
                <input
                  type="text"
                  value={mLng}
                  onChange={(e) => setMLng(e.target.value)}
                  placeholder="-46.0000"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Telefone Comercial
              </label>
              <input
                type="text"
                value={mPhone}
                onChange={(e) => setMPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                E-mail Comercial
              </label>
              <input
                type="email"
                value={mEmail}
                onChange={(e) => setMEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Horário de Funcionamento
              </label>
              <input
                type="text"
                value={mHours}
                onChange={(e) => setMHours(e.target.value)}
                placeholder="Seg a Sáb: 08h às 21h"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={mVerified}
                onChange={(e) => setMVerified(e.target.checked)}
                className="h-4 w-4 rounded text-brand-navy"
              />
              Marcar como Mercado Verificado (<code>verified_at = now()</code>)
            </label>
          </div>

          <button
            type="submit"
            disabled={savingMarket}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-xs font-bold text-white hover:bg-brand-blue disabled:opacity-50"
          >
            {savingMarket ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Salvar Supermercado no Banco
          </button>
        </form>
      )}

      {/* ABA 3: SOLICITAÇÕES DE CADASTRO DE PARCEIROS */}
      {tab === "solicitacoes" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
            <Building2 className="h-5 w-5 text-brand-blue" />
            Solicitações de Novos Mercados Parceiros ({partnerApplications.length})
          </h2>
          {partnerApplications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Nenhuma solicitação de parceria pendente.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {partnerApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-sm font-bold text-brand-navy">
                        {app.marketName}
                      </h3>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                        {app.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Responsável: {app.responsibleName} • {app.phone} •{" "}
                      {app.neighborhood}, {app.city} ({app.zipCode})
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void updatePartnerApplicationStatus(app.id, "aprovado")
                      }
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-brand-green px-3.5 py-2 text-xs font-bold text-brand-navy"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void updatePartnerApplicationStatus(app.id, "recusado")
                      }
                      className="min-h-[40px] rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700"
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 4: DENÚNCIAS DE DADOS INCORRETOS */}
      {tab === "denuncias" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
            <Flag className="h-5 w-5 text-amber-600" />
            Revisão de Dados Denunciados ({priceReports.length})
          </h2>
          {priceReports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Nenhuma denúncia de divergência registrada.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {priceReports.map((rep) => {
                const market = markets.find((m) => m.id === rep.marketId);
                const product = products.find((p) => p.id === rep.productId);
                return (
                  <div
                    key={rep.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="font-heading text-sm font-bold text-brand-navy">
                          {product?.name || rep.productId} —{" "}
                          {market?.shortName || rep.marketId}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                          {rep.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        <strong>Motivo:</strong> {rep.reason}{" "}
                        {rep.details && `• "${rep.details}"`}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void updatePriceReportStatus(rep.id, "revisado")
                        }
                        className="min-h-[40px] rounded-xl bg-brand-navy px-3.5 py-2 text-xs font-bold text-white"
                      >
                        Marcar como Revisado
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void updatePriceReportStatus(rep.id, "arquivado")
                        }
                        className="min-h-[40px] rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600"
                      >
                        Arquivar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 5: DESTAQUES PATROCINADOS */}
      {tab === "patrocinados" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
            <Sparkles className="h-5 w-5 text-brand-yellow" />
            Gerenciar Destaques Patrocinados (Identificados como Publicidade)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Todo item patrocinado exibe um selo explícito de transparência para
            o consumidor e nunca altera a ordenação real de menor preço.
          </p>

          {prices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Nenhum preço publicado no momento.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {prices.slice(0, 12).map((p) => {
                const market = markets.find((m) => m.id === p.marketId);
                const product = products.find(
                  (prod) => prod.id === p.productId
                );
                if (!market || !product) return null;

                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-3.5"
                  >
                    <div>
                      <p className="font-heading text-sm font-bold text-brand-navy">
                        {product.name}
                        {product.sizeLabel ? ` (${product.sizeLabel})` : ""} —{" "}
                        {market.shortName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Preço: {formatBRL(p.price)} • Atualizado em{" "}
                        {p.updatedAt}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSponsoredPrice(p.id)}
                      className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold transition ${
                        p.isSponsored
                          ? "bg-brand-yellow text-brand-navy"
                          : "border border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {p.isSponsored
                        ? "★ Destaque Patrocinado Ativo"
                        : "Marcar como Destaque Patrocinado"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
