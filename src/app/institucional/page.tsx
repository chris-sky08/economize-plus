"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Cookie,
  Database,
  ExternalLink,
  FileText,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { triggerCookiePreferencesModal } from "@/components/CookieConsentBanner";
import { triggerFeedbackModal } from "@/components/FeedbackWidget";
import { ECONOMIZE_ICONS } from "@/lib/icons";

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
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Conformidade LGPD (Lei nº 13.709/2018) & Marco Civil
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
                  <strong>Planilha do parceiro:</strong> enviada diretamente
                  pelo estabelecimento credenciado.
                </li>
                <li>
                  <strong>Encarte revisado:</strong> extraído de encarte
                  promocional e conferido manualmente antes da publicação.
                </li>
                <li>
                  <strong>Coleta em loja:</strong> registrada presencialmente
                  com foto da etiqueta de gôndola.
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

        {/* ABA PRIVACIDADE E COOKIES (LGPD + GUIA ANPD) */}
        {activeTab === "privacidade" && (
          <div className="mt-6 space-y-5 text-xs leading-relaxed text-slate-700 sm:text-sm">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
              <strong>Compromisso de Privacidade e Transparência:</strong> Este documento
              descreve de forma clara, integral e acessível ao consumidor todos os dados
              técnicos, cookies e chaves de armazenamento local tratados pela
              aplicação em rigorosa observância à{" "}
              <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD)</strong>,
              ao <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong> e
              ao{" "}
              <strong>
                Guia Orientativo “Cookies e Proteção de Dados Pessoais” da ANPD
              </strong>. Seus dados nunca são vendidos ou repassados a terceiros para fins de marketing.
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-blue/30 bg-brand-light/40 p-4">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-brand-navy">
                  1. Política de Privacidade, Cookies e Tratamento de Dados (LGPD)
                </h2>
                <p className="text-xs text-slate-600">
                  Você pode revisar ou alterar suas preferências de cookies a
                  qualquer momento clicando no botão ao lado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => triggerCookiePreferencesModal()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy px-4 py-2 text-xs font-extrabold text-white shadow-2xs transition hover:bg-brand-blue active:scale-95"
              >
                <Cookie className="h-4 w-4 text-brand-yellow" />
                <span>Abrir Gerenciador de Cookies (ANPD)</span>
              </button>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <h3 className="font-heading text-base font-bold text-brand-navy">
                2. Quais Dados Coletamos e Bases Legais (Art. 7º da LGPD)
              </h3>
              <ul className="list-inside list-disc space-y-2 text-xs sm:text-sm">
                <li>
                  <strong>Consulta Aberta sem Cadastro (Minimização — Art. 6º, III):</strong>{" "}
                  A pesquisa de preços, comparação por quilo/litro, leitura de
                  código de barras EAN e montagem da Lista de Compras
                  funcionam sem exigir nome, CPF, telefone ou criação de conta.
                </li>
                <li>
                  <strong>Dados de Conta Opcional (Execução a pedido do titular — Art. 7º, V):</strong>{" "}
                  Caso o consumidor opte voluntariamente por criar uma conta em{" "}
                  <code>/conta</code>, tratamos nome e endereço de e-mail via
                  Supabase Auth exclusivamente para autenticação e recuperação
                  de senha.
                </li>
                <li>
                  <strong>Localização e CEP (Consentimento / Execução — Art. 7º, I e V):</strong>{" "}
                  O cálculo de distância em linha reta até os mercados pode ser
                  feito informando um CEP manualmente (consultado via
                  ViaCEP/BrasilAPI) ou autorizando o GPS do navegador. As
                  coordenadas escolhidas ficam salvas apenas no{" "}
                  <code>localStorage</code> do dispositivo do próprio usuário.
                </li>
                <li>
                  <strong>Central de Avaliação, Sugestões, Bugs e Parcerias (Art. 7º, V):</strong>{" "}
                  Ao enviar uma avaliação, relato de bug, indicação de mercado
                  ou solicitação de parceria comercial/entregador, coletamos a
                  nota (1 a 5 estrelas), categoria, mensagem e, opcionalmente, o
                  nome e meio de contato informados pelo próprio usuário para
                  resposta da equipe pelo e-mail{" "}
                  <code>empresaeconomizemais@gmail.com</code>.
                </li>
                <li>
                  <strong>Prevenção à Fraude e Segurança (Legítimo Interesse — Art. 7º, IX):</strong>{" "}
                  Rotas de escrita utilizam verificação anti-bot (Cloudflare
                  Turnstile), validação de origem (Anti-CSRF) e limitação
                  temporária de taxa por IP para impedir ataques automatizados.
                </li>
              </ul>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-heading text-base font-bold text-brand-navy">
                3. Inventário Completo de Cookies e Armazenamento Local (Padrão ANPD)
              </h3>
              <p className="text-xs text-slate-600">
                Classificação detalhada nos 4 eixos do Guia Orientativo da ANPD
                (Necessidade, Finalidade, Gestão e Retenção):
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-navy text-white">
                    <tr>
                      <th className="p-2.5 font-bold">Chave / Cookie</th>
                      <th className="p-2.5 font-bold">Gestão</th>
                      <th className="p-2.5 font-bold">Categoria ANPD</th>
                      <th className="p-2.5 font-bold">Retenção</th>
                      <th className="p-2.5 font-bold">Finalidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-brand-navy">
                        economize_location_v2
                      </td>
                      <td className="p-2.5">1ª Parte (Próprio)</td>
                      <td className="p-2.5">Estritamente Necessário</td>
                      <td className="p-2.5">Persistente no aparelho</td>
                      <td className="p-2.5">
                        Guarda CEP, bairro, cidade e raio (km) configurados pelo
                        usuário.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-brand-navy">
                        economize_shopping_list_v2
                      </td>
                      <td className="p-2.5">1ª Parte (Próprio)</td>
                      <td className="p-2.5">Estritamente Necessário</td>
                      <td className="p-2.5">Persistente no aparelho</td>
                      <td className="p-2.5">
                        Guarda os itens e quantidades da Lista Inteligente de
                        compras.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-brand-navy">
                        economize_cookie_consent_v1
                      </td>
                      <td className="p-2.5">1ª Parte (Próprio)</td>
                      <td className="p-2.5">Estritamente Necessário</td>
                      <td className="p-2.5">12 meses</td>
                      <td className="p-2.5">
                        Armazena o registro de consentimento ou rejeição de
                        cookies opcionais.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-brand-navy">
                        sb-*-auth-token
                      </td>
                      <td className="p-2.5">1ª Parte / Supabase</td>
                      <td className="p-2.5">Necessário (autenticação)</td>
                      <td className="p-2.5">Durante a sessão logada</td>
                      <td className="p-2.5">
                        Mantém o login ativo quando o usuário acessa sua conta ou
                        painel.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-brand-navy">
                        cf_clearance / Turnstile
                      </td>
                      <td className="p-2.5">3ª Parte (Cloudflare)</td>
                      <td className="p-2.5">Necessário (segurança)</td>
                      <td className="p-2.5">Sessão (30 min)</td>
                      <td className="p-2.5">
                        Proteção anti-bot em envios de formulários públicos.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono font-bold text-brand-navy">
                        economize_ui_prefs_v1
                      </td>
                      <td className="p-2.5">1ª Parte (Próprio)</td>
                      <td className="p-2.5">Funcional (Opt-in opcional)</td>
                      <td className="p-2.5">180 dias</td>
                      <td className="p-2.5">
                        Desativado por padrão; lembra preferências visuais se
                        aceito pelo usuário.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
              <h3 className="font-heading text-base font-bold text-brand-navy">
                4. Direitos do Titular (Art. 18 da LGPD) e Canal de Atendimento
              </h3>
              <p className="text-xs text-slate-600 sm:text-sm">
                O titular dos dados tem direito a solicitar confirmação de
                tratamento, acesso, correção, anonimização, eliminação de dados
                tratados mediante consentimento e revogação a qualquer momento.
                Para exercer seus direitos ou tirar dúvidas, entre em contato
                pelo e-mail oficial{" "}
                <a
                  href="mailto:empresaeconomizemais@gmail.com"
                  className="font-mono font-bold text-brand-navy underline"
                >
                  empresaeconomizemais@gmail.com
                </a>{" "}
                ou abra o{" "}
                <button
                  type="button"
                  onClick={() =>
                    triggerFeedbackModal({ rating: 5, category: "duvida" })
                  }
                  className="font-bold text-brand-blue underline hover:text-brand-navy"
                >
                  Formulário de Dúvidas e Contato
                </button>
                .
              </p>
            </div>
          </div>
        )}

        {/* ABA TERMOS DE USO */}
        {activeTab === "termos" && (
          <div className="mt-6 space-y-4 text-xs leading-relaxed text-slate-700 sm:text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <strong>Termos e Condições Transparentes:</strong> Diretrizes claras de uso para consumidores e estabelecimentos parceiros cadastrados na plataforma Economize+.
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
            <div className="flex min-w-0 flex-1 items-start gap-3.5">
              <img
                src={ECONOMIZE_ICONS["canais-oficiais"].src}
                alt={ECONOMIZE_ICONS["canais-oficiais"].alt}
                width={56}
                height={56}
                loading="lazy"
                className="h-14 w-14 shrink-0 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-xs"
              />
              <div className="min-w-0 flex-1">
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
                    className="font-mono font-bold text-brand-navy underline break-all"
                  >
                    empresaeconomizemais@gmail.com
                  </a>
                  .
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-brand-navy">
                    <img
                      src={ECONOMIZE_ICONS["passo-cep-gps"].src}
                      alt=""
                      width={24}
                      height={24}
                      loading="lazy"
                      className="h-6 w-6 shrink-0 rounded-full border border-brand-blue/40 bg-white object-cover"
                    />
                    Bertioga, SP, Brasil
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-slate-700">
                    <img
                      src={ECONOMIZE_ICONS["email-oficial"].src}
                      alt=""
                      width={24}
                      height={24}
                      loading="lazy"
                      className="h-6 w-6 shrink-0 rounded-full border border-brand-blue/40 bg-white object-cover"
                    />
                    <span className="truncate">empresaeconomizemais@gmail.com</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.instagram.com/economizemais_oficial"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-navy py-1.5 pr-4 pl-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-blue active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
              >
                <img
                  src={ECONOMIZE_ICONS["instagram-oficial"].src}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="h-8 w-8 shrink-0 rounded-full border-2 border-brand-yellow bg-white object-cover"
                />
                <span>@economizemais_oficial</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <a
                href="https://www.facebook.com/economizemaisoficial"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1877F2] py-1.5 pr-4 pl-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#166FE5] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
              >
                <img
                  src={ECONOMIZE_ICONS["facebook-oficial"].src}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="h-8 w-8 shrink-0 rounded-full border-2 border-brand-yellow bg-white object-cover"
                />
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
