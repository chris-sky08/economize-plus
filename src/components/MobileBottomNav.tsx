"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Home, Search, ShoppingBasket, Store, User } from "lucide-react";

interface MobileBottomNavProps {
  totalItemsInList: number;
}

interface MobileTab {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

const TABS: MobileTab[] = [
  { id: "inicio", label: "Início", href: "/", icon: Home, isActive: (p) => p === "/" },
  { id: "comparar", label: "Comparar", href: "/buscar", icon: Search, isActive: (p) => p.startsWith("/buscar") || p.startsWith("/produto") },
  { id: "lista", label: "Lista", href: "/lista", icon: ShoppingBasket, isActive: (p) => p.startsWith("/lista") },
  { id: "mercados", label: "Mercados", href: "/mercados", icon: Store, isActive: (p) => p.startsWith("/mercados") },
  { id: "conta", label: "Conta", href: "/conta", icon: User, isActive: (p) => p.startsWith("/conta") },
];

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

export default function MobileBottomNav({ totalItemsInList }: MobileBottomNavProps) {
  const pathname = usePathname();
  const activeIndex = TABS.findIndex((tab) => tab.isActive(pathname));
  const hasActive = activeIndex >= 0;

  return (
    <nav
      aria-label="Navegação rápida móvel"
      className="safe-bottom fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-4px_16px_rgba(6,58,107,0.08)] backdrop-blur md:hidden"
    >
      <div className="relative grid grid-cols-5 py-1.5">
        {/* Indicador deslizante: ocupa 1/5 da largura e se move por translateX (GPU, 60fps) */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-1/5 transition-[transform,opacity] duration-500 motion-reduce:transition-none ${EASE}`}
          style={{
            transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
            opacity: hasActive ? 1 : 0,
          }}
        >
          {/* Barra superior */}
          <span className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b-full bg-brand-blue" />
          {/* Pílula atrás do ícone */}
          <span className="absolute top-1.5 left-1/2 h-8 w-14 -translate-x-1/2 rounded-full bg-brand-light" />
        </span>

        {TABS.map((tab, index) => {
          const active = index === activeIndex;
          const Icon = tab.icon;
          const showBadge = tab.id === "lista" && totalItemsInList > 0;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="group relative z-10 flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <span
                className={`relative flex h-8 w-14 items-center justify-center transition-transform duration-300 group-active:scale-90 motion-reduce:transition-none ${EASE} ${
                  active ? "-translate-y-0.5 scale-110" : "translate-y-0 scale-100"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors duration-300 ${
                    active ? "text-brand-navy" : "text-slate-500"
                  }`}
                  strokeWidth={active ? 2.4 : 2}
                />
                {showBadge && (
                  <span
                    key={totalItemsInList}
                    className="nav-badge-pop absolute top-0 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-green px-1 text-[10px] font-bold tabular-nums text-brand-navy"
                  >
                    {totalItemsInList > 99 ? "99+" : totalItemsInList}
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] transition-colors duration-300 ${
                  active ? "font-bold text-brand-navy" : "font-medium text-slate-500"
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
