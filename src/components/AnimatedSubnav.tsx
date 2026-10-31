"use client";

import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  ShieldAlert,
  Store,
  Truck,
} from "lucide-react";
import type { Category, UserProfile } from "@/types/domain";

interface AnimatedSubnavProps {
  categories: Category[];
  user: UserProfile | null;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function AnimatedSubnavContent({ categories, user }: AnimatedSubnavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("categoria");

  const tabs = useMemo(() => {
    const list = [
      { id: "comparar", label: "Comparar Preços", href: "/buscar" },
      ...categories.slice(0, 5).map((cat) => ({
        id: `cat-${cat.id}`,
        label: cat.name,
        href: `/buscar?categoria=${encodeURIComponent(cat.id)}`,
      })),
      {
        id: "mercados",
        label: "Mercados Próximos",
        href: "/mercados",
        icon: <Store className="h-3.5 w-3.5" />,
      },
    ];
    return list;
  }, [categories]);

  // Determina aba ativa baseado na rota e query param
  const activeId = useMemo(() => {
    if (pathname === "/buscar") {
      if (currentCategory) {
        return `cat-${currentCategory}`;
      }
      return "comparar";
    }
    if (pathname.startsWith("/mercados")) {
      return "mercados";
    }
    return null;
  }, [pathname, currentCategory]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const targetId = hoveredId || activeId;

  const updatePillPosition = () => {
    if (!targetId || !tabRefs.current[targetId] || !containerRef.current) {
      setPill((prev) => (prev.opacity === 0 ? prev : { ...prev, opacity: 0 }));
      return;
    }
    const el = tabRefs.current[targetId];
    if (el) {
      setPill({
        left: el.offsetLeft,
        width: el.offsetWidth,
        opacity: 1,
      });
    }
  };

  useIsomorphicLayoutEffect(() => {
    updatePillPosition();
    // No mobile, centraliza suavemente a aba ativa na rolagem horizontal
    if (activeId && tabRefs.current[activeId]) {
      tabRefs.current[activeId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [targetId, activeId, categories]);

  // Atualiza posição caso a janela seja redimensionada
  useEffect(() => {
    window.addEventListener("resize", updatePillPosition);
    return () => window.removeEventListener("resize", updatePillPosition);
  }, [targetId]);

  return (
    <nav
      aria-label="Menu principal e categorias"
      className="border-t border-white/15 bg-brand-blue/20 text-white"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto px-3 py-1.5 text-xs font-medium whitespace-nowrap sm:px-6">
        {/* Container das abas com o Pill Animado deslizante */}
        <div
          ref={containerRef}
          onMouseLeave={() => setHoveredId(null)}
          className="relative flex items-center gap-1 sm:gap-2"
        >
          {/* Pill deslizante acelerado por hardware a 60fps */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-0 h-[36px] rounded-lg bg-white shadow-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: `translateX(${pill.left}px) translateY(-50%)`,
              width: `${pill.width}px`,
              opacity: pill.opacity,
            }}
          />

          {tabs.map((tab) => {
            const isHighlight = (hoveredId || activeId) === tab.id;
            const isCurrentActive = activeId === tab.id;

            return (
              <Link
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                href={tab.href}
                onMouseEnter={() => setHoveredId(tab.id)}
                className={`relative z-10 flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 font-semibold transition-colors duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow ${
                  isHighlight
                    ? "text-brand-navy font-bold"
                    : "text-brand-light hover:text-white"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {isCurrentActive && (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-brand-green transition-transform duration-300"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Links secundários da direita */}
        <div className="flex items-center gap-1.5 border-l border-white/20 pl-3">
          <Link
            href="/seja-parceiro"
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-brand-green px-3 py-2 font-bold text-brand-navy shadow-xs transition hover:opacity-90 active:scale-95"
          >
            <Building2 className="h-3.5 w-3.5" />
            Seja Parceiro
          </Link>
          {(user?.role === "mercado" || user?.role === "admin") && (
            <Link
              href="/painel-parceiro"
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-white transition hover:bg-white/25 active:scale-95"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-brand-yellow" />
              Painel do Mercado
            </Link>
          )}
          <Link
            href="/entregas"
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-white transition hover:bg-white/20 active:scale-95"
          >
            <Truck className="h-3.5 w-3.5" />
            Entregas
          </Link>
          {user?.role === "admin" && (
            <>
              <Link
                href="/admin/coleta"
                className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-white transition hover:bg-white/25 active:scale-95"
              >
                <ClipboardCheck className="h-3.5 w-3.5 text-brand-green" />
                Coleta em Loja
              </Link>
              <Link
                href="/admin"
                className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-white transition hover:bg-white/25 active:scale-95"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-brand-yellow" />
                Admin
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function AnimatedSubnav(props: AnimatedSubnavProps) {
  return (
    <Suspense
      fallback={
        <nav
          aria-label="Menu principal e categorias"
          className="border-t border-white/15 bg-brand-blue/20 text-white"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-3 py-2.5 sm:px-6">
            <span className="h-8 w-28 rounded-lg bg-white/10 animate-pulse" />
            <span className="h-8 w-20 rounded-lg bg-white/10 animate-pulse" />
            <span className="h-8 w-20 rounded-lg bg-white/10 animate-pulse" />
          </div>
        </nav>
      }
    >
      <AnimatedSubnavContent {...props} />
    </Suspense>
  );
}
