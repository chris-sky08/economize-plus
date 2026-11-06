"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  ShoppingBasket,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";

interface ProfileApiResponse {
  profile?: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    city: string | null;
    neighborhood: string | null;
    cep: string | null;
    lgpd_consent: boolean;
    lgpd_consent_at: string | null;
    app_role: string;
    created_at: string | null;
  };
  error?: string;
}

interface CepLookupPayload {
  zipCode?: string;
  street?: string | null;
  neighborhood?: string | null;
  city?: string;
  state?: string;
  lat?: number | null;
  lng?: number | null;
  error?: string;
}

type AuthMode = "login" | "cadastro" | "recuperar" | "redefinir";

function formatPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCepMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export default function ContaPage() {
  const {
    user,
    accessToken,
    syncSessionFromToken,
    logoutUser,
    shoppingList,
    saveListToSupabase,
    updateLocation,
    showToast,
  } = useApp();

  // Estado do formulário de autenticação / cadastro / recuperação / redefinição
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [cepStateUf, setCepStateUf] = useState<string | null>(null);
  const [cepCoords, setCepCoords] = useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: null, lng: null });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Estado do painel do consumidor autenticado (Meus Dados Cadastrais)
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFullName, setProfileFullName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCep, setProfileCep] = useState("");
  const [profileNeighborhood, setProfileNeighborhood] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileCepStateUf, setProfileCepStateUf] = useState<string | null>(
    null
  );
  const [profileCepCoords, setProfileCepCoords] = useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: null, lng: null });
  const [profileCepLoading, setProfileCepLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Estado do card Segurança e Alteração de Senha
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Detecta ?mode=redefinir na URL ou evento PASSWORD_RECOVERY do Supabase Auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get("mode");
      if (
        urlMode === "redefinir" ||
        urlMode === "cadastro" ||
        urlMode === "recuperar" ||
        urlMode === "login"
      ) {
        setMode(urlMode);
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("redefinir");
        setFeedback({
          type: "success",
          text: "Link de recuperação validado. Digite e confirme sua nova senha abaixo.",
        });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Carrega dados reais de public.profiles quando autenticado
  const fetchUserProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const res = await fetch("/api/conta/perfil", {
        method: "GET",
        headers,
      });
      if (!res.ok) {
        setProfileFullName(user.name || "");
        return;
      }
      const data = (await res.json()) as ProfileApiResponse;
      if (data.profile) {
        setProfileFullName(data.profile.full_name || user.name || "");
        setProfilePhone(
          data.profile.phone ? formatPhoneBR(data.profile.phone) : ""
        );
        setProfileCep(
          data.profile.cep ? formatCepMask(data.profile.cep) : ""
        );
        setProfileNeighborhood(data.profile.neighborhood || "");
        setProfileCity(data.profile.city || "");
      }
    } catch {
      setProfileFullName(user.name || "");
    } finally {
      setProfileLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    if (user) {
      void fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  // Busca automática de CEP no formulário de cadastro
  const lookupSignupCep = useCallback(async (rawCep: string) => {
    const clean = rawCep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    setCepFeedback(null);
    try {
      const res = await fetch(`/api/cep/${clean}`);
      const data = (await res.json()) as CepLookupPayload;
      if (!res.ok || data.error) {
        setCepFeedback(
          data.error || "Não foi possível localizar o CEP informado."
        );
        return;
      }
      if (data.city) setCity(data.city);
      if (data.neighborhood) setNeighborhood(data.neighborhood);
      setCepStateUf(data.state || null);
      setCepCoords({
        lat: typeof data.lat === "number" ? data.lat : null,
        lng: typeof data.lng === "number" ? data.lng : null,
      });
      setCepFeedback(
        `Endereço localizado: ${
          data.neighborhood ? `${data.neighborhood}, ` : ""
        }${data.city || ""}${data.state ? ` - ${data.state}` : ""}`
      );
    } catch {
      setCepFeedback("Falha ao consultar o CEP no momento.");
    } finally {
      setCepLoading(false);
    }
  }, []);

  // Busca automática de CEP no painel de perfil autenticado
  const lookupProfileCep = useCallback(async (rawCep: string) => {
    const clean = rawCep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setProfileCepLoading(true);
    try {
      const res = await fetch(`/api/cep/${clean}`);
      const data = (await res.json()) as CepLookupPayload;
      if (!res.ok || data.error) {
        setProfileFeedback({
          type: "error",
          text: data.error || "CEP não encontrado na base dos Correios.",
        });
        return;
      }
      if (data.city) setProfileCity(data.city);
      if (data.neighborhood) setProfileNeighborhood(data.neighborhood);
      setProfileCepStateUf(data.state || null);
      setProfileCepCoords({
        lat: typeof data.lat === "number" ? data.lat : null,
        lng: typeof data.lng === "number" ? data.lng : null,
      });
    } catch {
      // Mantém campos editáveis manualmente
    } finally {
      setProfileCepLoading(false);
    }
  }, []);

  const handleSignupCepChange = (value: string) => {
    const masked = formatCepMask(value);
    setCep(masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length === 8) {
      void lookupSignupCep(digits);
    } else {
      setCepFeedback(null);
    }
  };

  const handleProfileCepChange = (value: string) => {
    const masked = formatCepMask(value);
    setProfileCep(masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length === 8) {
      void lookupProfileCep(digits);
    }
  };

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      if (mode === "recuperar") {
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/conta?mode=redefinir`
            : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          redirectTo ? { redirectTo } : undefined
        );
        if (error) throw error;
        setFeedback({
          type: "success",
          text: "Enviamos um link de recuperação para o seu e-mail. Acesse o link recebido para criar uma nova senha.",
        });
      } else if (mode === "redefinir") {
        if (password.length < 6) {
          setFeedback({
            type: "error",
            text: "A nova senha precisa ter pelo menos 6 caracteres.",
          });
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setFeedback({
            type: "error",
            text: "A confirmação de senha não confere com a nova senha digitada.",
          });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({
          password,
        });
        if (error) throw error;
        setPassword("");
        setConfirmPassword("");
        setFeedback({
          type: "success",
          text: "Sua senha foi redefinida com sucesso! Você já pode acessar sua conta.",
        });
        showToast("Senha atualizada com sucesso!");
        setMode("login");
      } else if (mode === "cadastro") {
        if (!name.trim()) {
          setFeedback({
            type: "error",
            text: "Informe seu nome completo para criar a conta.",
          });
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setFeedback({
            type: "error",
            text: "A senha deve ter no mínimo 6 caracteres.",
          });
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setFeedback({
            type: "error",
            text: "As senhas digitadas não coincidem. Verifique e tente novamente.",
          });
          setLoading(false);
          return;
        }
        if (!lgpdConsent) {
          setFeedback({
            type: "error",
            text: "É necessário concordar com a Política de Privacidade e os Termos de Uso para criar sua conta.",
          });
          setLoading(false);
          return;
        }

        const cleanCep = cep.replace(/\D/g, "");
        const formattedCep =
          cleanCep.length === 8
            ? `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`
            : null;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              phone: phone.trim() || null,
              cep: formattedCep,
              neighborhood: neighborhood.trim() || null,
              city: city.trim() || null,
              lgpd_consent: true,
            },
          },
        });
        if (error) throw error;

        if (city.trim() || formattedCep) {
          updateLocation({
            city: city.trim() || null,
            neighborhood: neighborhood.trim() || null,
            state: cepStateUf,
            zipCode: formattedCep,
            lat: cepCoords.lat,
            lng: cepCoords.lng,
          });
        }

        if (data.session?.access_token) {
          await syncSessionFromToken(data.session.access_token);
          await fetch("/api/conta/perfil", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({
              full_name: name.trim(),
              phone: phone.trim() || null,
              cep: formattedCep,
              neighborhood: neighborhood.trim() || null,
              city: city.trim() || null,
              lgpd_consent: true,
            }),
          }).catch(() => undefined);
          showToast("Cadastro concluído! Bem-vindo(a) ao Economize+.");
        } else {
          setFeedback({
            type: "success",
            text: "Cadastro realizado! Enviamos um link de confirmação para o seu e-mail para ativar o acesso.",
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
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
          : "Não foi possível concluir a autenticação. Verifique os dados informados.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConsumerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (!profileFullName.trim()) {
      setProfileFeedback({
        type: "error",
        text: "O campo Nome Completo é obrigatório.",
      });
      return;
    }

    setProfileSaving(true);
    try {
      const cleanCep = profileCep.replace(/\D/g, "");
      const formattedCep =
        cleanCep.length === 8
          ? `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`
          : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/conta/perfil", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          full_name: profileFullName.trim(),
          phone: profilePhone.trim() || null,
          cep: formattedCep,
          neighborhood: profileNeighborhood.trim() || null,
          city: profileCity.trim() || null,
          lgpd_consent: true,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(
          data.error || "Não foi possível salvar seus dados cadastrais."
        );
      }

      if (profileCity.trim() || formattedCep) {
        updateLocation({
          city: profileCity.trim() || null,
          neighborhood: profileNeighborhood.trim() || null,
          ...(profileCepStateUf ? { state: profileCepStateUf } : {}),
          zipCode: formattedCep,
          ...(profileCepCoords.lat !== null
            ? { lat: profileCepCoords.lat, lng: profileCepCoords.lng }
            : {}),
        });
      }

      if (accessToken) {
        await syncSessionFromToken(accessToken);
      }

      setProfileFeedback({
        type: "success",
        text: "Seus dados cadastrais foram atualizados com sucesso em public.profiles.",
      });
      showToast("Cadastro atualizado com sucesso!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro ao atualizar dados cadastrais.";
      setProfileFeedback({ type: "error", text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateAuthenticatedPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPasswordInput.length < 6) {
      setPasswordFeedback({
        type: "error",
        text: "A nova senha deve possuir no mínimo 6 caracteres.",
      });
      return;
    }

    if (newPasswordInput !== confirmNewPasswordInput) {
      setPasswordFeedback({
        type: "error",
        text: "A confirmação da nova senha não coincide.",
      });
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPasswordInput,
      });
      if (error) throw error;
      setNewPasswordInput("");
      setConfirmNewPasswordInput("");
      setPasswordFeedback({
        type: "success",
        text: "Senha atualizada com segurança!",
      });
      showToast("Sua senha foi alterada com sucesso!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Não foi possível alterar sua senha no momento.";
      setPasswordFeedback({ type: "error", text: msg });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {user && mode !== "redefinir" ? (
        <div className="space-y-6">
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
                    {profileFullName || user.name}
                  </h1>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={logoutUser}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95"
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
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-blue active:scale-95"
                  >
                    <CloudUpload className="h-4 w-4" />
                    Sincronizar Lista na Conta
                  </button>
                  <Link
                    href="/lista"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-brand-navy transition hover:border-brand-blue active:scale-95"
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
                    className="inline-flex min-h-[44px] items-center rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-brand-navy shadow-2xs transition hover:bg-brand-light active:scale-95"
                  >
                    Comparador de Preços
                  </Link>
                  {(user.role === "mercado" || user.role === "admin") && (
                    <Link
                      href="/painel-parceiro"
                      className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-green px-3.5 py-2 text-xs font-bold text-brand-navy transition active:scale-95"
                    >
                      Painel do Mercado Parceiro
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <>
                      <Link
                        href="/admin/coleta"
                        className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-brand-blue px-3.5 py-2 text-xs font-bold text-white transition active:scale-95"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Coleta Presencial em Loja
                      </Link>
                      <Link
                        href="/admin"
                        className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-navy px-3.5 py-2 text-xs font-bold text-brand-yellow transition active:scale-95"
                      >
                        Painel Administrativo
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Meus Dados Cadastrais de Consumidor + Card: Segurança e Alteração de Senha */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8 lg:col-span-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light text-brand-navy">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-extrabold text-brand-navy">
                    Meus Dados Cadastrais de Consumidor
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mantenha seu cadastro e CEP atualizados para comparar preços
                    nos mercados do seu bairro.
                  </p>
                </div>
              </div>

              {profileFeedback && (
                <div
                  className={`mt-4 rounded-xl p-3.5 text-xs font-semibold ${
                    profileFeedback.type === "success"
                      ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {profileFeedback.text}
                </div>
              )}

              {profileLoading ? (
                <div className="mt-5 space-y-3">
                  <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSaveConsumerProfile}
                  className="mt-5 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Telefone / WhatsApp
                      </label>
                      <div className="relative mt-1">
                        <Phone className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) =>
                            setProfilePhone(formatPhoneBR(e.target.value))
                          }
                          placeholder="DDD + número"
                          className="min-h-[44px] w-full rounded-xl border border-slate-200 py-2.5 pr-3.5 pl-10 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        CEP (preenche Cidade e Bairro)
                      </label>
                      <div className="relative mt-1">
                        <MapPin className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-brand-blue" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={profileCep}
                          onChange={(e) =>
                            handleProfileCepChange(e.target.value)
                          }
                          placeholder="Somente números (8 dígitos)"
                          className="min-h-[44px] w-full rounded-xl border border-slate-200 py-2.5 pr-9 pl-10 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                        />
                        {profileCepLoading && (
                          <Loader2 className="
                            absolute top-3.5 right-3 h-4 w-4 animate-spin text-brand-blue
                          " />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={profileNeighborhood}
                        onChange={(e) => setProfileNeighborhood(e.target.value)}
                        placeholder="Informe seu bairro"
                        className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        placeholder="Informe sua cidade"
                        className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-brand-blue active:scale-95 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {profileSaving
                      ? "Salvando Alterações..."
                      : "Salvar Dados Cadastrais"}
                  </button>
                </form>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8 lg:col-span-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light text-brand-navy">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-extrabold text-brand-navy">
                    Segurança e Alteração de Senha
                  </h2>
                  <p className="text-xs text-slate-500">
                    Atualize sua senha de acesso diretamente via Supabase Auth.
                  </p>
                </div>
              </div>

              {passwordFeedback && (
                <div
                  className={`mt-4 rounded-xl p-3.5 text-xs font-semibold ${
                    passwordFeedback.type === "success"
                      ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {passwordFeedback.text}
                </div>
              )}

              <form
                onSubmit={handleUpdateAuthenticatedPassword}
                className="mt-5 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Nova Senha *
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="min-h-[44px] w-full rounded-xl border border-slate-200 py-2.5 pr-11 pl-3.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={
                        showNewPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      className="absolute top-1.5 right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmNewPasswordInput}
                    onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-brand-navy bg-white px-4 py-2.5 text-xs font-bold text-brand-navy transition hover:bg-brand-light active:scale-95 disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" />
                  {passwordSaving
                    ? "Atualizando Senha..."
                    : "Atualizar Minha Senha"}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Coluna Esquerda: Autenticação e Cadastro Real de Consumidores */}
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
                  {mode === "cadastro" && "Cadastro de Consumidor Economize+"}
                  {mode === "recuperar" && "Recuperar acesso à sua conta"}
                  {mode === "redefinir" && "Criar nova senha de acesso"}
                </h1>
                <p className="text-xs text-slate-500">
                  A pesquisa de preços é aberta; crie sua conta gratuita para
                  salvar listas inteligentes e configurar seu bairro.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setFeedback(null);
                }}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                  mode === "login"
                    ? "bg-brand-navy text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("cadastro");
                  setFeedback(null);
                }}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                  mode === "cadastro"
                    ? "bg-brand-navy text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Criar Conta de Consumidor
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("recuperar");
                  setFeedback(null);
                }}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                  mode === "recuperar" || mode === "redefinir"
                    ? "bg-brand-navy text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                {mode === "redefinir" ? "Redefinir Senha" : "Esqueci a Senha"}
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
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como você prefere ser chamado(a)?"
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                  />
                </div>
              )}

              {mode !== "redefinir" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Informe seu e-mail"
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                  />
                </div>
              )}

              {mode === "cadastro" && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Telefone / WhatsApp (opcional)
                      </label>
                      <div className="relative mt-1">
                        <Phone className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) =>
                            setPhone(formatPhoneBR(e.target.value))
                          }
                          placeholder="DDD + celular"
                          className="min-h-[44px] w-full rounded-xl border border-slate-200 py-2.5 pr-3.5 pl-10 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        CEP (opcional — preenche região)
                      </label>
                      <div className="relative mt-1">
                        <MapPin className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-brand-blue" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cep}
                          onChange={(e) => handleSignupCepChange(e.target.value)}
                          placeholder="8 dígitos numéricos"
                          className="min-h-[44px] w-full rounded-xl border border-slate-200 py-2.5 pr-9 pl-10 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                        />
                        {cepLoading && (
                          <Loader2 className="absolute top-3.5 right-3 h-4 w-4 animate-spin text-brand-blue" />
                        )}
                      </div>
                    </div>
                  </div>

                  {cepFeedback && (
                    <p className="text-[11px] font-semibold text-brand-blue">
                      {cepFeedback}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Seu bairro"
                        className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Sua cidade"
                        className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode !== "recuperar" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    {mode === "redefinir" ? "Nova Senha *" : "Senha *"}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="min-h-[44px] w-full rounded-xl border border-slate-200 py-2.5 pr-11 pl-3.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      className="absolute top-1.5 right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(mode === "cadastro" || mode === "redefinir") && (
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    {mode === "redefinir"
                      ? "Confirmar Nova Senha *"
                      : "Confirmar Senha *"}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha informada acima"
                      className="min-h-[44px] w-full rounded-xl border border-slate-200 py-2.5 pr-11 pl-3.5 text-sm text-brand-navy focus:border-brand-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar confirmação de senha"
                          : "Mostrar confirmação de senha"
                      }
                      className="absolute top-1.5 right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
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
                    </Link>{" "}
                    para armazenamento dos meus dados cadastrais e listas de
                    compras.
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="min-h-[44px] w-full rounded-xl bg-brand-navy py-3 text-sm font-bold text-white shadow-xs transition hover:bg-brand-blue active:scale-95 disabled:opacity-50"
              >
                {loading
                  ? "Processando..."
                  : mode === "login"
                    ? "Entrar na Conta"
                    : mode === "cadastro"
                      ? "Concluir Cadastro Gratuito"
                      : mode === "redefinir"
                        ? "Salvar Nova Senha"
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
                    Criado automaticamente em <code>public.profiles</code> ao se
                    cadastrar. Permite salvar seu bairro, CEP e sincronizar sua
                    Lista Inteligente entre dispositivos.
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
                    Todas as rotas de perfil, listas e ingestão validam o token
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
