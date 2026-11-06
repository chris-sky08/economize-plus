"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Search,
  ShoppingBasket,
  User,
} from "lucide-react";
import AnimatedSubnav from "@/components/AnimatedSubnav";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useApp } from "@/context/AppContext";
import { TRANSPARENCY_DISCLAIMER, formatBRL } from "@/lib/format";

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
          className="fixed right-4 bottom-20 z-50 flex items-center gap-2.5 rounded-xl border border-brand-green/30 bg-brand-navy px-4 py-3 text-xs font-medium text-white shadow-lg sm:bottom-6 sm:text-sm"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-yellow" />
          <span>{toast}</span>
        </div>
      )}

      {/* Faixa Superior de Transparência */}
      <div className="bg-brand-navy px-3 py-1.5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 text-brand-yellow">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-slate-100">
              {TRANSPARENCY_DISCLAIMER}
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-2 text-[11px] text-brand-light">
              <span>
                Sessão autenticada:{" "}
                <strong className="text-white">{user.email}</strong> (
                {user.role})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cabeçalho Principal */}
      <header className="sticky top-0 z-40 bg-brand-navy shadow-sm">
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
                  <span className="text-brand-green">+</span>
                </div>
                <p className="text-[10px] font-medium tracking-wide text-brand-light sm:text-xs">
                  Compare. Escolha. Economize.
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white/12 px-3 py-2 text-left text-xs text-white transition hover:bg-white/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              aria-label="Selecionar localização ou CEP"
            >
              <MapPin className="h-4 w-4 shrink-0 text-brand-yellow" />
              <div>
                <span className="block text-[10px] text-brand-light">
                  {location.configured ? "Ofertas perto de:" : "Sua região:"}
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  {locationDisplay}
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
                  className="absolute right-1 flex h-11 w-11 items-center justify-center rounded-full bg-brand-blue text-white transition hover:bg-brand-navy active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
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
                <img
                  src="/icons/08-sua-conta.jpg"
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full bg-white object-cover shadow-xs"
                />
                <div className="hidden text-left sm:block">
                  <span className="block text-[10px] text-brand-light">
                    {user ? `Perfil: ${user.role.toUpperCase()}` : "Sua conta"}
                  </span>
                  <span className="font-semibold">
                    {user ? user.name.split(" ")[0] : "Entrar ou criar conta"}
                  </span>
                </div>
              </Link>

              <Link
                href="/lista"
                className="flex min-h-[44px] items-center gap-2.5 rounded-xl bg-brand-yellow px-3.5 py-2 text-brand-navy shadow-xs transition hover:bg-amber-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <div className="relative">
                  <img
                    src="/icons/09-minha-cesta.jpg"
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full bg-white object-cover shadow-xs"
                  />
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-navy px-1 text-[10px] font-bold text-white shadow-2xs">
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

        <AnimatedSubnav categories={categories} user={user} />
      </header>

      <MobileBottomNav totalItemsInList={totalItemsInList} />
    </>
  );
}
