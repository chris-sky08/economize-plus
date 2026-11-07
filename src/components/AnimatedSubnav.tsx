"use client";

import React, {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ClipboardCheck,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import type { Category, UserProfile } from "@/types/domain";
import { ECONOMIZE_ICONS, getCategoryIconSrc } from "@/lib/icons";

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
      {
        id: "comparar",
        label: "Departamentos",
        href: "/buscar",
        iconSrc: ECONOMIZE_ICONS["scanner-ean"].src,
      },
      ...categories.slice(0, 7).map((cat) => ({
        id: `cat-${cat.id}`,
        label: cat.name,
        href: `/buscar?categoria=${encodeURIComponent(cat.id)}`,
        iconSrc: getCategoryIconSrc(cat.id),
      })),
      {
        id: "mercados",
        label: "Mercados",
        href: "/mercados",
        iconSrc: ECONOMIZE_ICONS["qr-supermercado-ativo"].src,
      },
    ];
    return list;
  }, [categories]);

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
  const [pill, setPill] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({
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
    if (activeId && tabRefs.current[activeId]) {
      tabRefs.current[activeId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [targetId, activeId, categories]);

  useEffect(() => {
    window.addEventListener("resize", updatePillPosition);
    return () => window.removeEventListener("resize", updatePillPosition);
  }, [targetId]);

  return (
    <nav
      aria-label="Departamentos e navegação rápida"
      className="border-t border-white/15 bg-gradient-to-r from-[#05315B] via-[#07427A] to-[#05315B] text-white"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto px-3 py-1.5 text-xs font-medium whitespace-nowrap sm:px-6">
        {/* Abas de Departamentos com Ícones Realistas em Miniatura */}
        <div
          ref={containerRef}
          onMouseLeave={() => setHoveredId(null)}
          className="relative flex items-center gap-1"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-0 h-[38px] rounded-xl bg-white shadow-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
                className={`relative z-10 flex min-h-[44px] items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold transition-colors duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow ${
                  isHighlight
                    ? "font-bold text-brand-navy"
                    : "text-brand-light hover:text-white"
                }`}
              >
                <img
                  src={tab.iconSrc}
                  alt=""
                  className="h-5 w-5 shrink-0 rounded-full bg-white object-cover shadow-2xs"
                />
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

        {/* Atalhos B2B e Logística com Ícones Realistas */}
        <div className="flex items-center gap-1.5 border-l border-white/20 pl-3">
          <Link
            href="/seja-parceiro"
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-green px-3 py-1.5 font-bold text-brand-navy shadow-xs transition hover:opacity-95 active:scale-95"
          >
            <img
              src={ECONOMIZE_ICONS["seja-parceiro"].src}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full bg-white object-cover shadow-2xs"
            />
            Seja Parceiro
          </Link>
          {(user?.role === "mercado" || user?.role === "admin") && (
            <Link
              href="/painel-parceiro"
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-white transition hover:bg-white/25 active:scale-95"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-brand-yellow" />
              Painel do Mercado
            </Link>
          )}
          <Link
            href="/entregas"
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white/12 px-3 py-1.5 font-semibold text-white transition hover:bg-white/20 active:scale-95"
          >
            <img
              src={ECONOMIZE_ICONS.entregas.src}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full bg-white object-cover shadow-2xs"
            />
            Entregas
          </Link>
          {user?.role === "admin" && (
            <>
              <Link
                href="/admin/coleta"
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-white transition hover:bg-white/25 active:scale-95"
              >
                <ClipboardCheck className="h-3.5 w-3.5 text-brand-green" />
                Coleta em Loja
              </Link>
              <Link
                href="/admin"
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-yellow/20 px-3 py-2 font-semibold text-brand-yellow transition hover:bg-brand-yellow/30 active:scale-95"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
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
        <div className="h-12 border-t border-white/15 bg-brand-navy" />
      }
    >
      <AnimatedSubnavContent {...props} />
    </Suspense>
  );
}
