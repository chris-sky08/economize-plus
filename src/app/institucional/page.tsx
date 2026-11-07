"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Database,
  ExternalLink,
  Facebook,
  FileText,
  HelpCircle,
  Instagram,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";

function InstitucionalContent() {
  const searchParams = useSearchParams();
  const initialTab =
    (searchParams.get("aba") as "ajuda" | "privacidade" | "termos") || "ajuda";

  const [activeTab, setActiveTab] = useState<
    "ajuda" | "privacidade" | "termos"
  >(initialTab);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-md bg-brand-light px-2.5 py-0.5 text-xs font-bold text-brand-navy">
            Transparência, Origem dos Dados e Termos
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Minuta técnica — Pendente de revisão jurídica formal
          </span>
        </div>

        <h1 className="mt-2 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
          Central Institucional Economize+
        </h1>

        <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("ajuda")}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
              activeTab === "ajuda"
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Como os Preços São Coletados
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("privacidade")}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
              activeTab === "privacidade"
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Política de Privacidade
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("termos")}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
              activeTab === "termos"
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            Termos de Uso
          </button>
        </div>

        {/* ABA AJUDA */}
        {activeTab === "ajuda" && (
          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-4">
              <h2 className="font-heading text-base font-bold text-brand-navy">
                1. De onde vêm os preços exibidos no Economize+?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Todos os preços publicados possuem origem rastreável e horário
                de atualização visível no card do produto:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600">
                <li>
                  <strong>Planilha do parceiro (partner_csv):</strong> enviada
                  diretamente pelo estabelecimento credenciado.
                </li>
                <li>
                  <strong>Encarte revisado (flyer_ocr):</strong> extraído de
                  encarte promocional e revisado manualmente antes da
                  publicação.
                </li>
                <li>
                  <strong>Coleta em loja (team_collected):</strong> registrada
                  presencialmente com foto da etiqueta de gôndola.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <h2 className="font-heading text-base font-bold text-brand-navy">
                2. Os preços exibidos constituem reserva de estoque na loja?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Não. Os preços refletem o valor registrado na data e hora da
                coleta informada em cada item e estão sujeitos a alteração ou
                esgotamento de estoque na loja física. Preços com mais de 7 dias
                recebem automaticamente o aviso visual{" "}
                <strong>Desatualizado</strong>.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <h2 className="font-heading text-base font-bold text-brand-navy">
                3. Como funciona o cálculo da Lista de Compras?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Multiplicamos a quantidade escolhida pelo preço publicado em
                cada mercado. Caso um mercado não tenha preço cadastrado para
                algum item da sua lista, ele é classificado separadamente como{" "}
                <strong>Cesta Parcial</strong> e o item faltante nunca é somado
                como R$ 0,00.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="flex items-center gap-1.5 font-heading text-base font-bold text-brand-navy">
                <Database className="h-4 w-4 text-brand-blue" />
                4. Atribuição Open Food Facts (ODbL 1.0 / CC BY-SA 3.0)
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Quando um código de barras EAN é escaneado ou consultado, os
                dados cadastrais (nome, marca, peso/volume) e a imagem da
                embalagem podem ser obtidos do banco colaborativo{" "}
                <a
                  href="https://br.openfoodfacts.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-navy underline"
                >
                  Open Food Facts Brasil
                </a>
                , licenciado sob{" "}
                <a
                  href="https://opendatacommons.org/licenses/odbl/1-0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Open Database License (ODbL 1.0)
                </a>{" "}
                para a base de dados e{" "}
                <a
                  href="https://creativecommons.org/licenses/by-sa/3.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0)
                </a>{" "}
                para as imagens de produtos.
              </p>
            </div>
          </div>
        )}

        {/* ABA PRIVACIDADE */}
        {activeTab === "privacidade" && (
          <div className="mt-6 space-y-4 text-xs leading-relaxed text-slate-700 sm:text-sm">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <strong>Nota:</strong> Este documento descreve de forma fiel os
              dados técnicos tratados pela aplicação e encontra-se{" "}
              <strong>pendente de revisão jurídica formal</strong> antes do
              lançamento comercial amplo.
            </div>

            <h2 className="font-heading text-lg font-bold text-brand-navy">
              Política de Privacidade e Tratamento de Dados
            </h2>
            <p>
              Esta política detalha quais informações são coletadas e como são
              utilizadas pelo <strong>Economize+</strong>:
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>Dados de Conta (Opcionais):</strong> A pesquisa de
                preços é aberta sem necessidade de cadastro. Caso o usuário opte
                por criar conta para salvar listas na nuvem, coletamos nome e
                e-mail via Supabase Auth.
              </li>
              <li>
                <strong>Localização e CEP:</strong> O cálculo de distância em
                linha reta até os mercados pode ser feito informando um CEP
                manualmente (consultado via ViaCEP/BrasilAPI) ou autorizando o
                GPS do navegador. As coordenadas selecionadas ficam salvas no{" "}
                <code>localStorage</code> do dispositivo do próprio usuário.
              </li>
              <li>
                <strong>Formulários Públicos e Proteção Anti-Abuso:</strong>{" "}
                Solicitações de parceria de mercados, pré-cadastros de
                entregadores e relatos de divergência de preço coletam os dados
                informados no respectivo formulário e utilizam verificação
                anti-bot (Cloudflare Turnstile) e limitação de taxa por IP para
                segurança operacional.
              </li>
              <li>
                <strong>Armazenamento e Segurança:</strong> Os dados são
                armazenados no Supabase com políticas Row Level Security (RLS)
                ativas no banco de dados.
              </li>
              <li>
                <strong>Cookies e Armazenamento Local (LGPD):</strong>{" "}
                Utilizamos apenas cookies estritamente necessários e chaves de{" "}
                <code>localStorage</code> no navegador do próprio dispositivo
                para manter a Lista de Compras Inteligente, o CEP/raio de
                pesquisa e a confirmação de leitura do aviso de cookies. O
                usuário pode limpar esses dados a qualquer momento pelo
                navegador ou entrar em contato pelo e-mail{" "}
                <a
                  href="mailto:empresaeconomizemais@gmail.com"
                  className="font-mono font-bold text-brand-navy underline"
                >
                  empresaeconomizemais@gmail.com
                </a>
                .
              </li>
            </ul>
          </div>
        )}

        {/* ABA TERMOS DE USO */}
        {activeTab === "termos" && (
          <div className="mt-6 space-y-4 text-xs leading-relaxed text-slate-700 sm:text-sm">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <strong>Nota:</strong> Minuta técnica operacional —{" "}
              <strong>pendente de revisão jurídica formal</strong>.
            </div>

            <h2 className="font-heading text-lg font-bold text-brand-navy">
              Termos e Condições de Uso da Plataforma Economize+
            </h2>
            <p>
              O <strong>Economize+</strong> é uma plataforma informativa de
              comparação de preços e divulgação de mercados locais.
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>Caráter Informativo e Estimativo:</strong> As cotações
                individuais e os subtotais da Lista de Compras são estimativas
                baseadas na última coleta registrada (cujo horário e fonte são
                exibidos em cada oferta) e não constituem reserva de produto nem
                vinculação de oferta pelo Economize+.
              </li>
              <li>
                <strong>Comparação por Medida Exata:</strong> Cada produto é
                identificado por seu código de barras (GTIN/EAN) e medida
                específica, evitando a comparação indevida de embalagens de
                pesos ou volumes distintos.
              </li>
              <li>
                <strong>Transparência Publicitária (CDC):</strong> Qualquer
                item com destaque patrocinado é identificado de forma visível
                com o selo <em>Destaque Patrocinado</em> e não altera a
                ordenação objetiva por menor preço.
              </li>
              <li>
                <strong>Módulo de Entregas:</strong> O recurso de entregas
                encontra-se em fase de pré-cadastro informativo, sem realização
                de pedidos ou cobranças online no momento.
              </li>
            </ul>
          </div>
        )}

        {/* CANAIS OFICIAIS DE COMUNICAÇÃO E NOVIDADES DA COMUNIDADE */}
        <div className="mt-8 rounded-2xl border border-brand-blue/30 bg-brand-light/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-navy text-white shadow-xs">
                <Instagram className="h-5 w-5 text-brand-yellow" />
              </div>
              <div>
                <span className="inline-block rounded-md bg-brand-green/25 px-2 py-0.5 text-[11px] font-extrabold text-brand-navy">
                  Canais Oficiais Verificados — Bertioga, SP
                </span>
                <h2 className="mt-1 font-heading text-base font-bold text-brand-navy sm:text-lg">
                  Instagram, Facebook e Atendimento Oficial Economize+
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  Acompanhe comunicados de novos mercados parceiros, dicas de
                  economia doméstica e atualizações oficiais no Instagram{" "}
                  <strong className="font-mono text-brand-navy">
                    @economizemais_oficial
                  </strong>
                  , na página oficial do Facebook{" "}
                  <strong className="text-brand-navy">Economize mais</strong> e
                  pelo e-mail institucional{" "}
                  <a
                    href="mailto:empresaeconomizemais@gmail.com"
                    className="font-mono font-bold text-brand-navy underline"
                  >
                    empresaeconomizemais@gmail.com
                  </a>
                  .
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 font-semibold text-brand-navy">
                    <MapPin className="h-3.5 w-3.5 text-brand-blue" />
                    Bertioga, SP, Brasil
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-brand-blue" />
                    empresaeconomizemais@gmail.com
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.instagram.com/economizemais_oficial"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-blue active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
              >
                <Instagram className="h-4 w-4 text-brand-yellow" />
                <span>@economizemais_oficial</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <a
                href="https://www.facebook.com/search/top?q=Economize%20mais"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1877F2] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#166FE5] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
              >
                <Facebook className="h-4 w-4 text-white" />
                <span>Facebook: Economize mais</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InstitucionalPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl p-8 text-center text-sm text-slate-500">
          Carregando informações institucionais...
        </div>
      }
    >
      <InstitucionalContent />
    </Suspense>
  );
}
