"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Barcode,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";

export interface MarketOnboardingGuideProps {
  compact?: boolean;
  showPartnerCta?: boolean;
}

export default function MarketOnboardingGuide({
  compact = false,
  showPartnerCta = true,
}: MarketOnboardingGuideProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadCsvTemplate = () => {
    // Cabeçalho oficial sem dados fictícios (UTF-8 com BOM para abertura direta no Excel/LibreOffice)
    const csvHeaderContent = "\uFEFFean,nome,preco,oferta\n";
    const blob = new Blob([csvHeaderContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modelo-precos-economize.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 4000);
  };

  return (
    <section
      aria-label="Como os supermercados cadastram e atualizam preços no Economize+"
      className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-xs font-extrabold text-brand-navy">
            <Store className="h-3.5 w-3.5 text-brand-blue" />
            Fluxo Oficial de Mercados Parceiros
          </span>
          <h2 className="mt-2 font-heading text-lg font-extrabold tracking-tight text-brand-navy sm:text-xl">
            Como os supermercados cadastram e atualizam os preços
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">
            Todo preço exibido no Economize+ possui origem autenticada, código
            de barras validado (GTIN/EAN) e registro automático no histórico
            auditável (`public.price_history`).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadCsvTemplate}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-blue/40 bg-brand-light/70 px-4 py-2.5 text-xs font-extrabold text-brand-navy transition hover:bg-brand-blue hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            <Download className="h-4 w-4 shrink-0" />
            {downloaded
              ? "Cabeçalho CSV baixado (modelo-precos-economize.csv)"
              : "Baixar Modelo de Planilha CSV (modelo-precos-economize.csv)"}
          </button>

          {showPartnerCta && (
            <Link
              href="/seja-parceiro"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-brand-blue active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
            >
              Credenciar Meu Mercado
            </Link>
          )}
        </div>
      </div>

      <div
        className={`mt-5 grid gap-4 ${
          compact ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 lg:grid-cols-2"
        }`}
      >
        {/* ETAPA 1 */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-[#F4FAFC] p-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-2.5 py-1 text-[11px] font-extrabold text-white">
                Etapa 1
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-navy">
                <ShieldCheck className="h-4 w-4 text-brand-blue" />
                RLS + Vínculo Autenticado
              </span>
            </div>
            <h3 className="mt-3 font-heading text-sm font-extrabold text-brand-navy sm:text-base">
              Credenciamento e Vínculo Seguro
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              O responsável pelo supermercado solicita o credenciamento em{" "}
              <Link
                href="/seja-parceiro"
                className="font-bold text-brand-blue hover:underline"
              >
                /seja-parceiro
              </Link>
              . Após validação do CNPJ e endereço real pela administração, a
              conta do lojista é vinculada ao estabelecimento na tabela{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-brand-navy">
                public.market_members
              </code>
              , garantindo que apenas membros autorizados (`requireMarketMember`)
              possam publicar preços daquela loja.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200/70 pt-2.5 text-[11px] font-semibold text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
            Selo &ldquo;Verificado&rdquo; exibido somente quando `verified_at`
            está preenchido.
          </div>
        </article>

        {/* ETAPA 2 */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-[#F4FAFC] p-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-2.5 py-1 text-[11px] font-extrabold text-white">
                Etapa 2
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-navy">
                <Barcode className="h-4 w-4 text-brand-blue" />
                Origem: `partner_manual`
              </span>
            </div>
            <h3 className="mt-3 font-heading text-sm font-extrabold text-brand-navy sm:text-base">
              Cadastro e Atualização Manual em 1 Toque
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              No Painel do Mercado Parceiro (
              <Link
                href="/painel-mercado"
                className="font-bold text-brand-blue hover:underline"
              >
                /painel-mercado
              </Link>
              ), o lojista altera o preço de qualquer item já cadastrado em um
              toque ou adiciona novos produtos pelo código de barras. O sistema
              valida o dígito verificador oficial GS1 (GTIN-8/12/13/14),
              consulta o Open Food Facts Brasil e calcula automaticamente o
              preço por medida (`R$/kg`, `R$/L`, `R$/un`).
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200/70 pt-2.5 text-[11px] font-semibold text-slate-500">
            <History className="h-3.5 w-3.5 text-brand-blue" />
            Publicação imediata com disparo automático para o histórico de
            preços.
          </div>
        </article>

        {/* ETAPA 3 */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-[#F4FAFC] p-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-2.5 py-1 text-[11px] font-extrabold text-white">
                Etapa 3
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-navy">
                <FileSpreadsheet className="h-4 w-4 text-brand-blue" />
                Origem: `partner_csv` (`POST /api/ingest/csv`)
              </span>
            </div>
            <h3 className="mt-3 font-heading text-sm font-extrabold text-brand-navy sm:text-base">
              Importação em Lote via Planilha CSV do ERP
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Para atualizar centenas de itens de uma só vez, o mercado exporta
              do seu sistema ERP ou Excel uma planilha `.csv` (até 2 MB / 5.000
              linhas) com as colunas{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-brand-navy">
                ean,nome,preco,oferta
              </code>
              . O servidor valida cada EAN, enriquece itens inéditos e retorna
              um relatório detalhado por linha caso algum código esteja
              incorreto.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-2.5">
            <span className="text-[11px] font-semibold text-slate-500">
              Aceita separador vírgula (`,`) ou ponto-e-vírgula (`;`).
            </span>
            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-extrabold text-brand-navy shadow-2xs transition hover:bg-brand-light"
            >
              <Download className="h-3.5 w-3.5 text-brand-blue" />
              Baixar `.csv` modelo
            </button>
          </div>
        </article>

        {/* ETAPA 4 */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-[#F4FAFC] p-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-2.5 py-1 text-[11px] font-extrabold text-white">
                Etapa 4
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-navy">
                <Sparkles className="h-4 w-4 text-brand-yellow" />
                Origem: `flyer_ocr` (`POST /api/ingest/flyer`)
              </span>
            </div>
            <h3 className="mt-3 font-heading text-sm font-extrabold text-brand-navy sm:text-base">
              Leitura de Encarte por IA com Revisão Humana Obrigatória
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              O lojista também pode enviar a foto ou PDF do jornal de ofertas
              da semana. A leitura óptica extrai produtos e preços candidatos,
              mas por segurança todo item extraído de encarte entra
              obrigatoriamente com{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-900">
                status = &apos;pendente&apos;
              </code>{" "}
              até que o responsável humano revise e aprove em{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-brand-navy">
                PATCH /api/ingest/review
              </code>
              .
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200/70 pt-2.5 text-[11px] font-semibold text-amber-900">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            Nenhum preço lido por IA vai ao ar sem confirmação humana do
            mercado.
          </div>
        </article>
      </div>
    </section>
  );
}
