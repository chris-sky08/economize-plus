"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  HelpCircle,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

function InstitucionalContent() {
  const searchParams = useSearchParams();
  const initialTab =
    (searchParams.get("aba") as
      | "ajuda"
      | "privacidade"
      | "termos"
      | "contato") || "ajuda";

  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<
    "ajuda" | "privacidade" | "termos" | "contato"
  >(initialTab);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Mensagem enviada! Nossa equipe responderá em breve.");
    setContactName("");
    setContactEmail("");
    setContactMsg("");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8">
        <span className="rounded-md bg-brand-light px-2.5 py-0.5 text-xs font-bold text-brand-blue">
          Transparência, Confiança e LGPD
        </span>
        <h1 className="mt-2 font-heading text-2xl font-extrabold text-brand-navy sm:text-3xl">
          Central Institucional Economize+
        </h1>

        <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("ajuda")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
              activeTab === "ajuda"
                ? "bg-brand-blue text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Ajuda & Perguntas Frequentes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("privacidade")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
              activeTab === "privacidade"
                ? "bg-brand-blue text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Política de Privacidade (LGPD)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("termos")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
              activeTab === "termos"
                ? "bg-brand-blue text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <FileText className="h-4 w-4" />
            Termos de Uso
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contato")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
              activeTab === "contato"
                ? "bg-brand-blue text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Mail className="h-4 w-4" />
            Fale Conosco
          </button>
        </div>

        {/* ABA AJUDA */}
        {activeTab === "ajuda" && (
          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-4">
              <h2 className="font-heading text-base font-bold text-brand-navy">
                1. Os preços exibidos na plataforma são garantidos na loja?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Os preços são informados pelos mercados parceiros (ou simulados
                no modo demonstrativo deste MVP) e possuem data e hora da última
                atualização visíveis em cada item. Valores e estoques podem
                sofrer variações na loja física.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <h2 className="font-heading text-base font-bold text-brand-navy">
                2. Como funciona o cálculo da Lista de Compras Inteligente?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Multiplicamos a quantidade escolhida pelo preço disponível em
                cada mercado. Caso um mercado não tenha preço cadastrado ou
                esteja sem estoque para algum item, ele é sinalizado como{" "}
                <strong>Cesta Parcial</strong> e o item faltante nunca é tratado
                como se custasse R$ 0,00.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <h2 className="font-heading text-base font-bold text-brand-navy">
                3. Preciso criar conta para pesquisar preços?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Não! A busca e a comparação de preços são abertas para todos os
                consumidores. O login é exigido apenas para salvar listas na
                nuvem ou administrar perfis de parceiros.
              </p>
            </div>
          </div>
        )}

        {/* ABA PRIVACIDADE (LGPD) */}
        {activeTab === "privacidade" && (
          <div className="mt-6 space-y-4 text-xs leading-relaxed text-slate-700 sm:text-sm">
            <h2 className="font-heading text-lg font-bold text-brand-navy">
              Política de Privacidade e Proteção de Dados (Lei nº 13.709/2018 —
              LGPD)
            </h2>
            <p>
              O <strong>Economize+</strong> respeita a sua privacidade e atua em
              conformidade com a Lei Geral de Proteção de Dados (LGPD) e o Marco
              Civil da Internet (Lei nº 12.965/2014).
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>Coleta Mínima de Dados:</strong> Coletamos apenas os
                dados estritamente necessários para autenticação de conta (nome,
                e-mail) ou cadastro comercial de mercados e entregadores
                parceiros.
              </li>
              <li>
                <strong>Uso da Localização:</strong> A seleção de bairro ou CEP
                pode ser feita manualmente a qualquer momento. A localização do
                dispositivo é 100% opcional, solicitada apenas mediante
                consentimento prévio, e não armazenamos histórico de
                rastreamento GPS preciso de consumidores.
              </li>
              <li>
                <strong>Direitos do Titular:</strong> O usuário pode consultar,
                corrigir ou excluir sua conta e listas salvas a qualquer
                momento.
              </li>
            </ul>
          </div>
        )}

        {/* ABA TERMOS DE USO */}
        {activeTab === "termos" && (
          <div className="mt-6 space-y-4 text-xs leading-relaxed text-slate-700 sm:text-sm">
            <h2 className="font-heading text-lg font-bold text-brand-navy">
              Termos e Condições de Uso da Plataforma Economize+
            </h2>
            <p>
              O <strong>Economize+</strong> atua como ferramenta informativa de
              comparação de preços e divulgação de mercados de bairro.
            </p>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>Caráter Informativo e Estimativo:</strong> As cotações e
                comparações de listas são estimativas baseadas na última
                atualização registrada e não constituem reserva de estoque nem
                promessa de economia garantida.
              </li>
              <li>
                <strong>Planos para Comerciantes:</strong> Os planos Básico e
                Premium oferecem recursos de presença digital e destaque
                publicitário devidamente identificado, sem garantia de aumento
                de faturamento ou vendas.
              </li>
              <li>
                <strong>Entregas:</strong> Qualquer funcionalidade de entrega
                está condicionada à disponibilidade operacional real e
                integração confirmada na região.
              </li>
            </ul>
          </div>
        )}

        {/* ABA CONTATO */}
        {activeTab === "contato" && (
          <form onSubmit={handleContact} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Seu E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Mensagem, Dúvida ou Sugestão *
              </label>
              <textarea
                rows={4}
                required
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-3.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-xs font-bold text-white hover:bg-brand-navy"
            >
              <Send className="h-4 w-4" />
              Enviar Mensagem
            </button>
          </form>
        )}
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
