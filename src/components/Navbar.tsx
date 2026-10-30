"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Home,
  LayoutDashboard,
  MapPin,
  Search,
  ShieldAlert,
  ShoppingBasket,
  Store,
  Truck,
  User,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { TRANSPARENCY_DISCLAIMER, formatBRL } from "@/data/mockData";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    categories,
    shoppingList,
    prices,
    markets,
    location,
    user,
    toast,
    setIsLocationModalOpen,
    loginDemoRole,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");

  const totalItemsInList = shoppingList
    .filter((i) => i.checked)
    .reduce((acc, item) => acc + item.quantity, 0);

  const activeMarkets = markets.filter(
    (m) => m.status === "ativo" && m.distanceKm <= location.maxRadiusKm
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
  const bestEstimatedTotal =
    marketTotals.length > 0 ? Math.min(...marketTotals.filter((t) => t > 0)) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/buscar");
    }
  };

  return (
    <>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-20 z-50 flex items-center gap-2.5 rounded-xl border border-brand-green/30 bg-brand-navy px-4 py-3 text-xs font-medium text-white shadow-lg sm:bottom-6 sm:text-sm"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-yellow" />
          <span>{toast}</span>
        </div>
      )}

      {/* Faixa Superior de Transparência + Acesso Rápido de Perfis */}
      <div className="bg-brand-navy px-3 py-1.5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 text-brand-yellow">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-slate-100">
              {TRANSPARENCY_DISCLAIMER}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-slate-300 md:inline">
              Alternar visão:
            </span>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: "consumidor", label: "Consumidor" },
                  { id: "mercado", label: "Mercado Parceiro" },
                  { id: "entregador", label: "Entregador" },
                  { id: "admin", label: "Admin" },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => loginDemoRole(r.id)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
                    user?.role === r.id
                      ? "bg-brand-yellow text-brand-navy"
                      : "bg-white/10 text-slate-200 hover:bg-white/20"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cabeçalho Principal em Azul #176BCE */}
      <header className="sticky top-0 z-40 bg-brand-blue shadow-sm">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            >
              <img
                src="/logo-oficial.jpg"
                alt="Logotipo Economize+ Compare. Escolha. Economize."
                className="h-11 w-11 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-xs sm:h-12 sm:w-12"
              />
              <div>
                <div className="flex items-center font-heading text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  <span>Economize</span>
                  <span className="text-brand-yellow">+</span>
                </div>
                <p className="text-[10px] font-medium tracking-wide text-brand-light sm:text-xs">
                  Compare. Escolha. Economize.
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white/12 px-3 py-2 text-left text-xs text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              aria-label="Selecionar localização ou CEP"
            >
              <MapPin className="h-4 w-4 shrink-0 text-brand-yellow" />
              <div>
                <span className="block text-[10px] text-brand-light">
                  Ofertas perto de:
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  {location.neighborhood} • Até {location.maxRadiusKm}km
                  <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                </span>
              </div>
            </button>

            <form
              onSubmit={handleSearch}
              className="order-3 w-full lg:order-0 lg:max-w-md xl:max-w-xl"
              role="search"
            >
              <div className="relative flex items-center">
                <label htmlFor="header-search-input" className="sr-only">
                  Qual produto você quer comparar?
                </label>
                <input
                  id="header-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Qual produto ou código EAN você quer comparar?"
                  className="w-full rounded-full border-2 border-transparent bg-white py-2.5 pr-12 pl-4 text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:border-brand-yellow focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Buscar e comparar produto"
                  className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-white transition hover:bg-brand-green"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/conta"
                className="flex min-h-[44px] items-center gap-2 rounded-xl px-2.5 py-2 text-xs text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden text-left sm:block">
                  <span className="block text-[10px] text-brand-light">
                    {user ? `Perfil: ${user.role.toUpperCase()}` : "Bem-vindo(a)"}
                  </span>
                  <span className="font-semibold">
                    {user ? user.name.split(" ")[0] : "Entrar ou criar conta"}
                  </span>
                </div>
              </Link>

              <Link
                href="/lista"
                className="flex min-h-[44px] items-center gap-2.5 rounded-xl bg-brand-yellow px-3.5 py-2 text-brand-navy shadow-xs transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <div className="relative">
                  <ShoppingBasket className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-green px-1 text-[10px] font-bold text-white">
                    {totalItemsInList}
                  </span>
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-semibold leading-none opacity-80">
                    Minha Lista
                  </span>
                  <span className="tabular-price text-xs font-extrabold">
                    {bestEstimatedTotal > 0 && isFinite(bestEstimatedTotal)
                      ? formatBRL(bestEstimatedTotal)
                      : "Ver cesta"}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <nav
          aria-label="Menu principal e categorias"
          className="border-t border-white/15 bg-brand-navy/25 text-white"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto px-3 py-2 text-xs font-medium whitespace-nowrap sm:px-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/buscar"
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  pathname === "/buscar"
                    ? "bg-white text-brand-blue"
                    : "hover:bg-white/15"
                }`}
              >
                Comparar Preços
              </Link>
              {categories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/buscar?categoria=${cat.id}`}
                  className="rounded-lg px-2.5 py-1 text-brand-light transition hover:bg-white/15 hover:text-white"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/mercados"
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition ${
                  pathname.startsWith("/mercados")
                    ? "bg-white text-brand-blue font-semibold"
                    : "hover:bg-white/15"
                }`}
              >
                <Store className="h-3.5 w-3.5" />
                Mercados Próximos
              </Link>
            </div>

            <div className="flex items-center gap-1.5 border-l border-white/20 pl-3">
              <Link
                href="/seja-parceiro"
                className="flex items-center gap-1 rounded-lg bg-brand-green px-2.5 py-1 font-semibold text-white transition hover:bg-emerald-700"
              >
                <Building2 className="h-3.5 w-3.5" />
                Seja Parceiro
              </Link>
              <Link
                href="/painel-parceiro"
                className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-white transition hover:bg-white/20"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-brand-yellow" />
                Painel do Mercado
              </Link>
              <Link
                href="/entregas"
                className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-white transition hover:bg-white/20"
              >
                <Truck className="h-3.5 w-3.5" />
                Entregas
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-white transition hover:bg-white/20"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-brand-yellow" />
                Admin
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <nav
        aria-label="Navegação rápida móvel"
        className="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white py-2 shadow-lg md:hidden"
      >
        <Link
          href="/"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            pathname === "/" ? "text-brand-blue font-bold" : "text-slate-600"
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Início</span>
        </Link>
        <Link
          href="/buscar"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            pathname.startsWith("/buscar")
              ? "text-brand-blue font-bold"
              : "text-slate-600"
          }`}
        >
          <Search className="h-5 w-5" />
          <span>Comparar</span>
        </Link>
        <Link
          href="/lista"
          className={`relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            pathname.startsWith("/lista")
              ? "text-brand-green font-bold"
              : "text-slate-600"
          }`}
        >
          <ShoppingBasket className="h-5 w-5" />
          <span>Lista ({totalItemsInList})</span>
        </Link>
        <Link
          href="/mercados"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            pathname.startsWith("/mercados")
              ? "text-brand-blue font-bold"
              : "text-slate-600"
          }`}
        >
          <Store className="h-5 w-5" />
          <span>Mercados</span>
        </Link>
        <Link
          href="/conta"
          className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            pathname.startsWith("/conta")
              ? "text-brand-blue font-bold"
              : "text-slate-600"
          }`}
        >
          <User className="h-5 w-5" />
          <span>Conta</span>
        </Link>
      </nav>
    </>
  );
}
