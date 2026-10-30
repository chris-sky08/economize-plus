"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const ORDER_STATES = [
  {
    id: "aguardando_confirmacao",
    label: "1. Aguardando Confirmação",
    desc: "O mercado parceiro recebe a solicitação e confirma estoque real.",
  },
  {
    id: "preparando",
    label: "2. Preparando Pedido",
    desc: "Separação e conferência dos itens na loja física.",
  },
  {
    id: "aguardando_coleta",
    label: "3. Aguardando Coleta",
    desc: "Atribuição de entregador parceiro aprovado na região.",
  },
  {
    id: "em_entrega",
    label: "4. Em Entrega",
    desc: "Deslocamento do entregador até o endereço do consumidor.",
  },
  {
    id: "entregue",
    label: "5. Entregue",
    desc: "Confirmação de recebimento e registro no histórico.",
  },
] as const;

export default function EntregasPage() {
  const { submitCourierApplication, courierApplications } = useApp();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState<
    "bicicleta" | "moto" | "carro" | "utilitario"
  >("moto");
  const [neighborhoods, setNeighborhoods] = useState(
    "Vila Mariana, Saúde, Ipiranga"
  );
  const [submitted, setSubmitted] = useState(false);

  const [simulatedStateIdx, setSimulatedStateIdx] = useState(0);

  const handleCourierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.includes("@") || !phone.trim()) return;

    await submitCourierApplication({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      vehicleType,
      serviceNeighborhoods: neighborhoods
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Aviso Claro de Operação Futura */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-2xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
          <div>
            <h1 className="font-heading text-lg font-extrabold">
              Recurso em Preparação Operacional — Entregas ainda não ativas
            </h1>
            <p className="mt-1 text-xs leading-relaxed sm:text-sm">
              No MVP atual do <strong>Economize+</strong>, a rede de entregas
              ainda não realiza pedidos nem cobranças reais. Esta área apresenta
              a arquitetura técnica já preparada no banco de dados (Supabase)
              para futura integração com mercados e entregadores parceiros.
            </p>
          </div>
        </div>
      </div>

      {/* Arquitetura de Estados do Pedido (Modo Demonstrativo) */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-md bg-brand-light px-2.5 py-0.5 text-xs font-bold text-brand-blue">
              Arquitetura do Fluxo de Entrega (Simulação Técnica)
            </span>
            <h2 className="mt-1 font-heading text-xl font-bold text-brand-navy sm:text-2xl">
              Etapas planejadas para acompanhamento de pedidos
            </h2>
            <p className="text-xs text-slate-500">
              Clique nas etapas abaixo para inspecionar os estados estruturados
              na tabela <code>delivery_orders</code>.
            </p>
          </div>

          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Taxas e prazos reais: Definidos apenas após ativação operacional
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
          {ORDER_STATES.map((st, idx) => {
            const isActive = idx === simulatedStateIdx;
            const isDone = idx < simulatedStateIdx;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSimulatedStateIdx(idx)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-2 border-brand-blue bg-brand-light/70 shadow-xs"
                    : isDone
                      ? "border-brand-green/40 bg-emerald-50/40"
                      : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-navy">
                    {st.label}
                  </span>
                  {isDone && (
                    <CheckCircle2 className="h-4 w-4 text-brand-green" />
                  )}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                  {st.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-brand-blue" />
            <span>
              Estado inspecionado:{" "}
              <strong className="text-brand-navy">
                {ORDER_STATES[simulatedStateIdx].label}
              </strong>{" "}
              (Apenas demonstração visual da arquitetura)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span>Nenhum pedido real está em andamento.</span>
          </div>
        </div>
      </section>

      {/* Pré-Cadastro de Entregadores Parceiros */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8 lg:col-span-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow px-3 py-1 text-xs font-extrabold text-brand-navy">
            <Bike className="h-3.5 w-3.5" />
            Pré-Cadastro de Entregadores Parceiros
          </span>
          <h2 className="mt-3 font-heading text-2xl font-bold text-brand-navy">
            Lista de Interesse para Futura Operação Local
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Cadastre seu veículo e bairros de atuação para ser avisado quando a
            operação de entregas for ativada na sua região.
          </p>

          {submitted ? (
            <div className="mt-6 rounded-2xl border border-brand-green/30 bg-emerald-50 p-6">
              <h3 className="font-heading text-base font-bold text-brand-green">
                Pré-cadastro registrado com sucesso!
              </h3>
              <p className="mt-1 text-xs text-slate-700">
                Seus dados foram salvos como interesse para futura operação.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white"
              >
                Novo Pré-Cadastro
              </button>
            </div>
          ) : (
            <form onSubmit={handleCourierSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Tipo de Veículo *
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) =>
                      setVehicleType(
                        e.target.value as
                          | "bicicleta"
                          | "moto"
                          | "carro"
                          | "utilitario"
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
                  >
                    <option value="bicicleta">Bicicleta / Elétrica</option>
                    <option value="moto">Motocicleta</option>
                    <option value="carro">Carro de Passeio</option>
                    <option value="utilitario">Utilitário / Fiorino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Bairros de Atendimento Preferenciais (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={neighborhoods}
                  onChange={(e) => setNeighborhoods(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-xs font-bold text-white hover:bg-brand-navy sm:text-sm"
              >
                <Truck className="h-4 w-4" />
                Registrar Pré-Cadastro de Entregador
              </button>
            </form>
          )}
        </div>

        {/* Requisitos para Ativação Futura */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h3 className="font-heading text-lg font-bold text-brand-navy">
              Quando a entrega será ativada?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Seguindo nossas diretrizes de transparência e confiança, o módulo
              de entregas somente será habilitado para pedidos reais quando
              estiverem operacionais:
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                <span>
                  Validação documental e aprovação de entregadores parceiros.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                <span>
                  Definição real de raio de cobertura, taxas por região e tempo
                  estimado confirmado pelo mercado.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                <span>
                  Integração operacional de estoque e confirmação em tempo real
                  na loja física.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h3 className="font-heading text-sm font-bold text-brand-navy">
              Pré-cadastros em análise ({courierApplications.length})
            </h3>
            <div className="mt-3 space-y-2">
              {courierApplications.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700"
                >
                  <div className="flex items-center justify-between font-bold text-brand-navy">
                    <span>{c.fullName}</span>
                    <span className="rounded-md bg-brand-light px-2 py-0.5 text-[10px] text-brand-blue uppercase">
                      {c.vehicleType}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Regiões: {c.serviceNeighborhoods.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
