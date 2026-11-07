"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bug,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Loader2,
  Mail,
  MessageSquareHeart,
  Send,
  Star,
  Store,
  X,
} from "lucide-react";
import { ECONOMIZE_ICONS } from "@/lib/icons";
import type { FeedbackCategory } from "@/types/domain";

export interface OpenFeedbackEventDetail {
  rating?: number;
  category?: FeedbackCategory;
}

export function triggerFeedbackModal(detail?: OpenFeedbackEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenFeedbackEventDetail>("economize:open-feedback", {
      detail,
    })
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "1 de 5 — Precisa melhorar muito",
  2: "2 de 5 — Pode melhorar",
  3: "3 de 5 — Bom, mas tenho sugestões",
  4: "4 de 5 — Muito bom!",
  5: "5 de 5 — Excelente!",
};

const CATEGORY_OPTIONS: Array<{
  id: FeedbackCategory;
  label: string;
  emoji: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "sugestao",
    label: "Sugestão de Melhoria",
    emoji: "💡",
    placeholder:
      "Conte qual funcionalidade, filtro ou melhoria deixaria o Economize+ ainda mais útil no seu dia a dia...",
    icon: Lightbulb,
  },
  {
    id: "bug",
    label: "Relatar um Bug",
    emoji: "🐛",
    placeholder:
      "Descreva o que aconteceu (ex.: botão que não abriu, leitor de código de barras ou erro na tela)...",
    icon: Bug,
  },
  {
    id: "indicar_mercado",
    label: "Indicar Mercado",
    emoji: "🏪",
    placeholder:
      "Qual supermercado ou atacadista do seu bairro em Bertioga/região você gostaria de ver no Economize+?",
    icon: Store,
  },
  {
    id: "duvida",
    label: "Dúvida / Elogio",
    emoji: "💬",
    placeholder:
      "Deixe sua dúvida, avaliação ou comentário para a nossa equipe...",
    icon: MessageSquareHeart,
  },
];

interface SubmitResult {
  protocolId: string;
  emailDispatched: boolean;
  targetEmail: string;
  submittedAtBr: string;
  mailtoUrl: string;
  gmailComposeUrl: string;
}

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>("sugestao");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const custom = event as CustomEvent<OpenFeedbackEventDetail | undefined>;
      if (
        custom.detail?.rating &&
        custom.detail.rating >= 1 &&
        custom.detail.rating <= 5
      ) {
        setRating(custom.detail.rating);
      }
      if (custom.detail?.category) {
        setCategory(custom.detail.category);
      }
      setErrorMsg(null);
      setSubmitResult(null);
      setIsOpen(true);
    };

    window.addEventListener("economize:open-feedback", handleOpen);
    return () => {
      window.removeEventListener("economize:open-feedback", handleOpen);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const activeCategoryMeta =
    CATEGORY_OPTIONS.find((item) => item.id === category) || CATEGORY_OPTIONS[0];
  const displayedRating = hoverRating ?? rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (message.trim().length < 5) {
      setErrorMsg(
        "Escreva pelo menos 5 caracteres contando sua sugestão, avaliação ou o bug encontrado."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          category,
          message: message.trim(),
          senderName: senderName.trim() || undefined,
          senderContact: senderContact.trim() || undefined,
          pagePath: pathname || "/",
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        protocolId?: string;
        emailDispatched?: boolean;
        targetEmail?: string;
        submittedAtBr?: string;
        mailtoUrl?: string;
        gmailComposeUrl?: string;
      };

      if (!res.ok) {
        setErrorMsg(data.error || "Não foi possível enviar sua avaliação agora.");
        return;
      }

      let dispatchedInBrowser = Boolean(data.emailDispatched);

      // Dispara direto do navegador via Web3Forms para empresaeconomizemais@gmail.com (evita bloqueio Cloudflare de servidor e envia em 1s sem abrir janela)
      const web3Key =
        process.env.NEXT_PUBLIC_WEB3FORMS_KEY?.trim() ||
        "237e2b79-5fde-4822-bc27-756e5a4e8f60";
      if (!dispatchedInBrowser && web3Key) {
        try {
          const stars = "⭐".repeat(rating);
          const w3Res = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              access_key: web3Key,
              subject: `[Economize+ Feedback] ${activeCategoryMeta.emoji} ${activeCategoryMeta.label} — ${stars} (${rating}/5)`,
              from_name: senderName.trim() || "Avaliação Economize+",
              Protocolo: data.protocolId || "ECO-OK",
              Categoria: `${activeCategoryMeta.emoji} ${activeCategoryMeta.label}`,
              Avaliacao: `${stars} (${rating} de 5 estrelas)`,
              Nome: senderName.trim() || "Não informado",
              Contato: senderContact.trim() || "Não informado",
              Pagina_Origem: `https://economize-nine.vercel.app${pathname || "/"}`,
              Data_Hora: data.submittedAtBr || new Date().toLocaleString("pt-BR"),
              Mensagem: message.trim(),
            }),
          });
          const w3Json = (await w3Res.json().catch(() => null)) as {
            success?: boolean;
          } | null;
          if (w3Res.ok && w3Json?.success !== false) {
            dispatchedInBrowser = true;
          }
        } catch {
          // Segue para fallback de aplicativo de e-mail caso falhe
        }
      }

      const finalMailto =
        data.mailtoUrl || "mailto:empresaeconomizemais@gmail.com";
      const finalGmailUrl =
        data.gmailComposeUrl ||
        "https://mail.google.com/mail/?view=cm&fs=1&to=empresaeconomizemais@gmail.com";

      // Caso o servidor gratuito FormSubmit esteja fora do ar (Erro 522) e ainda não haja chave Web3Forms/Resend,
      // abre automaticamente o e-mail já preenchido no celular/PC para garantir que chegue 100% no empresaeconomizemais@gmail.com!
      if (!dispatchedInBrowser && typeof window !== "undefined") {
        window.location.href = finalMailto;
      }

      setSubmitResult({
        protocolId: data.protocolId || "ECO-OK",
        emailDispatched: dispatchedInBrowser,
        targetEmail: data.targetEmail || "empresaeconomizemais@gmail.com",
        submittedAtBr: data.submittedAtBr || "agora",
        mailtoUrl: finalMailto,
        gmailComposeUrl: finalGmailUrl,
      });
      setMessage("");
    } catch {
      setErrorMsg(
        "Erro de conexão ao enviar. Verifique sua internet ou tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* POSIÇÃO 3: Pílula Flutuante Discreta no Canto Inferior Direito */}
      <div
        className="fixed right-3 bottom-20 z-40 md:right-5 md:bottom-5"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setSubmitResult(null);
            setIsOpen(true);
          }}
          aria-label="Avaliar o aplicativo, enviar sugestão ou relatar bug"
          className="group inline-flex min-h-[46px] items-center gap-2.5 rounded-full border-2 border-brand-yellow bg-brand-navy px-3.5 py-1.5 text-xs font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-blue active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow sm:px-4 sm:py-2 sm:text-sm"
        >
          <img
            src={ECONOMIZE_ICONS["avaliacao-feedback"].src}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full border border-white bg-white object-cover shadow-2xs sm:h-8 sm:w-8"
          />
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" />
            <span>Avaliar / Relatar Bug</span>
          </span>
        </button>
      </div>

      {/* MODAL DE AVALIAÇÃO, SUGESTÕES E BUGS */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-xs sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border-2 border-brand-blue bg-white shadow-2xl">
            {/* Faixa Tricolor Superior */}
            <div className="h-2 w-full bg-gradient-to-r from-brand-blue via-brand-green to-brand-yellow" />

            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-navy to-[#094D8A] px-5 py-4 text-white sm:px-6">
              <div className="flex items-center gap-3.5">
                <img
                  src={ECONOMIZE_ICONS["avaliacao-feedback"].src}
                  alt={ECONOMIZE_ICONS["avaliacao-feedback"].alt}
                  className="h-13 w-13 shrink-0 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-md sm:h-14 sm:w-14"
                />
                <div>
                  <span className="inline-block rounded-full bg-brand-green px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-navy">
                    Fale com a Equipe
                  </span>
                  <h2
                    id="feedback-modal-title"
                    className="mt-0.5 font-heading text-base font-extrabold leading-tight text-white sm:text-lg"
                  >
                    Avalie o App, Dê Sugestões ou Relate Bugs
                  </h2>
                  <p className="text-xs text-brand-light">
                    Sua opinião ajuda a melhorar o Economize+ na sua região
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar janela de avaliação"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-5 sm:p-6">
              {submitResult ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>

                  <div>
                    <span className="inline-block rounded-full bg-brand-light px-3 py-1 font-mono text-xs font-bold text-brand-navy">
                      Protocolo {submitResult.protocolId}
                    </span>
                    <h3 className="mt-2 font-heading text-xl font-extrabold text-brand-navy">
                      Avaliação registrada!
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {submitResult.emailDispatched ? (
                        <>
                          Sua mensagem foi enviada automaticamente em{" "}
                          <strong>{submitResult.submittedAtBr}</strong> para{" "}
                          <strong className="font-mono text-brand-navy">
                            {submitResult.targetEmail}
                          </strong>
                          .
                        </>
                      ) : (
                        <>
                          Abrimos seu aplicativo de e-mail com a avaliação já
                          preenchida para{" "}
                          <strong className="font-mono text-brand-navy">
                            {submitResult.targetEmail}
                          </strong>
                          . Basta tocar no botão de enviar no seu Gmail!
                        </>
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-600">
                    <p className="font-bold text-brand-navy">
                      Enviar ou anexar print pelo Gmail:
                    </p>
                    <p className="mt-1">
                      Se a janela do seu e-mail não abriu sozinha ou se você
                      quiser anexar um print da tela, clique em uma das opções
                      abaixo:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={submitResult.mailtoUrl}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-blue active:scale-95"
                      >
                        <Mail className="h-4 w-4 text-brand-yellow" />
                        <span>Abrir no App do Gmail / E-mail</span>
                      </a>
                      <a
                        href={submitResult.gmailComposeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-brand-navy transition hover:bg-slate-100 active:scale-95"
                      >
                        <span>Abrir Gmail no Navegador</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-green px-6 py-2.5 text-sm font-extrabold text-brand-navy shadow-xs transition hover:brightness-95 active:scale-95"
                    >
                      Concluir e Voltar ao Site
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 1. Seletor de Estrelas (1 a 5) */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      1. Qual sua nota para o Economize+ hoje?
                    </label>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-2xl border border-brand-blue/25 bg-brand-surface px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const active = starValue <= displayedRating;
                          return (
                            <button
                              key={starValue}
                              type="button"
                              onClick={() => setRating(starValue)}
                              onMouseEnter={() => setHoverRating(starValue)}
                              onMouseLeave={() => setHoverRating(null)}
                              aria-label={`Avaliar com ${starValue} de 5 estrelas`}
                              className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition active:scale-95 ${
                                active
                                  ? "border-brand-yellow bg-white shadow-xs"
                                  : "border-slate-200 bg-white/60 opacity-55 hover:opacity-90"
                              }`}
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  active
                                    ? "fill-brand-yellow text-brand-yellow"
                                    : "text-slate-400"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="ml-1 text-xs font-extrabold text-brand-navy sm:text-sm">
                        {RATING_LABELS[displayedRating]}
                      </span>
                    </div>
                  </div>

                  {/* 2. Seletor de Categoria */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      2. O que você deseja enviar?
                    </label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {CATEGORY_OPTIONS.map((item) => {
                        const isSelected = category === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCategory(item.id)}
                            className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl border-2 px-2 py-2 text-center text-xs font-extrabold transition active:scale-95 ${
                              isSelected
                                ? "border-brand-blue bg-brand-light text-brand-navy shadow-2xs"
                                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                            }`}
                          >
                            <span className="text-sm">{item.emoji}</span>
                            <span className="mt-0.5 leading-tight">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Mensagem */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="feedback-message-input"
                        className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600"
                      >
                        3. Conte para nós (detalhes da ideia, mercado ou erro)
                      </label>
                      <span className="font-mono text-[11px] text-slate-400">
                        {message.length}/1500
                      </span>
                    </div>
                    <textarea
                      id="feedback-message-input"
                      rows={3}
                      maxLength={1500}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={activeCategoryMeta.placeholder}
                      className="mt-1.5 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* 4. Nome e Contato Opcionais */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      4. Seus dados (opcional — se quiser retorno da nossa equipe)
                    </label>
                    <div className="mt-1.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <input
                        type="text"
                        maxLength={120}
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="👤 Seu nome (opcional)"
                        className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none sm:text-sm"
                      />
                      <input
                        type="text"
                        maxLength={160}
                        value={senderContact}
                        onChange={(e) => setSenderContact(e.target.value)}
                        placeholder="📧 Seu e-mail ou WhatsApp (opcional)"
                        className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none sm:text-sm"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                      {errorMsg}
                    </div>
                  )}

                  {/* Rodapé Limpo para o Consumidor + Botão Enviar */}
                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-[11px] leading-snug text-slate-500">
                      <Mail className="h-4 w-4 shrink-0 text-brand-blue" />
                      <span>
                        Atendimento oficial:{" "}
                        <strong className="font-mono text-brand-navy">
                          empresaeconomizemais@gmail.com
                        </strong>
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand-green px-5 py-3 text-sm font-black text-brand-navy shadow-md transition hover:brightness-95 active:scale-95 disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Enviar Avaliação Agora</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
