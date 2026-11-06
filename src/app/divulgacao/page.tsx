"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ListChecks,
  Megaphone,
  Printer,
  QrCode,
  Search,
  Share2,
  Sparkles,
  Store,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import QrCodePromoCard from "@/components/QrCodePromoCard";

type PromoModeId = "geral" | "buscar" | "lista" | "parceiro" | "mercado";

interface PromoPreset {
  id: PromoModeId;
  label: string;
  shortDescription: string;
  path: string;
  badgeLabel: string;
  posterTitle: string;
  posterSubtitle: string;
  steps: readonly [string, string, string, string];
  icon: React.ReactNode;
}

const PROMO_PRESETS: readonly PromoPreset[] = [
  {
    id: "geral",
    label: "QR Code Geral do Aplicativo",
    shortDescription: "Página inicial com ofertas em destaque e mercados da região (`/`) ou busca rápida (`/buscar`).",
    path: "/",
    badgeLabel: "DIVULGAÇÃO OFICIAL • ECONOMIZE+",
    posterTitle: "Compare preços perto de você",
    posterSubtitle:
      "Aponte a câmera do celular para consultar ofertas com data e hora de coleta e economizar nas compras do dia a dia.",
    steps: [
      "Aponte a câmera do celular para o QR Code",
      "Informe seu CEP ou ative a localização",
      "Compare preços entre mercados da região",
      "Escolha onde comprar com transparência",
    ],
    icon: <QrCode className="h-5 w-5" />,
  },
  {
    id: "buscar",
    label: "QR Code de Busca & Leitor EAN",
    shortDescription: "Leva direto ao comparador de produtos e leitor de código de barras (`/buscar`).",
    path: "/buscar",
    badgeLabel: "COMPARADOR DE PREÇOS • ECONOMIZE+",
    posterTitle: "Consulte preços por produto ou código de barras",
    posterSubtitle:
      "Escaneie este QR Code na gôndola para pesquisar itens equivalentes e conferir o valor por quilo, litro ou unidade.",
    steps: [
      "Escaneie o QR Code com a câmera do celular",
      "Digite o nome do produto ou leia o código EAN",
      "Veja o preço total e o preço por medida (kg/L)",
      "Confira a data e hora da última atualização",
    ],
    icon: <Search className="h-5 w-5" />,
  },
  {
    id: "lista",
    label: "QR Code da Lista Inteligente",
    shortDescription: "Direciona o consumidor para montar e comparar a cesta completa (`/lista`).",
    path: "/lista",
    badgeLabel: "LISTA DE COMPRAS INTELIGENTE • ECONOMIZE+",
    posterTitle: "Monte sua Lista de Compras Inteligente",
    posterSubtitle:
      "Descubra em qual supermercado sua cesta completa ou parcial sai mais em conta antes de sair de casa.",
    steps: [
      "Aponte a câmera do celular para o QR Code",
      "Adicione os itens da sua compra do mês ou semana",
      "Compare o subtotal real em cada mercado ativo",
      "Veja alertas claros de itens sem estoque cadastrado",
    ],
    icon: <ListChecks className="h-5 w-5" />,
  },
  {
    id: "parceiro",
    label: "QR Code para Mercados Parceiros",
    shortDescription: "Convite direto para supermercados locais cadastrarem suas ofertas (`/seja-parceiro`).",
    path: "/seja-parceiro",
    badgeLabel: "PARCERIA COMERCIAL • ECONOMIZE+",
    posterTitle: "Traga seu supermercado para o Economize+",
    posterSubtitle:
      "Divulgue suas ofertas com transparência para consumidores do seu bairro via painel web, planilha CSV ou leitura de encarte.",
    steps: [
      "Aponte a câmera do celular para o QR Code",
      "Preencha os dados do seu supermercado ou comércio",
      "Publique preços via painel, planilha ou encarte",
      "Atraia clientes da sua região com dados verificados",
    ],
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "mercado",
    label: "QR Code Específico de Supermercado Ativo",
    shortDescription: "Gera o cartaz exclusivo da página de um mercado cadastrado (`/mercados/[id]`).",
    path: "/mercados",
    badgeLabel: "MERCADO PARCEIRO • ECONOMIZE+",
    posterTitle: "Confira nossas ofertas atualizadas no Economize+",
    posterSubtitle:
      "Aponte a câmera do celular para ver o catálogo deste supermercado e adicionar produtos à sua Lista Inteligente.",
    steps: [
      "Aponte a câmera do celular para o QR Code",
      "Acesse a vitrine digital deste supermercado",
      "Confira os preços com horário de atualização",
      "Adicione os itens à sua Lista Inteligente",
    ],
    icon: <Store className="h-5 w-5" />,
  },
];

export default function DivulgacaoPage() {
  const { markets, catalogLoading } = useApp();
  const [selectedMode, setSelectedMode] = useState<PromoModeId>("geral");
  const [selectedMarketId, setSelectedMarketId] = useState<string>("");

  const activeMarkets = useMemo(
    () => markets.filter((m) => m.status === "ativo"),
    [markets]
  );

  const effectiveMarketId = useMemo(() => {
    if (selectedMarketId && activeMarkets.some((m) => m.id === selectedMarketId)) {
      return selectedMarketId;
    }
    return activeMarkets[0]?.id ?? "";
  }, [activeMarkets, selectedMarketId]);

  const selectedMarket = useMemo(
    () => activeMarkets.find((m) => m.id === effectiveMarketId) ?? null,
    [activeMarkets, effectiveMarketId]
  );

  const currentPreset = useMemo(
    () => PROMO_PRESETS.find((p) => p.id === selectedMode) ?? PROMO_PRESETS[0],
    [selectedMode]
  );

  const computedPath = useMemo(() => {
    if (selectedMode === "mercado") {
      return selectedMarket ? `/mercados/${selectedMarket.id}` : "/mercados";
    }
    return currentPreset.path;
  }, [currentPreset.path, selectedMarket, selectedMode]);

  const computedAddress = useMemo(() => {
    if (selectedMode !== "mercado" || !selectedMarket) return null;
    const parts = [
      selectedMarket.address,
      selectedMarket.neighborhood,
      selectedMarket.city,
    ].filter(Boolean);
    return parts.join(" — ");
  }, [selectedMarket, selectedMode]);

  return (
    <div className="min-h-screen bg-[#F4FAFC] pb-20">
      {/* Hero Institucional da Central de Divulgação */}
      <section className="bg-brand-navy py-10 text-white sm:py-14 print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/40 bg-brand-yellow/15 px-3.5 py-1.5 text-xs font-bold text-brand-yellow">
              <Sparkles className="h-4 w-4" />
              Kit de Marketing & Identidade Oficial (Fluxo Google Pomelli)
            </span>
            <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              Central de Divulgação & QR Code — Economize
              <span className="text-brand-green">+</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-brand-light sm:text-base">
              Gere instantaneamente o QR Code vetorial (SVG) e o cartaz pronto em alta
              resolução (<span className="font-mono">1080×1350px</span> PNG) para
              balcão de caixa, gôndola de supermercado ou postagem no Instagram e
              WhatsApp — sempre com o endereço real de demonstração ou produção.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 pt-8 sm:px-6">
        {/* Seletor de Modalidade de QR Code (oculto na impressão) */}
        <section aria-labelledby="seletor-modalidade-heading" className="print:hidden">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="seletor-modalidade-heading"
                className="font-heading text-lg font-extrabold text-brand-navy sm:text-xl"
              >
                1. Escolha o destino do QR Code de Divulgação
              </h2>
              <p className="text-xs text-slate-600 sm:text-sm">
                Selecione qual funcionalidade ou supermercado você deseja destacar no cartaz.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PROMO_PRESETS.map((preset) => {
              const isSelected = selectedMode === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedMode(preset.id)}
                  className={`flex min-h-[44px] flex-col justify-between rounded-2xl border-2 p-4 text-left transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-blue ${
                    isSelected
                      ? "border-brand-navy bg-brand-navy text-white shadow-md"
                      : "border-slate-200 bg-white text-brand-navy hover:border-brand-blue/60"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                          isSelected
                            ? "bg-brand-yellow text-brand-navy"
                            : "bg-brand-light text-brand-blue"
                        }`}
                      >
                        {preset.icon}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-green px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-brand-navy">
                          <CheckCircle2 className="h-3 w-3" />
                          Ativo
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 font-heading text-sm font-bold leading-snug">
                      {preset.label}
                    </h3>
                    <p
                      className={`mt-1 text-xs leading-relaxed ${
                        isSelected ? "text-brand-light" : "text-slate-600"
                      }`}
                    >
                      {preset.shortDescription}
                    </p>
                  </div>
                  <div
                    className={`mt-3 inline-block rounded-lg px-2 py-1 font-mono text-[11px] font-semibold ${
                      isSelected
                        ? "bg-white/15 text-brand-yellow"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Rota: {preset.path}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Seletor de Supermercado Real quando o modo "mercado" está selecionado */}
          {selectedMode === "mercado" && (
            <div className="mt-5 rounded-2xl border border-brand-blue/30 bg-white p-5 shadow-xs">
              <h3 className="font-heading text-base font-bold text-brand-navy">
                Selecione o Supermercado Ativo para o Cartaz Exclusivo
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                Listamos exclusivamente os mercados ativos reais cadastrados no banco de
                dados do Economize+.
              </p>

              {catalogLoading ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100 p-4"
                    />
                  ))}
                </div>
              ) : activeMarkets.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-[#F4FAFC] p-6 text-center">
                  <Store className="mx-auto h-8 w-8 text-brand-blue" />
                  <p className="mt-2 font-heading text-sm font-bold text-brand-navy">
                    Nenhum mercado parceiro ativo cadastrado no momento
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
                    Assim que o primeiro supermercado ativo estiver publicado no catálogo,
                    você poderá selecioná-lo aqui para gerar seu QR Code individual.
                    Enquanto isso, o QR Code aponta para a vitrine geral{" "}
                    <code className="font-mono text-brand-navy">/mercados</code>.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/seja-parceiro"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-navy/90"
                    >
                      <span>Cadastrar Supermercado Parceiro</span>
                      <ArrowRight className="h-4 w-4 text-brand-yellow" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activeMarkets.map((market) => {
                    const isChosen = market.id === effectiveMarketId;
                    return (
                      <button
                        key={market.id}
                        type="button"
                        onClick={() => setSelectedMarketId(market.id)}
                        className={`flex min-h-[44px] items-start justify-between gap-3 rounded-xl border-2 p-3.5 text-left transition active:scale-95 ${
                          isChosen
                            ? "border-brand-blue bg-brand-light/70 text-brand-navy"
                            : "border-slate-200 bg-white text-brand-navy hover:border-brand-blue/40"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading text-sm font-bold text-brand-navy">
                              {market.name}
                            </span>
                            {market.verifiedAt && (
                              <span className="rounded-full bg-brand-green/20 px-2 py-0.5 text-[10px] font-bold text-brand-navy">
                                Verificado
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            {market.neighborhood} • {market.city}/{market.state}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-brand-blue">
                            /mercados/{market.id}
                          </p>
                        </div>
                        {isChosen && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-blue" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Componente Principal do Gerador de QR Code & Cartaz */}
        <section aria-label="Gerador e Preview do Cartaz com QR Code">
          <QrCodePromoCard
            defaultPath={computedPath}
            title={currentPreset.posterTitle}
            subtitle={currentPreset.posterSubtitle}
            badgeLabel={currentPreset.badgeLabel}
            steps={currentPreset.steps}
            marketName={selectedMode === "mercado" ? selectedMarket?.name ?? null : null}
            marketAddress={computedAddress}
            allowCustomPath={true}
          />
        </section>

        {/* Guia de Boas Práticas para Supermercados e Divulgadores (oculto na impressão) */}
        <section
          aria-labelledby="boas-praticas-heading"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 print:hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue">
                <Megaphone className="h-4 w-4" />
                Guia de Aplicação Física & Digital
              </span>
              <h2
                id="boas-praticas-heading"
                className="mt-1 font-heading text-xl font-extrabold text-brand-navy sm:text-2xl"
              >
                Como divulgar o Economize+ no ponto de venda e nas redes
              </h2>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-[#F4FAFC] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy text-brand-yellow">
                <Printer className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-brand-navy">
                1. Display de Caixa e Balcão (A4 / A5)
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Imprima o cartaz diretamente pelo botão{" "}
                <strong>Imprimir Cartaz de Balcão / Caixa</strong> e posicione em
                displays de acrílico na entrada da loja, no balcão de atendimento ou
                próximo aos caixas para que o consumidor consulte as ofertas do dia.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-[#F4FAFC] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-white">
                <Store className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-brand-navy">
                2. Etiquetas de Gôndola e Encartes
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Baixe o <strong>QR Vetorial (SVG)</strong> para inserir em encartes
                impressos ou tabloides semanais sem perda de nitidez. O cliente aponta
                a câmera e confere a comparação justa por medida (R$/kg, R$/L, R$/un).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-[#F4FAFC] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green text-brand-navy">
                <Share2 className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-brand-navy">
                3. Post para Instagram, Status e WhatsApp
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Use o botão{" "}
                <strong>Baixar Cartaz Pronto para Impressão / Redes Sociais (PNG)</strong>{" "}
                para salvar uma imagem em proporção vertical{" "}
                <span className="font-mono">4:5 (1080×1350px)</span> pronta para o feed
                do Instagram ou grupos de ofertas no WhatsApp.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
