"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Cookie, Info, X } from "lucide-react";

const COOKIE_CONSENT_STORAGE_KEY = "economize_cookie_consent_v1";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (!saved) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      window.localStorage.setItem(
        COOKIE_CONSENT_STORAGE_KEY,
        JSON.stringify({
          accepted: true,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {
      // Ignora erro de escrita em modo privado restrito
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies e privacidade"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)",
      }}
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border-2 border-brand-blue/40 bg-brand-navy text-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-brand-blue via-brand-green to-brand-yellow" />

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-yellow">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="text-xs leading-relaxed text-slate-200 sm:text-sm">
                <p className="font-heading text-sm font-extrabold text-white sm:text-base">
                  Cookies e Privacidade no Economize+
                </p>
                <p className="mt-0.5">
                  Usamos cookies essenciais e armazenamento no seu navegador para
                  guardar sua lista de compras, seu CEP de pesquisa e manter sua
                  conta conectada. Veja como tratamos seus dados de acordo com a
                  Lei Geral de Proteção de Dados (LGPD) em nossa{" "}
                  <Link
                    href="/institucional?aba=privacidade"
                    className="font-bold text-brand-yellow underline hover:text-white"
                  >
                    Política de Privacidade
                  </Link>{" "}
                  e{" "}
                  <Link
                    href="/institucional?aba=termos"
                    className="font-bold text-brand-yellow underline hover:text-white"
                  >
                    Termos de Uso
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95"
              >
                <Info className="h-3.5 w-3.5 text-brand-yellow" />
                <span>{showDetails ? "Ocultar detalhes" : "Ver detalhes"}</span>
              </button>

              <button
                type="button"
                onClick={handleAccept}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-green px-5 py-2.5 text-xs font-black text-brand-navy shadow-md transition hover:brightness-95 active:scale-95 sm:text-sm"
              >
                <Check className="h-4 w-4" />
                <span>Entendi e Aceitar</span>
              </button>

              <button
                type="button"
                onClick={handleAccept}
                aria-label="Fechar aviso de cookies"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/15 pt-4 text-xs text-slate-200 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="font-bold text-brand-yellow">
                  1. Cookies e Dados Essenciais
                </p>
                <p className="mt-1 text-slate-300">
                  Necessários para salvar os itens da sua Lista Inteligente, seu
                  CEP/raio de distância no seu próprio aparelho e sua sessão de
                  login.
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="font-bold text-brand-green">
                  2. Transparência e LGPD
                </p>
                <p className="mt-1 text-slate-300">
                  A consulta de preços não exige cadastro. Dados informados em
                  formulários de contato, avaliação ou parceria são usados
                  exclusivamente para atendimento da solicitação.
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-3">
                <p className="font-bold text-brand-light">
                  3. Seus Direitos e Contato
                </p>
                <p className="mt-1 text-slate-300">
                  Você pode limpar os dados locais a qualquer momento ou falar
                  com nossa equipe pelo e-mail{" "}
                  <span className="font-mono text-white">
                    empresaeconomizemais@gmail.com
                  </span>
                  .
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
