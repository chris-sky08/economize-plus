"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CloudUpload,
  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  ShoppingBasket,
  User,
  UserPlus,
} from "lucide-react";
import { useApp, UserRole } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";

export default function ContaPage() {
  const {
    user,
    setAuthUser,
    loginDemoRole,
    logoutUser,
    shoppingList,
    saveListToSupabase,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<"login" | "cadastro" | "recuperar">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("consumidor");
  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      if (mode === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setFeedback({
          type: "success",
          text: "Instruções de redefinição de senha enviadas para o seu e-mail (via Supabase Auth).",
        });
      } else if (mode === "cadastro") {
        if (!lgpdConsent) {
          setFeedback({
            type: "error",
            text: "É necessário concordar com a Política de Privacidade (LGPD) para criar sua conta.",
          });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || "Usuário Economize+",
              role,
            },
          },
        });
        if (error) throw error;
        if (data.user) {
          setAuthUser({
            id: data.user.id,
            name: name || email.split("@")[0],
            email,
            role,
            marketId: "mercado-a",
            isDemoAuth: false,
          });
          showToast("Conta criada com sucesso no Supabase Auth!");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setAuthUser({
            id: data.user.id,
            name:
              data.user.user_metadata?.full_name ||
              data.user.email?.split("@")[0] ||
              "Usuário",
            email: data.user.email || email,
            role: (data.user.user_metadata?.role as UserRole) || "consumidor",
            marketId: "mercado-a",
            isDemoAuth: false,
          });
          showToast("Login realizado com sucesso via Supabase!");
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Não foi possível autenticar. Verifique suas credenciais ou use o acesso rápido demonstrativo.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {user ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue text-white">
                <User className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-light px-3 py-0.5 text-xs font-bold text-brand-blue uppercase">
                    Perfil: {user.role}
                  </span>
                  {user.isDemoAuth ? (
                    <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-900">
                      Sessão Demonstrativa
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-brand-green">
                      Autenticado via Supabase
                    </span>
                  )}
                </div>
                <h1 className="mt-1 font-heading text-2xl font-extrabold text-brand-navy">
                  {user.name}
                </h1>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={logoutUser}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h2 className="flex items-center gap-2 font-heading text-base font-bold text-brand-navy">
                <ShoppingBasket className="h-5 w-5 text-brand-green" />
                Sua Lista de Compras Salva
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Você possui <strong>{shoppingList.length} produtos</strong> na
                sua lista atual.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveListToSupabase}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white"
                >
                  <CloudUpload className="h-4 w-4" />
                  Sincronizar Lista com o Supabase
                </button>
                <Link
                  href="/lista"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-brand-navy"
                >
                  Ver Comparativo da Lista
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h2 className="font-heading text-base font-bold text-brand-navy">
                Atalhos do Seu Perfil
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Acesse as áreas correspondentes à sua permissão de acesso:
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/buscar"
                  className="rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-brand-blue shadow-2xs"
                >
                  Comparador de Preços
                </Link>
                {(user.role === "mercado" || user.role === "admin") && (
                  <Link
                    href="/painel-parceiro"
                    className="rounded-xl bg-brand-green px-3.5 py-2 text-xs font-bold text-white"
                  >
                    Painel do Mercado Parceiro
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="rounded-xl bg-brand-navy px-3.5 py-2 text-xs font-bold text-brand-yellow"
                  >
                    Painel Administrativo
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Coluna Esquerda: Autenticação Real Supabase */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8 lg:col-span-7">
            <div className="flex items-center gap-3">
              <img
                src="/logo-oficial.jpg"
                alt="Economize+"
                className="h-12 w-12 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <h1 className="font-heading text-xl font-extrabold text-brand-navy sm:text-2xl">
                  {mode === "login" && "Entrar na sua conta Economize+"}
                  {mode === "cadastro" && "Criar sua conta gratuita"}
                  {mode === "recuperar" && "Recuperar acesso à conta"}
                </h1>
                <p className="text-xs text-slate-500">
                  Explore produtos livremente; use a conta para salvar listas e
                  gerenciar perfis.
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-2 border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
                  mode === "login"
                    ? "bg-brand-blue text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("cadastro")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
                  mode === "cadastro"
                    ? "bg-brand-blue text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Criar Conta
              </button>
              <button
                type="button"
                onClick={() => setMode("recuperar")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
                  mode === "recuperar"
                    ? "bg-brand-blue text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Esqueci a Senha
              </button>
            </div>

            {feedback && (
              <div
                className={`mt-4 rounded-xl p-3.5 text-xs font-semibold ${
                  feedback.type === "success"
                    ? "border border-brand-green/30 bg-emerald-50 text-brand-green"
                    : "border border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleSupabaseSubmit} className="mt-5 space-y-4">
              {mode === "cadastro" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você prefere ser chamado(a)?"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  E-mail
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

              {mode !== "recuperar" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
                  />
                </div>
              )}

              {mode === "cadastro" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Tipo de Perfil
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
                    >
                      <option value="consumidor">
                        Consumidor (Comparar e salvar listas)
                      </option>
                      <option value="mercado">
                        Comerciante / Mercado Parceiro
                      </option>
                      <option value="entregador">
                        Entregador Parceiro (Pré-cadastro)
                      </option>
                    </select>
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={lgpdConsent}
                      onChange={(e) => setLgpdConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-brand-blue"
                    />
                    <span>
                      Concordo com os{" "}
                      <Link
                        href="/institucional?aba=termos"
                        className="font-bold text-brand-blue hover:underline"
                      >
                        Termos de Uso
                      </Link>{" "}
                      e{" "}
                      <Link
                        href="/institucional?aba=privacidade"
                        className="font-bold text-brand-blue hover:underline"
                      >
                        Política de Privacidade (LGPD)
                      </Link>
                      .
                    </span>
                  </label>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-blue py-3 text-sm font-bold text-white shadow-xs transition hover:bg-brand-navy disabled:opacity-50"
              >
                {loading
                  ? "Processando no Supabase..."
                  : mode === "login"
                    ? "Entrar na Conta"
                    : mode === "cadastro"
                      ? "Criar Conta Gratuita"
                      : "Enviar Link de Recuperação"}
              </button>
            </form>
          </div>

          {/* Coluna Direita: Acesso Demonstrativo Instantâneo por Perfil */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-brand-blue/25 bg-brand-light/70 p-6">
              <span className="rounded-md bg-brand-blue px-2.5 py-0.5 text-[11px] font-bold text-white">
                Avaliação Rápida do MVP
              </span>
              <h2 className="mt-2 font-heading text-lg font-extrabold text-brand-navy">
                Testar Perfis de Acesso com 1 Clique
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Para avaliar imediatamente todas as rotas protegidas (Painel do
                Mercado Parceiro, Consumidor e Painel Administrativo), selecione
                um perfil demonstrativo abaixo:
              </p>

              <div className="mt-4 space-y-2.5">
                {(
                  [
                    {
                      role: "consumidor",
                      title: "Entrar como Consumidor (Demo)",
                      desc: "Salva listas de compras e compara cestas entre mercados.",
                    },
                    {
                      role: "mercado",
                      title: "Entrar como Mercado Parceiro (Demo)",
                      desc: "Libera o Painel do Mercado Exemplo A para editar preços e promoções.",
                    },
                    {
                      role: "entregador",
                      title: "Entrar como Entregador Parceiro (Demo)",
                      desc: "Visualiza o pré-cadastro e etapas da futura operação.",
                    },
                    {
                      role: "admin",
                      title: "Entrar como Administrador (Demo)",
                      desc: "Libera o Painel Administrativo para moderar mercados e denúncias.",
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => loginDemoRole(item.role)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-brand-blue hover:shadow-xs"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                    <div>
                      <p className="font-heading text-xs font-bold text-brand-navy sm:text-sm">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand-green" />
                No banco Supabase real, as políticas RLS isolam cada perfil no
                servidor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
