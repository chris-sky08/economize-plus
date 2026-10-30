"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  ShoppingBasket,
  User,
  UserPlus,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";

export default function ContaPage() {
  const {
    user,
    syncSessionFromToken,
    logoutUser,
    shoppingList,
    saveListToSupabase,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<"login" | "cadastro" | "recuperar">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          text: "Instruções de redefinição de senha enviadas para o seu e-mail.",
        });
      } else if (mode === "cadastro") {
        if (!lgpdConsent) {
          setFeedback({
            type: "error",
            text: "É necessário concordar com a Política de Privacidade e os Termos de Uso para criar sua conta.",
          });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });
        if (error) throw error;
        if (data.session?.access_token) {
          await syncSessionFromToken(data.session.access_token);
          showToast("Conta criada e autenticada com sucesso!");
        } else {
          setFeedback({
            type: "success",
            text: "Cadastro realizado! Verifique a confirmação no seu e-mail para entrar.",
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session?.access_token) {
          await syncSessionFromToken(data.session.access_token);
          showToast("Login realizado com sucesso!");
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Não foi possível autenticar. Verifique seu e-mail e senha.";
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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy text-white">
                <User className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-light px-3 py-0.5 text-xs font-bold text-brand-navy uppercase">
                    Papel: {user.role}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                    Sessão Verificada (Supabase Auth)
                  </span>
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
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h2 className="flex items-center gap-2 font-heading text-base font-bold text-brand-navy">
                <ShoppingBasket className="h-5 w-5 text-brand-blue" />
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
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white"
                >
                  <CloudUpload className="h-4 w-4" />
                  Sincronizar Lista na Conta
                </button>
                <Link
                  href="/lista"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-brand-navy"
                >
                  Ver Comparativo da Lista
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h2 className="font-heading text-base font-bold text-brand-navy">
                Acessos da Sua Conta
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                O papel da sua conta é validado no servidor via{" "}
                <code>public.profiles</code> e{" "}
                <code>public.market_members</code>.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/buscar"
                  className="inline-flex min-h-[44px] items-center rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-brand-navy shadow-2xs"
                >
                  Comparador de Preços
                </Link>
                {(user.role === "mercado" || user.role === "admin") && (
                  <Link
                    href="/painel-parceiro"
                    className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-green px-3.5 py-2 text-xs font-bold text-brand-navy"
                  >
                    Painel do Mercado Parceiro
                  </Link>
                )}
                {user.role === "admin" && (
                  <>
                    <Link
                      href="/admin/coleta"
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-brand-blue px-3.5 py-2 text-xs font-bold text-white"
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      Coleta Presencial em Loja
                    </Link>
                    <Link
                      href="/admin"
                      className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-navy px-3.5 py-2 text-xs font-bold text-brand-yellow"
                    >
                      Painel Administrativo
                    </Link>
                  </>
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
                  A pesquisa de preços é aberta; use sua conta para salvar
                  listas ou acessar áreas de parceiro.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
                  mode === "login"
                    ? "bg-brand-navy text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("cadastro")}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
                  mode === "cadastro"
                    ? "bg-brand-navy text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Criar Conta
              </button>
              <button
                type="button"
                onClick={() => setMode("recuperar")}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${
                  mode === "recuperar"
                    ? "bg-brand-navy text-white"
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
                    ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
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
                  placeholder="Informe seu e-mail"
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
                <label className="flex items-start gap-2.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={lgpdConsent}
                    onChange={(e) => setLgpdConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-brand-navy"
                  />
                  <span>
                    Concordo com os{" "}
                    <Link
                      href="/institucional?aba=termos"
                      className="font-bold text-brand-navy underline"
                    >
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link
                      href="/institucional?aba=privacidade"
                      className="font-bold text-brand-navy underline"
                    >
                      Política de Privacidade
                    </Link>
                    .
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="min-h-[44px] w-full rounded-xl bg-brand-navy py-3 text-sm font-bold text-white shadow-xs transition hover:bg-brand-blue disabled:opacity-50"
              >
                {loading
                  ? "Autenticando..."
                  : mode === "login"
                    ? "Entrar na Conta"
                    : mode === "cadastro"
                      ? "Criar Conta Gratuita"
                      : "Enviar Link de Recuperação"}
              </button>
            </form>
          </div>

          {/* Coluna Direita: Explicação de Segurança e Papéis */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
              <span className="rounded-md bg-brand-light px-2.5 py-0.5 text-[11px] font-bold text-brand-navy">
                Segurança & Controle de Acesso
              </span>
              <h2 className="mt-2 font-heading text-lg font-extrabold text-brand-navy">
                Como funcionam os perfis no Economize+
              </h2>
              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <strong className="text-brand-navy">Consumidor:</strong>{" "}
                    Criado automaticamente ao se cadastrar. Permite sincronizar
                    sua lista de compras entre dispositivos.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                  <div>
                    <strong className="text-brand-navy">
                      Mercado Parceiro:
                    </strong>{" "}
                    Habilitado após verificação cadastral e vínculo do usuário
                    na tabela <code>public.market_members</code>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-navy" />
                  <div>
                    <strong className="text-brand-navy">
                      Validação no Servidor:
                    </strong>{" "}
                    Todas as rotas administrativas e de ingestão validam o token
                    JWT e as políticas Row Level Security (RLS) diretamente no
                    Supabase.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
