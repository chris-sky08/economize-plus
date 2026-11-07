"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Barcode,
  CheckCircle2,
  Clock,
  History,
  Minus,
  RefreshCw,
  Sparkles,
  Store,
  Tag,
} from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { PriceSource } from "@/types/domain";

export type PriceHistoryDirection = "up" | "down" | "same" | "initial";

export interface PriceHistoryItem {
  id: number;
  supermarket_id: string;
  supermarket_name: string;
  supermarket_neighborhood: string | null;
  supermarket_verified_at: string | null;
  product_id: string;
  product_name: string;
  product_brand: string | null;
  product_size_label: string | null;
  product_ean: string | null;
  price: number;
  previous_price: number | null;
  delta: number;
  direction: PriceHistoryDirection;
  is_promo: boolean;
  source: PriceSource;
  recorded_at: string;
}

interface PriceHistoryApiResponse {
  success: boolean;
  count: number;
  entries: PriceHistoryItem[];
  error?: string;
}

export interface PriceHistorySectionProps {
  productId?: string;
  supermarketId?: string;
  title?: string;
  limit?: number;
}

function formatFullTimestampBR(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Data de registro indisponível";
  }
  const datePart = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} às ${timePart}`;
}

function getReadableSourceLabel(source: PriceSource): string {
  switch (source) {
    case "partner_manual":
      return "Painel do Parceiro";
    case "partner_csv":
      return "Planilha CSV";
    case "flyer_ocr":
      return "Encarte OCR Revisado";
    case "team_collected":
      return "Coleta da Equipe";
    case "nfce_qr":
      return "Nota Fiscal NFC-e";
  }
}

export default function PriceHistorySection({
  productId,
  supermarketId,
  title = "Histórico Auditável de Atualizações de Preço",
  limit = 20,
}: PriceHistorySectionProps) {
  const [entries, setEntries] = useState<PriceHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (productId) params.set("product_id", productId);
      if (supermarketId) params.set("supermarket_id", supermarketId);
      params.set("limit", String(limit));

      const response = await fetch(
        `/api/precos/historico?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );
      const data = (await response.json()) as PriceHistoryApiResponse;

      if (!response.ok || !data.success) {
        setErrorMessage(
          data.error ||
            "Não foi possível carregar o histórico de atualizações agora."
        );
        setEntries([]);
        return;
      }

      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setErrorMessage(
        "Falha de conexão ao consultar o histórico auditável de preços."
      );
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [productId, supermarketId, limit]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <section
      aria-label={title}
      className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand-navy">
            <History className="h-5 w-5 text-brand-blue" />
          </div>
          <div>
            <h2 className="font-heading text-base font-extrabold text-brand-navy sm:text-lg">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Registros reais gravados automaticamente a cada publicação ou
              alteração de preço.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadHistory()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-brand-navy transition hover:border-brand-blue hover:bg-brand-light/50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-brand-blue ${
              loading ? "animate-spin" : ""
            }`}
          />
          Atualizar histórico
        </button>
      </div>

      {/* 1. SKELETON LOADING */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 space-y-3"
          aria-label="Carregando histórico de preços"
        >
          {[0, 1, 2].map((skeletonIdx) => (
            <div
              key={skeletonIdx}
              className="flex animate-pulse flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center"
            >
              <div className="space-y-2">
                <div className="h-4 w-48 rounded-md bg-slate-200" />
                <div className="h-3 w-64 rounded-md bg-slate-200/80" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-24 rounded-full bg-slate-200" />
                <div className="h-7 w-20 rounded-lg bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. ESTADO DE ERRO */}
      {!loading && errorMessage && (
        <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadHistory()}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-navy px-3.5 py-2 text-xs font-bold text-white transition hover:bg-brand-blue"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* 3. EMPTY STATE HONESTO */}
      {!loading && !errorMessage && entries.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-[#F4FAFC] p-6 text-center">
          <Clock className="mx-auto h-8 w-8 text-brand-blue" />
          <p className="mt-2 font-heading text-sm font-bold text-brand-navy">
            Nenhuma movimentação de histórico registrada ainda
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
            Assim que um mercado parceiro ou a equipe Economize+ publicar ou
            atualizar preços vinculados a este registro, cada alteração ficará
            auditável aqui com data, horário e origem da coleta.
          </p>
        </div>
      )}

      {/* 4. LINHA DO TEMPO REAL DE ATUALIZAÇÕES */}
      {!loading && !errorMessage && entries.length > 0 && (
        <ol className="mt-4 divide-y divide-slate-100">
          {entries.map((item) => {
            const absDelta = Math.abs(item.delta);
            return (
              <li
                key={item.id}
                className="flex flex-col justify-between gap-3 py-3.5 first:pt-1 last:pb-1 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!productId && (
                      <Link
                        href={`/produto/${item.product_id}`}
                        className="font-heading text-sm font-bold text-brand-navy hover:text-brand-blue hover:underline"
                      >
                        {item.product_name}
                        {item.product_size_label
                          ? ` — ${item.product_size_label}`
                          : ""}
                      </Link>
                    )}

                    <Link
                      href={`/mercados/${item.supermarket_id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-navy hover:text-brand-blue hover:underline"
                    >
                      <Store className="h-3.5 w-3.5 text-brand-blue" />
                      {item.supermarket_name}
                      {item.supermarket_neighborhood
                        ? ` (${item.supermarket_neighborhood})`
                        : ""}
                    </Link>

                    {item.supermarket_verified_at && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand-navy">
                        <CheckCircle2 className="h-3 w-3 text-brand-blue" />
                        Verificado
                      </span>
                    )}

                    {item.is_promo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow px-2.5 py-0.5 text-[10px] font-extrabold text-brand-navy">
                        <Tag className="h-2.5 w-2.5" />
                        Oferta
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <Clock className="h-3 w-3 text-brand-blue" />
                      {formatFullTimestampBR(item.recorded_at)}
                    </span>

                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-brand-navy">
                      Origem: {getReadableSourceLabel(item.source)}
                    </span>

                    {item.product_ean && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <Barcode className="h-3 w-3" />
                        EAN {item.product_ean}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5 sm:justify-end">
                  {item.direction === "down" && (
                    <span className="tabular-price inline-flex items-center gap-1 rounded-full bg-brand-green/25 px-2.5 py-1 text-xs font-extrabold text-emerald-900">
                      <ArrowDownRight className="h-3.5 w-3.5 text-emerald-700" />
                      ↓ Baixou {formatBRL(absDelta)}
                    </span>
                  )}

                  {item.direction === "up" && (
                    <span className="tabular-price inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                      <ArrowUpRight className="h-3.5 w-3.5 text-amber-700" />
                      ↑ Subiu {formatBRL(absDelta)}
                    </span>
                  )}

                  {item.direction === "same" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      <Minus className="h-3 w-3" />= Preço mantido
                    </span>
                  )}

                  {item.direction === "initial" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand-navy">
                      <Sparkles className="h-3 w-3 text-brand-blue" />
                      1º registro
                    </span>
                  )}

                  <div className="text-right">
                    <span className="tabular-price block text-base font-extrabold text-brand-navy">
                      {formatBRL(item.price)}
                    </span>
                    {item.previous_price !== null &&
                      item.direction !== "same" && (
                        <span className="tabular-price block text-[10px] text-slate-400">
                          Antes: {formatBRL(item.previous_price)}
                        </span>
                      )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
