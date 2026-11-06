"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  LayoutDashboard,
  Megaphone,
  QrCode,
  ShieldCheck,
  Store,
  Tag,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import TurnstileWidget from "@/components/TurnstileWidget";
import MarketOnboardingGuide from "@/components/MarketOnboardingGuide";

export default function SejaParceiroPage() {
  const { submitPartnerApplication } = useApp();

  const [marketName, setMarketName] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [desiredPlan, setDesiredPlan] = useState<"basico" | "premium">(
    "basico"
  );
  const [turnstileToken, setTurnstileToken] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleCepChange = async (value: string) => {
    setZipCode(value);
    const digits = value.replace(/\D/g, "");
    if (digits.length === 8) {
      try {
        const res = await fetch(`/api/cep/${digits}`);
        if (res.ok) {
          const data = (await res.json()) as {
            city?: string;
            neighborhood?: string;
            street?: string;
          };
          if (data.city && !city) setCity(data.city);
          if (data.neighborhood && !neighborhood)
            setNeighborhood(data.neighborhood);
          if (data.street && !address) setAddress(data.street);
        }
      } catch {
        // preenchimento manual continua disponível
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!marketName.trim())
      newErrors.marketName = "Informe o nome do estabelecimento.";
    if (!responsibleName.trim())
      newErrors.responsibleName = "Informe o nome do responsável.";
    if (!email.includes("@")) newErrors.email = "Informe um e-mail válido.";
    if (phone.trim().length < 8)
      newErrors.phone = "Informe um telefone válido com DDD.";
    if (!address.trim()) newErrors.address = "Informe o endereço completo.";
    if (!neighborhood.trim()) newErrors.neighborhood = "Informe o bairro.";
    if (!city.trim()) newErrors.city = "Informe a cidade.";
    if (!zipCode.trim()) newErrors.zipCode = "Informe o CEP.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await submitPartnerApplication(
      {
        marketName,
        responsibleName,
        email,
        phone,
        address,
        neighborhood,
        city,
        zipCode,
        desiredPlan,
      },
      turnstileToken
    );
    if (result.ok) {
      setSubmitted(true);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero para Comerciantes */}
      <section className="rounded-3xl bg-brand-navy p-8 text-white shadow-md sm:p-12">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow px-3.5 py-1 text-xs font-extrabold text-brand-navy">
              <Building2 className="h-3.5 w-3.5" />
              Parceria para Mercados Locais
            </span>
            <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight sm:text-4xl">
              Mais visibilidade para o seu mercado.{" "}
              <span className="text-brand-yellow">
                Transparência para os clientes da região.
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Apresente seu estabelecimento para moradores próximos, mantenha
              seu catálogo de preços e encartes atualizado e apareça nas buscas
              e listas de compras da sua região.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
            <Link
              href="/conta"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-green px-6 py-4 text-xs font-extrabold text-brand-navy shadow-md transition hover:opacity-90 sm:w-auto sm:text-sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              Acessar Conta de Parceiro
            </Link>
            <Link
              href="/divulgacao"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white transition hover:bg-white/20 sm:w-auto"
            >
              <QrCode className="h-4 w-4 text-brand-yellow" />
              Gerar QR Code de Divulgação
            </Link>
          </div>
        </div>
      </section>

      {/* Guia Completo: Como os Mercados Cadastram e Atualizam os Preços */}
      <div className="mt-10">
        <MarketOnboardingGuide showPartnerCta={false} />
      </div>

      {/* Benefícios Claros e Sem Promessas Enganosas */}
      <section className="mt-12">
        <h2 className="text-center font-heading text-2xl font-bold text-brand-navy">
          Por que cadastrar seu mercado no Economize+?
        </h2>
        <p className="mx-auto mt-1 max-w-2xl text-center text-xs text-slate-500 sm:text-sm">
          Transparência comercial: oferecemos ferramentas de presença digital e
          divulgação local, sem promessas irreais de vendas garantidas.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Store className="h-6 w-6 text-brand-navy" />,
              title: "Presença Digital no Bairro",
              desc: "Página exclusiva com endereço, horário de funcionamento, telefone e catálogo atualizado.",
            },
            {
              icon: <Tag className="h-6 w-6 text-brand-blue" />,
              title: "Divulgação de Produtos e Ofertas",
              desc: "Importe preços por planilha CSV ou revise ofertas extraídas de encartes.",
            },
            {
              icon: <Megaphone className="h-6 w-6 text-brand-navy" />,
              title: "Alcance Regional por Raio/CEP",
              desc: "Possibilidade de ser encontrado por moradores que pesquisam mercados próximos.",
            },
            {
              icon: <BarChart3 className="h-6 w-6 text-brand-blue" />,
              title: "Rastreabilidade e Histórico",
              desc: "Cada preço exibe a fonte, o histórico de variações e o horário real da última atualização.",
            },
          ].map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light">
                {b.icon}
              </div>
              <h3 className="mt-3 font-heading text-base font-bold text-brand-navy">
                {b.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Estrutura de Planos Básico e Premium */}
      <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-navy">
            Entrada Local
          </span>
          <h3 className="mt-3 font-heading text-2xl font-extrabold text-brand-navy">
            Plano Básico
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Para mercados de bairro iniciarem sua presença digital e publicarem
            seu catálogo de preços.
          </p>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">
            Condição comercial: <strong>Sob consulta comercial</strong>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Perfil completo com endereço, horário e contato
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Importação de preços via CSV e cadastro por EAN
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Participação no comparador de listas de compras
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Alertas automáticos de preços com mais de 7 dias
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border-2 border-brand-navy bg-white p-6 shadow-sm">
          <span className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-extrabold text-brand-navy">
            Visibilidade e Recursos Extras
          </span>
          <h3 className="mt-3 font-heading text-2xl font-extrabold text-brand-navy">
            Plano Premium
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Para mercados que desejam leitura assistida de encartes e destaques
            publicitários identificados.
          </p>
          <div className="mt-4 rounded-xl bg-brand-light/70 p-3 text-xs font-semibold text-brand-navy">
            Condição comercial: <strong>Sob proposta comercial</strong>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Todos os recursos do Plano Básico
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Destaques patrocinados claramente identificados como publicidade
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Extração assistida de ofertas de encartes com revisão prévia
            </li>
          </ul>
          <p className="mt-4 text-[11px] text-slate-500">
            * Nota de transparência: O Plano Premium oferece ferramentas de
            visibilidade, sem promessa de volume garantido de vendas.
          </p>
        </div>
      </section>

      {/* Formulário de Cadastro do Mercado Parceiro */}
      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8">
        <div className="max-w-2xl">
          <span className="rounded-md bg-brand-light px-2.5 py-0.5 text-xs font-bold text-brand-navy">
            Solicitação de Credenciamento
          </span>
          <h2 className="mt-2 font-heading text-2xl font-bold text-brand-navy">
            Solicitar Cadastro de Mercado Parceiro
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Preencha os dados reais do seu estabelecimento para verificação de
            CNPJ e endereço pela equipe do Economize+.
          </p>
        </div>

        {submitted ? (
          <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-6">
            <h3 className="font-heading text-lg font-bold text-emerald-800">
              Solicitação registrada com sucesso!
            </h3>
            <p className="mt-1 text-xs text-slate-700">
              Os dados do estabelecimento <strong>{marketName}</strong> foram
              enviados para verificação cadastral. Após a aprovação, sua conta
              receberá o vínculo em <code>public.market_members</code> para
              acessar o Painel do Parceiro.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700"
              >
                Enviar outra solicitação
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label
                htmlFor="parceiro-nome"
                className="block text-xs font-bold text-slate-700"
              >
                Nome do Estabelecimento *
              </label>
              <input
                id="parceiro-nome"
                type="text"
                value={marketName}
                onChange={(e) => setMarketName(e.target.value)}
                placeholder="Razão social ou nome fantasia"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
              />
              {errors.marketName && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errors.marketName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="parceiro-resp"
                className="block text-xs font-bold text-slate-700"
              >
                Nome do Responsável *
              </label>
              <input
                id="parceiro-resp"
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="Nome completo do proprietário ou gerente"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
              />
              {errors.responsibleName && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errors.responsibleName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="parceiro-email"
                className="block text-xs font-bold text-slate-700"
              >
                E-mail Comercial *
              </label>
              <input
                id="parceiro-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Informe o e-mail corporativo"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
              />
              {errors.email && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="parceiro-tel"
                className="block text-xs font-bold text-slate-700"
              >
                Telefone / WhatsApp Comercial *
              </label>
              <input
                id="parceiro-tel"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="DDD + Número"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
              />
              {errors.phone && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="parceiro-cep"
                  className="block text-xs font-bold text-slate-700"
                >
                  CEP *
                </label>
                <input
                  id="parceiro-cep"
                  type="text"
                  value={zipCode}
                  onChange={(e) => void handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
                />
                {errors.zipCode && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.zipCode}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="parceiro-cidade"
                  className="block text-xs font-bold text-slate-700"
                >
                  Cidade *
                </label>
                <input
                  id="parceiro-cidade"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
                />
                {errors.city && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.city}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="parceiro-bairro"
                className="block text-xs font-bold text-slate-700"
              >
                Bairro *
              </label>
              <input
                id="parceiro-bairro"
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Bairro do estabelecimento"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
              />
              {errors.neighborhood && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errors.neighborhood}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="parceiro-end"
                className="block text-xs font-bold text-slate-700"
              >
                Endereço Completo *
              </label>
              <input
                id="parceiro-end"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Logradouro, número e complemento"
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-brand-blue focus:outline-none"
              />
              {errors.address && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {errors.address}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                Plano de Interesse
              </label>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setDesiredPlan("basico")}
                  className={`min-h-[44px] rounded-xl border p-3 text-left text-xs transition ${
                    desiredPlan === "basico"
                      ? "border-brand-navy bg-brand-light/70 font-bold text-brand-navy"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Plano Básico — Presença digital e publicação de catálogo
                </button>
                <button
                  type="button"
                  onClick={() => setDesiredPlan("premium")}
                  className={`min-h-[44px] rounded-xl border p-3 text-left text-xs transition ${
                    desiredPlan === "premium"
                      ? "border-brand-navy bg-brand-light/70 font-bold text-brand-navy"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Plano Premium — Leitura de encartes e destaques patrocinados
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <TurnstileWidget onVerify={setTurnstileToken} />
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Dados tratados conforme a Política de Privacidade.
              </span>
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-brand-navy px-6 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-brand-blue"
              >
                Enviar Cadastro de Mercado Parceiro
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
