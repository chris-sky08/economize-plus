"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Search,
} from "lucide-react";
import AnimatedSubnav from "@/components/AnimatedSubnav";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useApp } from "@/context/AppContext";
import { TRANSPARENCY_DISCLAIMER, formatBRL } from "@/lib/format";
import { ECONOMIZE_ICONS } from "@/lib/icons";

const QUICK_SEARCH_TERMS = [
  "Arroz 5kg",
  "Leite 1L",
  "Café 500g",
  "Feijão 1kg",
  "Óleo 900ml",
];

export default function Navbar() {
  const router = useRouter();
  const {
    categories,
    shoppingList,
    prices,
    markets,
    location,
    user,
    toast,
    setIsLocationModalOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");

  const totalItemsInList = shoppingList
    .filter((i) => i.checked)
    .reduce((acc, item) => acc + item.quantity, 0);

  const activeMarkets = markets.filter(
    (m) =>
      m.status === "ativo" &&
      (m.distanceKm === null || m.distanceKm <= location.maxRadiusKm)
  );
  const marketTotals = activeMarkets.map((m) => {
    let sum = 0;
    shoppingList
      .filter((i) => i.checked)
      .forEach((item) => {
        const mp = prices.find(
          (p) =>
            p.marketId === m.id &&
            p.productId === item.productId &&
            p.inStock
        );
        if (mp) sum += mp.price * item.quantity;
      });
    return sum;
  });
  const positiveTotals = marketTotals.filter((t) => t > 0);
  const bestEstimatedTotal =
    positiveTotals.length > 0 ? Math.min(...positiveTotals) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/buscar");
    }
  };

  const locationDisplay = location.configured
    ? `${location.neighborhood || location.city || "Localização ativa"} • Até ${location.maxRadiusKm} km`
    : "Definir CEP ou GPS";

  return (
    <>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-20 z-50 flex items-center gap-2.5 rounded-2xl border border-brand-green/40 bg-brand-navy px-4 py-3 text-xs font-semibold text-white shadow-xl sm:bottom-6 sm:text-sm"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-yellow" />
          <span>{toast}</span>
        </div>
      )}

      {/* Faixa Tricolor Assinatura Varejo (Inspirada no varejo brasileiro + Paleta Economize+) */}
      <div
        aria-hidden="true"
        className="h-1.5 w-full bg-gradient-to-r from-brand-blue via-brand-green to-brand-yellow"
      />

      {/* Barra Superior de Transparência, Segurança e Atalhos Rápidos */}
      <div className="border-b border-white/10 bg-[#042B50] px-3 py-1.5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <img
              src={ECONOMIZE_ICONS["fonte-rastreavel"].src}
              alt=""
              className="h-4 w-4 shrink-0 rounded-full bg-white object-cover"
            />
            <span className="font-medium text-slate-100">
              {TRANSPARENCY_DISCLAIMER}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/divulgacao"
              className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-light transition hover:bg-white/20 md:inline-flex"
            >
              <img
                src={ECONOMIZE_ICONS["qr-geral"].src}
                alt=""
                className="h-3.5 w-3.5 rounded-full bg-white object-cover"
              />
              <span>Kit QR Code Lojas</span>
            </Link>

            <Link
              href="/institucional?aba=privacidade"
              className="hidden items-center gap-1 text-[11px] text-slate-300 transition hover:text-brand-yellow sm:inline-flex"
            >
              <span>Privacidade e Cookies</span>
            </Link>

            {user && (
              <div className="flex items-center gap-1.5 text-[11px] text-brand-light">
                <span>
                  Sessão:{" "}
                  <strong className="text-white">{user.email}</strong> (
                  {user.role})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Super-Header Varejo Principal */}
      <header className="sticky top-0 z-40 w-full overflow-x-clip bg-brand-navy shadow-md">
        <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 lg:flex-nowrap">
            {/* Logotipo Oficial Intocado */}
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2 rounded-2xl pr-1 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            >
              <img
                src="/logo-oficial.jpg"
                alt="Logotipo Economize+ Compare. Escolha. Economize."
                className="h-10 w-10 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-sm transition-transform duration-200 group-hover:scale-105 sm:h-12 sm:w-12"
              />
              <div>
                <div className="flex items-center font-heading text-lg font-extrabold tracking-tight text-white sm:text-2xl">
                  <span>Economize</span>
                  <span className="text-brand-green">+</span>
                </div>
                <p className="text-[10px] font-semibold tracking-wide text-brand-yellow sm:text-xs">
                  Compare. Escolha. Economize.
                </p>
              </div>
            </Link>

            {/* Seletor de CEP / Região com Ícone Realista Próprio */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex min-h-[44px] max-w-[185px] shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-left text-xs text-white transition hover:border-brand-yellow/60 hover:bg-white/18 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-yellow sm:max-w-none sm:px-3"
              aria-label="Selecionar localização ou CEP"
            >
              <img
                src={ECONOMIZE_ICONS["passo-cep-gps"].src}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full border border-brand-yellow/70 bg-white object-cover shadow-2xs sm:h-8 sm:w-8"
              />
              <div className="min-w-0">
                <span className="block truncate text-[10px] font-medium text-brand-light">
                  {location.configured ? "Ofertas perto de:" : "Informe seu CEP:"}
                </span>
                <span className="flex items-center gap-1 truncate font-bold text-white">
                  <span className="truncate">{locationDisplay}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-brand-yellow" />
                </span>
              </div>
            </button>

            {/* Omnibox Varejo Estilo Magalu com Botão de Scanner EAN Integrado */}
            <div className="order-3 w-full lg:order-0 lg:min-w-0 lg:flex-1 lg:px-2">
              <form
                onSubmit={handleSearch}
                role="search"
                className="relative flex items-center"
              >
                <label htmlFor="header-search-input" className="sr-only">
                  Qual produto ou código EAN você quer comparar?
                </label>
                <input
                  id="header-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Busque por produto, marca ou código de barras EAN..."
                  className="min-h-[46px] w-full rounded-2xl border-2 border-brand-yellow bg-white py-2.5 pr-24 pl-4 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-brand-blue focus:outline-none"
                />

                {/* Atalho para Leitor de Código de Barras EAN */}
                <Link
                  href="/buscar"
                  title="Comparar por código de barras EAN"
                  aria-label="Abrir comparador por código de barras EAN"
                  className="absolute right-12 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light p-0.5 transition hover:scale-105 active:scale-95"
                >
                  <img
                    src={ECONOMIZE_ICONS["scanner-ean"].src}
                    alt=""
                    className="h-full w-full rounded-lg object-cover"
                  />
                </Link>

                <button
                  type="submit"
                  aria-label="Buscar e comparar produto"
                  className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue text-white shadow-2xs transition hover:bg-brand-navy active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>

              {/* Sugestões Rápidas de Busca no Estilo Super-App */}
              <div className="mt-1.5 hidden items-center gap-1.5 overflow-x-auto text-[11px] lg:flex">
                <span className="font-semibold text-brand-yellow">
                  Mais buscados:
                </span>
                {QUICK_SEARCH_TERMS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setSearchQuery(term);
                      router.push(`/buscar?q=${encodeURIComponent(term)}`);
                    }}
                    className="rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-brand-light transition hover:bg-brand-yellow hover:text-brand-navy"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Ações de Conta e Cesta Inteligente com Ícones Realistas */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                href="/conta"
                className="flex min-h-[46px] items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-2.5 py-1.5 text-xs text-white transition hover:bg-white/18 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              >
                <img
                  src={ECONOMIZE_ICONS["sua-conta"].src}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full border border-brand-blue bg-white object-cover shadow-xs"
                />
                <div className="hidden text-left sm:block">
                  <span className="block text-[10px] text-brand-light">
                    {user ? `Perfil: ${user.role.toUpperCase()}` : "Bem-vindo(a)"}
                  </span>
                  <span className="font-bold text-white">
                    {user ? user.name.split(" ")[0] : "Entrar ou criar"}
                  </span>
                </div>
              </Link>

              <Link
                href="/lista"
                className="flex min-h-[46px] items-center gap-2.5 rounded-2xl bg-brand-yellow px-3.5 py-1.5 text-brand-navy shadow-sm transition hover:bg-amber-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <div className="relative">
                  <img
                    src={ECONOMIZE_ICONS["minha-cesta"].src}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full border border-brand-navy/20 bg-white object-cover shadow-xs"
                  />
                  <span className="tabular-price absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-navy px-1 text-[10px] font-extrabold text-white shadow-2xs">
                    {totalItemsInList}
                  </span>
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-bold leading-none text-brand-navy/80">
                    Minha Lista
                  </span>
                  <span className="tabular-price text-xs font-extrabold text-brand-navy">
                    {bestEstimatedTotal > 0 && isFinite(bestEstimatedTotal)
                      ? formatBRL(bestEstimatedTotal)
                      : "Ver cesta"}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <AnimatedSubnav categories={categories} user={user} />
      </header>

      <MobileBottomNav totalItemsInList={totalItemsInList} />
    </>
  );
}
