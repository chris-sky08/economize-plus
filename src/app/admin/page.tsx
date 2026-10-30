"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Flag,
  ShieldAlert,
  Sparkles,
  Store,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatBRL } from "@/data/mockData";

export default function AdminPage() {
  const {
    user,
    markets,
    products,
    prices,
    partnerApplications,
    priceReports,
    loginDemoRole,
    updatePartnerApplicationStatus,
    updatePriceReportStatus,
    toggleMarketStatus,
    toggleSponsoredPrice,
  } = useApp();

  const [tab, setTab] = useState<
    "mercados" | "solicitacoes" | "denuncias" | "patrocinados"
  >("mercados");

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xs">
          <ShieldAlert className="mx-auto h-12 w-12 text-brand-navy" />
          <h1 className="mt-3 font-heading text-2xl font-extrabold text-brand-navy">
            Painel Administrativo Protegido
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs text-slate-600 sm:text-sm">
            Esta área é restrita a administradores autorizados para moderar
            mercados parceiros, denúncias de preços incorretos e destaques
            patrocinados.
          </p>
          <button
            type="button"
            onClick={() => loginDemoRole("admin")}
            className="mt-6 rounded-xl bg-brand-navy px-6 py-3 text-xs font-bold text-brand-yellow shadow-xs hover:bg-brand-blue hover:text-white sm:text-sm"
          >
            Ativar Perfil Administrador (Demonstração)
          </button>
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
              Gerencie mercados parceiros, revise denúncias de preços e controle
              destaques patrocinados identificados.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/10 px-4 py-2.5">
              <span className="block text-[10px] text-brand-light">
                Mercados Cadastrados
              </span>
              <span className="font-heading text-xl font-extrabold">
                {markets.length}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5">
              <span className="block text-[10px] text-brand-light">
                Produtos Padronizados
              </span>
              <span className="font-heading text-xl font-extrabold">
                {products.length}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5">
              <span className="block text-[10px] text-brand-light">
                Preços Monitorados
              </span>
              <span className="font-heading text-xl font-extrabold">
                {prices.length}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5">
              <span className="block text-[10px] text-brand-light">
                Denúncias Pendentes
              </span>
              <span className="font-heading text-xl font-extrabold text-brand-yellow">
                {priceReports.filter((r) => r.status === "pendente").length}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-4">
          {(
            [
              { id: "mercados", label: `Mercados (${markets.length})` },
              {
                id: "solicitacoes",
                label: `Solicitações de Parceiros (${partnerApplications.length})`,
              },
              {
                id: "denuncias",
                label: `Denúncias de Preços (${priceReports.length})`,
              },
              {
                id: "patrocinados",
                label: "Destaques Patrocinados (Publicidade)",
              },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
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

      {/* ABA 1: MERCADOS PARCEIROS */}
      {tab === "mercados" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
            <Store className="h-5 w-5 text-brand-blue" />
            Gerenciar Status dos Mercados Parceiros
          </h2>
          <div className="mt-4 divide-y divide-slate-100">
            {markets.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm font-bold text-brand-navy">
                      {m.name}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        m.status === "ativo"
                          ? "bg-emerald-100 text-brand-green"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {m.status}
                    </span>
                    <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[10px] font-bold text-brand-blue uppercase">
                      Plano {m.planId}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Resp.: {m.responsibleName} • {m.email} • {m.neighborhood}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleMarketStatus(m.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    m.status === "ativo"
                      ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "bg-brand-green text-white hover:bg-emerald-700"
                  }`}
                >
                  {m.status === "ativo"
                    ? "Suspender Exibição"
                    : "Reativar Mercado"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 2: SOLICITAÇÕES DE CADASTRO DE PARCEIROS */}
      {tab === "solicitacoes" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
            <Building2 className="h-5 w-5 text-brand-blue" />
            Solicitações de Novos Mercados Parceiros
          </h2>
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
                      updatePartnerApplicationStatus(app.id, "aprovado")
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-brand-green px-3.5 py-2 text-xs font-bold text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updatePartnerApplicationStatus(app.id, "recusado")
                    }
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 3: DENÚNCIAS DE DADOS INCORRETOS */}
      {tab === "denuncias" && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-navy">
            <Flag className="h-5 w-5 text-amber-600" />
            Revisão de Dados Denunciados ou Preços Desatualizados
          </h2>
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
                        {product?.name} ({product?.sizeLabel}) —{" "}
                        {market?.shortName}
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
                        updatePriceReportStatus(rep.id, "revisado")
                      }
                      className="rounded-xl bg-brand-blue px-3.5 py-2 text-xs font-bold text-white"
                    >
                      Marcar como Revisado
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updatePriceReportStatus(rep.id, "arquivado")
                      }
                      className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600"
                    >
                      Arquivar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 4: DESTAQUES PATROCINADOS */}
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

          <div className="mt-4 divide-y divide-slate-100">
            {prices.slice(0, 8).map((p) => {
              const market = markets.find((m) => m.id === p.marketId);
              const product = products.find((prod) => prod.id === p.productId);
              if (!market || !product) return null;

              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3.5"
                >
                  <div>
                    <p className="font-heading text-sm font-bold text-brand-navy">
                      {product.name} ({product.sizeLabel}) — {market.shortName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Preço: {formatBRL(p.price)} • Atualizado: {p.updatedAt}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSponsoredPrice(p.id)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
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
        </div>
      )}
    </div>
  );
}
