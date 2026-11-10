"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ECONOMIZE_ICONS } from "@/lib/icons";

interface MobileBottomNavProps {
  totalItemsInList: number;
}

interface MobileTab {
  id: string;
  label: string;
  href: string;
  iconSrc: string;
  isActive: (pathname: string) => boolean;
}

const TABS: MobileTab[] = [
  {
    id: "inicio",
    label: "Início",
    href: "/",
    iconSrc: "/logo-oficial.jpg",
    isActive: (p) => p === "/",
  },
  {
    id: "comparar",
    label: "Comparar",
    href: "/buscar",
    iconSrc: ECONOMIZE_ICONS["scanner-ean"].src,
    isActive: (p) => p.startsWith("/buscar") || p.startsWith("/produto"),
  },
  {
    id: "lista",
    label: "Minha Cesta",
    href: "/lista",
    iconSrc: ECONOMIZE_ICONS["minha-cesta"].src,
    isActive: (p) => p.startsWith("/lista"),
  },
  {
    id: "mercados",
    label: "Mercados",
    href: "/mercados",
    iconSrc: ECONOMIZE_ICONS["qr-supermercado-ativo"].src,
    isActive: (p) => p.startsWith("/mercados"),
  },
  {
    id: "conta",
    label: "Sua Conta",
    href: "/conta",
    iconSrc: ECONOMIZE_ICONS["sua-conta"].src,
    isActive: (p) => p.startsWith("/conta"),
  },
];

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

export default function MobileBottomNav({
  totalItemsInList,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const activeIndex = TABS.findIndex((tab) => tab.isActive(pathname));
  const hasActive = activeIndex >= 0;

  return (
    <nav
      aria-label="Navegação rápida móvel"
      className="safe-bottom fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-6px_20px_rgba(6,58,107,0.12)] backdrop-blur md:hidden"
    >
      {/* Faixa tricolor superior estilo Super-App */}
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-brand-blue via-brand-green to-brand-yellow"
      />

      <div className="relative grid grid-cols-5 py-1.5">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-1/5 transition-[transform,opacity] duration-500 motion-reduce:transition-none ${EASE}`}
          style={{
            transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
            opacity: hasActive ? 1 : 0,
          }}
        >
          <span className="absolute top-0 left-1/2 h-[3px] w-9 -translate-x-1/2 rounded-b-full bg-brand-navy" />
          <span className="absolute top-1 left-1/2 h-9 w-14 -translate-x-1/2 rounded-2xl bg-brand-light" />
        </span>

        {TABS.map((tab, index) => {
          const active = index === activeIndex;
          const showBadge = tab.id === "lista" && totalItemsInList > 0;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="group relative z-10 flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <span
                className={`relative flex h-8 w-14 items-center justify-center transition-transform duration-300 group-active:scale-90 motion-reduce:transition-none ${EASE} ${
                  active
                    ? "-translate-y-0.5 scale-110"
                    : "translate-y-0 scale-100"
                }`}
              >
                <img
                  src={tab.iconSrc}
                  alt=""
                  className={`h-7 w-7 rounded-full bg-white object-cover shadow-2xs transition ${
                    active
                      ? "ring-2 ring-brand-navy"
                      : "opacity-90 group-hover:opacity-100"
                  }`}
                />
                {showBadge && (
                  <span
                    key={totalItemsInList}
                    className="nav-badge-pop absolute -top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-[#B45309] to-[#FBBF24] px-1 text-[10px] font-extrabold tabular-nums text-white shadow-2xs"
                  >
                    {totalItemsInList > 99 ? "99+" : totalItemsInList}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] transition-colors duration-300 ${
                  active
                    ? "font-extrabold text-brand-navy"
                    : "font-semibold text-slate-600"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
