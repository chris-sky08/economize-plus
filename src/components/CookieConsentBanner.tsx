"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Cookie,
  FileText,
  Scale,
  Settings2,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

const COOKIE_CONSENT_STORAGE_KEY = "economize_cookie_consent_v1";
const OPTIONAL_PREFS_STORAGE_KEY = "economize_ui_prefs_v1";

export interface CookieConsentState {
  essential: true;
  functional: boolean;
  analytics: boolean;
  decidedAt: string;
  version: string;
}

export function triggerCookiePreferencesModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("economize:open-cookie-preferences"));
}

export default function CookieConsentBanner() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "categorias" | "inventario" | "lgpd" | "direitos"
  >("categorias");

  // Pelo Guia Orientativo da ANPD, cookies não necessários começam DESATIVADOS por padrão (Opt-in)
  const [functionalEnabled, setFunctionalEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [clearedFeedback, setClearedFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (!raw) {
        // Inicializa automaticamente o consentimento estritamente necessário (cesta e CEP local)
        // sem exibir banner intrusivo bloqueando a navegação do consumidor ao entrar no site.
        const defaultState: CookieConsentState = {
          essential: true,
          functional: false,
          analytics: false,
          decidedAt: new Date().toISOString(),
          version: "2026.11-ANPD",
        };
        window.localStorage.setItem(
          COOKIE_CONSENT_STORAGE_KEY,
          JSON.stringify(defaultState)
        );
      } else {
        const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
        setFunctionalEnabled(Boolean(parsed.functional));
        setAnalyticsEnabled(Boolean(parsed.analytics));
      }
    } catch {
      // Ignora erro de acesso a localStorage em ambientes restritos
    }

    const handleOpenPrefs = () => {
      setClearedFeedback(null);
      setModalOpen(true);
    };
    window.addEventListener("economize:open-cookie-preferences", handleOpenPrefs);
    return () => {
      window.removeEventListener(
        "economize:open-cookie-preferences",
        handleOpenPrefs
      );
    };
  }, []);

  const saveConsent = (functional: boolean, analytics: boolean) => {
    const state: CookieConsentState = {
      essential: true,
      functional,
      analytics,
      decidedAt: new Date().toISOString(),
      version: "2026.11-ANPD",
    };
    try {
      window.localStorage.setItem(
        COOKIE_CONSENT_STORAGE_KEY,
        JSON.stringify(state)
      );
      if (!functional) {
        window.localStorage.removeItem(OPTIONAL_PREFS_STORAGE_KEY);
      }
    } catch {
      // Ignora caso o navegador bloqueie escrita em modo privado restrito
    }
    setFunctionalEnabled(functional);
    setAnalyticsEnabled(analytics);
    setModalOpen(false);
  };

  const handleClearAllLocalData = () => {
    try {
      const keysToRemove = [
        "economize_location_v2",
        "economize_location_v1",
        "economize_location",
        "economize_shopping_list_v2",
        "economize_shopping_list_v1",
        "economize_shopping_list",
        "economize_feedback_evaluated_v1",
        OPTIONAL_PREFS_STORAGE_KEY,
        COOKIE_CONSENT_STORAGE_KEY,
      ];
      for (const k of keysToRemove) {
        window.localStorage.removeItem(k);
      }
      window.dispatchEvent(new CustomEvent("economize:clear-local-data"));
      setFunctionalEnabled(false);
      setAnalyticsEnabled(false);
      setClearedFeedback(
        "Todos os dados locais (CEP, Lista de Compras e preferências) foram apagados deste navegador com sucesso."
      );
    } catch {
      setClearedFeedback("Não foi possível limpar o armazenamento local.");
    }
  };

  if (!modalOpen) return null;

  return (
    <>
      {/* MODAL DETALHADO DE COOKIES, INVENTÁRIO TÉCNICO E LGPD (ACESSADO SOB DEMANDA) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2.5 backdrop-blur-xs sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-2 border-brand-blue bg-white shadow-2xl">
            <div className="h-2 w-full shrink-0 bg-gradient-to-r from-brand-blue via-brand-green to-brand-yellow" />

            {/* Cabeçalho com botão X fixo no cantinho superior direito */}
            <div className="relative flex shrink-0 items-start gap-3 bg-brand-navy px-4 py-4 pr-14 text-white sm:items-center sm:px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-yellow">
                <Scale className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-full bg-brand-yellow px-2.5 py-0.5 text-[10px] font-black uppercase text-brand-navy">
                  Lei nº 13.709/2018 (LGPD) &amp; Guia da ANPD
                </span>
                <h2
                  id="cookie-modal-title"
                  className="mt-1 font-heading text-sm font-extrabold leading-snug text-white sm:text-lg"
                >
                  Central Detalhada de Cookies, Armazenamento Local e Privacidade
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar central de privacidade e cookies"
                className="absolute top-3 right-3 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-slate-950/35 text-white transition hover:bg-white/25 active:scale-95 sm:top-3.5 sm:right-3.5 sm:h-10 sm:w-10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navegação de Abas */}
            <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 sm:px-5">
              {[
                {
                  id: "categorias" as const,
                  label: "1. Preferências por Categoria",
                },
                {
                  id: "inventario" as const,
                  label: "2. Tabela de Cookies e Chaves",
                },
                {
                  id: "lgpd" as const,
                  label: "3. Bases Legais (Art. 7º LGPD)",
                },
                {
                  id: "direitos" as const,
                  label: "4. Direitos do Titular (Art. 18)",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
                    activeTab === tab.id
                      ? "bg-brand-navy text-white shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-brand-light hover:text-brand-navy"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Conteúdo Rolável */}
            <div className="flex-1 overflow-y-auto p-4 text-xs leading-relaxed text-slate-700 sm:p-6 sm:text-sm">
              {/* ABA 1: CATEGORIAS GRANULARES (OPT-IN) */}
              {activeTab === "categorias" && (
                <div className="space-y-4">
                  <p className="text-slate-600">
                    De acordo com o{" "}
                    <strong>
                      Guia Orientativo “Cookies e Proteção de Dados Pessoais” da
                      ANPD
                    </strong>
                    , classificamos os recursos de armazenamento local segundo a
                    necessidade, finalidade, gestão (próprios ou de terceiros) e
                    período de retenção. As opções não essenciais vêm{" "}
                    <strong>desmarcadas por padrão (Opt-in)</strong>.
                  </p>

                  {/* Categoria 1: Estritamente Necessários */}
                  <div className="rounded-2xl border-2 border-brand-navy/20 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="rounded-md bg-brand-navy px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                          Estritamente Necessários
                        </span>
                        <h3 className="mt-1 font-heading text-sm font-extrabold text-brand-navy sm:text-base">
                          Funcionamento Essencial, Lista de Compras, CEP e Sessão
                        </h3>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                        Sempre Ativos (Base Legal: Execução / Legítimo Interesse)
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Indispensáveis para que o site funcione: guardam os itens
                      que você adiciona na sua Lista de Compras Inteligente, o
                      CEP/raio escolhido para calcular a distância até os
                      mercados, o token de sessão caso você faça login e a
                      verificação anti-robô nos formulários públicos. Sem eles,
                      sua lista seria perdida ao trocar de página.
                    </p>
                  </div>

                  {/* Categoria 2: Funcionais e Preferências Regionais */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="rounded-md bg-brand-light px-2 py-0.5 text-[10px] font-extrabold uppercase text-brand-navy">
                          Funcionais (Não Necessários — Opt-in)
                        </span>
                        <h3 className="mt-1 font-heading text-sm font-extrabold text-brand-navy sm:text-base">
                          Preferências de Visualização e Filtros de Corredor
                        </h3>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={functionalEnabled}
                          onChange={(e) =>
                            setFunctionalEnabled(e.target.checked)
                          }
                          className="peer sr-only"
                          aria-label="Ativar cookies funcionais opcionais"
                        />
                        <div className="h-7 w-12 rounded-full bg-slate-300 after:absolute after:top-0.5 after:left-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-green" />
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Permitem lembrar o último departamento filtrado na vitrine
                      e preferências de ordenação entre visitas. Base legal:
                      Consentimento livre, informado e inequívoco (Art. 7º, I da
                      LGPD).
                    </p>
                  </div>

                  {/* Categoria 3: Analíticos e Desempenho */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="rounded-md bg-brand-light px-2 py-0.5 text-[10px] font-extrabold uppercase text-brand-navy">
                          Desempenho e Estatísticas Agregadas (Opt-in)
                        </span>
                        <h3 className="mt-1 font-heading text-sm font-extrabold text-brand-navy sm:text-base">
                          Métricas Anônimas de Velocidade e Estabilidade
                        </h3>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={analyticsEnabled}
                          onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                          className="peer sr-only"
                          aria-label="Ativar cookies de desempenho opcionais"
                        />
                        <div className="h-7 w-12 rounded-full bg-slate-300 after:absolute after:top-0.5 after:left-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-green" />
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Ajudam nossa equipe técnica a identificar páginas lentas ou
                      erros de leitura de código de barras EAN. Não utilizamos
                      cookies de venda de dados pessoais nem redes de anúncios
                      comportamentais de terceiros.
                    </p>
                  </div>
                </div>
              )}

              {/* ABA 2: INVENTÁRIO TÉCNICO COMPLETO */}
              {activeTab === "inventario" && (
                <div className="space-y-4">
                  <p className="text-slate-600">
                    Abaixo está a lista integral e auditável de todas as chaves
                    de armazenamento local (<code>localStorage</code>) e cookies
                    utilizados pelo <strong>Economize+</strong>, conforme exigido
                    pelo princípio da transparência (Art. 6º, VI e Art. 9º da
                    LGPD):
                  </p>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-brand-navy text-white">
                        <tr>
                          <th className="p-3 font-bold">Nome / Chave</th>
                          <th className="p-3 font-bold">Gestão / Origem</th>
                          <th className="p-3 font-bold">Classificação</th>
                          <th className="p-3 font-bold">Retenção</th>
                          <th className="p-3 font-bold">Finalidade Específica</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr>
                          <td className="p-3 font-mono font-bold text-brand-navy">
                            economize_location_v2
                          </td>
                          <td className="p-3">Próprio (1ª parte)</td>
                          <td className="p-3">Necessário</td>
                          <td className="p-3">Persistente (local)</td>
                          <td className="p-3">
                            Salva no aparelho do usuário o CEP, bairro, cidade e
                            raio em km para calcular a distância até os mercados.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-brand-navy">
                            economize_shopping_list_v2
                          </td>
                          <td className="p-3">Próprio (1ª parte)</td>
                          <td className="p-3">Necessário</td>
                          <td className="p-3">Persistente (local)</td>
                          <td className="p-3">
                            Armazena os produtos reais e quantidades da Lista de
                            Compras Inteligente sem obrigar a criação de conta.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-brand-navy">
                            economize_cookie_consent_v1
                          </td>
                          <td className="p-3">Próprio (1ª parte)</td>
                          <td className="p-3">Necessário</td>
                          <td className="p-3">12 meses</td>
                          <td className="p-3">
                            Registra a escolha do usuário no banner de cookies
                            (data/hora e categorias aceitas ou rejeitadas).
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-brand-navy">
                            economize_feedback_evaluated_v1
                          </td>
                          <td className="p-3">Próprio (1ª parte)</td>
                          <td className="p-3">Necessário (interface)</td>
                          <td className="p-3">Persistente (local)</td>
                          <td className="p-3">
                            Indica que o usuário já enviou sua 1ª avaliação para
                            reduzir o botão flutuante apenas ao ícone discreto.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-brand-navy">
                            sb-*-auth-token
                          </td>
                          <td className="p-3">Próprio / Supabase Auth</td>
                          <td className="p-3">Necessário (em login)</td>
                          <td className="p-3">Sessão autenticada</td>
                          <td className="p-3">
                            Mantém a sessão autenticada somente quando o usuário
                            decide entrar em <code>/conta</code>,{" "}
                            <code>/painel-parceiro</code> ou <code>/admin</code>.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-brand-navy">
                            cf_clearance / Turnstile
                          </td>
                          <td className="p-3">Terceiro (Cloudflare)</td>
                          <td className="p-3">Necessário (segurança)</td>
                          <td className="p-3">Sessão (até 30 min)</td>
                          <td className="p-3">
                            Protege formulários públicos contra ataques
                            automatizados de robôs e spam.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold text-brand-navy">
                            economize_ui_prefs_v1
                          </td>
                          <td className="p-3">Próprio (1ª parte)</td>
                          <td className="p-3">Funcional (Opt-in)</td>
                          <td className="p-3">180 dias</td>
                          <td className="p-3">
                            Gravado somente se o usuário aceitar cookies
                            funcionais para lembrar preferências visuais.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 3: BASES LEGAIS DA LGPD (LEI Nº 13.709/2018) */}
              {activeTab === "lgpd" && (
                <div className="space-y-3.5">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
                    <strong>Compromisso com sua Privacidade:</strong> O Economize+ opera
                    em conformidade com a LGPD (Lei nº 13.709/2018), com o Marco Civil da
                    Internet e com as diretrizes da ANPD. Seus dados e preferências
                    permanecem sob seu controle absoluto.
                  </div>

                  <h3 className="font-heading text-base font-extrabold text-brand-navy">
                    Enquadramento na Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
                  </h3>
                  <ul className="list-inside list-disc space-y-2 text-xs sm:text-sm">
                    <li>
                      <strong>
                        Princípio da Minimização / Necessidade (Art. 6º, III):
                      </strong>{" "}
                      A pesquisa de produtos, leitura de código de barras EAN e
                      comparação de cestas funcionam <strong>sem exigir</strong>{" "}
                      CPF, nome, telefone ou cadastro obrigatório.
                    </li>
                    <li>
                      <strong>
                        Execução de Procedimentos a Pedido do Titular (Art. 7º, V):
                      </strong>{" "}
                      Quando um consumidor cria uma conta opcional, envia uma
                      avaliação/sugestão ou quando um supermercado/entregador
                      preenche o formulário de parceria, os dados fornecidos são
                      tratados estritamente para atender àquela solicitação.
                    </li>
                    <li>
                      <strong>
                        Legítimo Interesse e Prevenção à Fraude (Art. 7º, IX e Art. 10):
                      </strong>{" "}
                      Limitação de taxa de requisições por IP em memória e
                      validação anti-bot são utilizadas exclusivamente para
                      impedir abuso automatizado e garantir a integridade dos
                      preços exibidos.
                    </li>
                    <li>
                      <strong>
                        Consentimento Livre e Inequívoco (Art. 7º, I):
                      </strong>{" "}
                      Qualquer recurso opcional (como o uso do GPS do aparelho
                      ou cookies funcionais não essenciais) só é ativado mediante
                      ação expressa do usuário, podendo ser revogado a qualquer
                      momento.
                    </li>
                    <li>
                      <strong>Operadores e Serviços de Infraestrutura:</strong>{" "}
                      Utilizamos <strong>Supabase Inc.</strong> (banco de dados
                      com isolamento Row Level Security e autenticação),{" "}
                      <strong>Vercel Inc.</strong> (hospedagem HTTPS),{" "}
                      <strong>Web3Forms</strong> (encaminhamento de mensagens de
                      avaliação para o Gmail oficial da equipe),{" "}
                      <strong>ViaCEP / BrasilAPI</strong> (consulta de endereço a
                      partir do CEP digitado) e{" "}
                      <strong>Open Food Facts Brasil</strong> (consulta pública
                      de produtos por código EAN sob licença ODbL).
                    </li>
                  </ul>
                </div>
              )}

              {/* ABA 4: DIREITOS DO TITULAR (ART. 18) E EXCLUSÃO IMEDIATA */}
              {activeTab === "direitos" && (
                <div className="space-y-4">
                  <h3 className="font-heading text-base font-extrabold text-brand-navy">
                    Seus Direitos previstos no Art. 18 da LGPD
                  </h3>
                  <p className="text-xs text-slate-600 sm:text-sm">
                    Você, como titular dos dados pessoais, pode solicitar a
                    qualquer momento e gratuitamente:
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {[
                      "I — Confirmação da existência de tratamento de dados em nossos registros.",
                      "II — Acesso integral aos dados que você tenha cadastrado em sua conta ou formulário.",
                      "III — Correção de dados incompletos, inexatos ou desatualizados.",
                      "IV — Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos.",
                      "VI — Eliminação dos dados pessoais tratados com o seu consentimento.",
                      "IX — Revogação do consentimento a qualquer momento (Art. 8º, § 5º).",
                    ].map((right) => (
                      <div
                        key={right}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-700"
                      >
                        {right}
                      </div>
                    ))}
                  </div>

                  {/* Ação Técnica Imediata de Limpeza Local */}
                  <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/70 p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="flex items-center gap-1.5 font-heading text-sm font-extrabold text-rose-900">
                          <ShieldAlert className="h-4 w-4 text-rose-600" />
                          Excluir Meus Dados Locais Deste Navegador Agora
                        </p>
                        <p className="mt-0.5 text-xs text-rose-800">
                          Remove imediatamente o CEP salvo, a Lista de Compras e
                          as preferências de cookies gravadas neste aparelho.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearAllLocalData}
                        className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-rose-700 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Limpar Dados Locais</span>
                      </button>
                    </div>
                    {clearedFeedback && (
                      <p className="mt-2 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-700">
                        {clearedFeedback}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-brand-blue/30 bg-brand-light/50 p-4 text-xs text-slate-700">
                    <p className="font-bold text-brand-navy">
                      Canal Direto de Privacidade e Atendimento ao Titular:
                    </p>
                    <p className="mt-1">
                      Para exercer qualquer direito previsto no Art. 18 da LGPD
                      (como exclusão de conta ou de solicitações enviadas), envie
                      um e-mail para{" "}
                      <a
                        href="mailto:empresaeconomizemais@gmail.com?subject=Solicita%C3%A7%C3%A3o%20LGPD%20-%20Economize%2B"
                        className="font-mono font-bold text-brand-navy underline"
                      >
                        empresaeconomizemais@gmail.com
                      </a>{" "}
                      (Sede operacional: Bertioga, SP — Brasil).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé de Ação do Modal */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-t border-slate-200 bg-slate-50 px-4 py-3.5 sm:px-6">
              <Link
                href="/institucional?aba=privacidade"
                onClick={() => setModalOpen(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-navy underline hover:text-brand-blue"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Abrir página completa da Política de Privacidade</span>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => saveConsent(false, false)}
                  className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100 active:scale-95"
                >
                  Rejeitar Opcionais (Apenas Necessários)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    saveConsent(functionalEnabled, analyticsEnabled)
                  }
                  className="min-h-[42px] rounded-xl bg-brand-navy px-4 py-2 text-xs font-extrabold text-white transition hover:bg-brand-blue active:scale-95"
                >
                  Salvar Minhas Preferências
                </button>
                <button
                  type="button"
                  onClick={() => saveConsent(true, true)}
                  className="min-h-[42px] rounded-xl bg-brand-green px-4 py-2 text-xs font-black text-brand-navy shadow-xs transition hover:brightness-95 active:scale-95"
                >
                  Aceitar Todos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
