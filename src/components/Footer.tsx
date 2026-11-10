"use client";

import React from "react";
import Link from "next/link";
import { Cookie, Database, ExternalLink, QrCode, Star } from "lucide-react";
import { TRANSPARENCY_DISCLAIMER } from "@/lib/format";
import { ECONOMIZE_ICONS } from "@/lib/icons";
import { triggerFeedbackModal } from "@/components/FeedbackWidget";
import { triggerCookiePreferencesModal } from "@/components/CookieConsentBanner";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-brand-navy pb-24 text-slate-200 md:pb-10">
      <div className="border-b border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-slate-300">
        {TRANSPARENCY_DISCLAIMER}
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/logo-oficial.jpg"
              alt="Logo Economize+"
              className="h-12 w-12 rounded-full border-2 border-brand-yellow bg-white object-cover"
            />
            <div>
              <span className="font-heading text-xl font-extrabold text-white">
                Economize<span className="text-brand-green">+</span>
              </span>
              <p className="text-xs text-brand-light">
                Compare. Escolha. Economize.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-300">
            Plataforma de comparação de preços entre mercados locais, com
            rastreabilidade de origem, horário de coleta, histórico de variação
            e cálculo proporcional por unidade de medida.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="https://www.instagram.com/economizemais_oficial"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram oficial do Economize+ (@economizemais_oficial)"
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border border-brand-blue/40 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:border-brand-green hover:bg-brand-blue/25 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
            >
              <img
                src={ECONOMIZE_ICONS["instagram-oficial"].src}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                className="h-9 w-9 shrink-0 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-2xs"
              />
              <span className="text-left leading-tight">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-brand-green">
                  Instagram Oficial
                </span>
                <span className="font-mono text-xs text-white">
                  @economizemais_oficial
                </span>
              </span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-brand-light" />
            </a>

            <a
              href="https://www.facebook.com/economizemaisoficial"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Página oficial no Facebook: Economize mais"
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border border-brand-blue/40 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:border-brand-green hover:bg-brand-blue/25 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
            >
              <img
                src={ECONOMIZE_ICONS["facebook-oficial"].src}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                className="h-9 w-9 shrink-0 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-2xs"
              />
              <span className="text-left leading-tight">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-brand-yellow">
                  Facebook Oficial
                </span>
                <span className="text-xs text-white">
                  Economize mais
                </span>
              </span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-brand-light" />
            </a>

            <a
              href="mailto:empresaeconomizemais@gmail.com"
              aria-label="E-mail oficial de contato: empresaeconomizemais@gmail.com"
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-slate-200 transition hover:border-brand-yellow hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
            >
              <img
                src={ECONOMIZE_ICONS["email-oficial"].src}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                className="h-9 w-9 shrink-0 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-2xs"
              />
              <span className="min-w-0 text-left leading-tight">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-brand-light">
                  E-mail Oficial
                </span>
                <span className="block truncate font-mono text-[11px] text-white">
                  empresaeconomizemais@gmail.com
                </span>
              </span>
            </a>

            <div className="inline-flex items-center gap-2.5 px-1 pt-0.5 text-[11px] text-slate-300">
              <img
                src={ECONOMIZE_ICONS["passo-cep-gps"].src}
                alt=""
                width={28}
                height={28}
                loading="lazy"
                className="h-7 w-7 shrink-0 rounded-full border border-brand-green bg-white object-cover"
              />
              <span>Bertioga, SP — Brasil</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
            Para Consumidores
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            <li>
              <Link href="/buscar" className="hover:text-brand-yellow">
                Comparar Preços de Produtos
              </Link>
            </li>
            <li>
              <Link href="/lista" className="hover:text-brand-yellow">
                Lista de Compras + Leitor EAN
              </Link>
            </li>
            <li>
              <Link href="/mercados" className="hover:text-brand-yellow">
                Mercados Próximos por Distância
              </Link>
            </li>
            <li>
              <Link href="/conta" className="hover:text-brand-yellow">
                Cadastro de Consumidor &amp; Conta
              </Link>
            </li>
            <li>
              <a
                href="/material-digital-economize.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-brand-yellow"
              >
                Material Digital Explicativo
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  triggerFeedbackModal({ rating: 5, category: "sugestao" })
                }
                className="inline-flex items-center gap-1.5 font-bold text-brand-yellow hover:underline"
              >
                <Star className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" />
                Avaliar App / Relatar Bug
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
            Parceiros &amp; Divulgação
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            <li>
              <Link href="/seja-parceiro" className="hover:text-brand-yellow">
                Cadastro de Supermercado Parceiro
              </Link>
            </li>
            <li>
              <Link href="/painel-parceiro" className="hover:text-brand-yellow">
                Painel do Parceiro (CSV e Encartes)
              </Link>
            </li>
            <li>
              <Link href="/entregas" className="hover:text-brand-yellow">
                Cadastro de Entregadores Parceiros
              </Link>
            </li>
            <li>
              <Link
                href="/divulgacao"
                className="inline-flex items-center gap-1.5 font-semibold text-brand-yellow hover:underline"
              >
                <QrCode className="h-3.5 w-3.5" />
                QR Code de Divulgação &amp; Cartaz
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  triggerFeedbackModal({ rating: 5, category: "sugestao" })
                }
                className="inline-flex items-center gap-1.5 font-bold text-brand-yellow hover:underline"
              >
                <Star className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" />
                Avaliar App / Relatar Bug
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
            Transparência e Termos
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            <li>
              <Link
                href="/institucional?aba=ajuda"
                className="hover:text-brand-yellow"
              >
                Como os Preços São Coletados
              </Link>
            </li>
            <li>
              <Link
                href="/institucional?aba=privacidade"
                className="hover:text-brand-yellow"
              >
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link
                href="/institucional?aba=termos"
                className="hover:text-brand-yellow"
              >
                Termos de Uso da Plataforma
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => triggerCookiePreferencesModal()}
                className="inline-flex items-center gap-1.5 font-semibold text-brand-light hover:text-brand-yellow hover:underline"
              >
                <Cookie className="h-3.5 w-3.5 text-brand-yellow" />
                Preferências de Cookies e LGPD
              </button>
            </li>
          </ul>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] leading-relaxed text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold text-brand-yellow">
              <Database className="h-3.5 w-3.5 shrink-0" />
              <span>Atribuição Open Food Facts</span>
            </div>
            <p className="mt-1">
              Dados cadastrais e imagens de produtos consultados por EAN podem
              ter origem no{" "}
              <a
                href="https://br.openfoodfacts.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-semibold text-white underline hover:text-brand-yellow"
              >
                Open Food Facts Brasil
                <ExternalLink className="h-2.5 w-2.5" />
              </a>{" "}
              (dados sob licença{" "}
              <a
                href="https://opendatacommons.org/licenses/odbl/1-0/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-yellow"
              >
                ODbL 1.0
              </a>{" "}
              e imagens sob{" "}
              <a
                href="https://creativecommons.org/licenses/by-sa/3.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-yellow"
              >
                CC BY-SA 3.0
              </a>
              ).
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-white/10 px-4 pt-6 text-center text-xs text-slate-400 sm:px-6">
        <p>
          © {new Date().getFullYear()} Economize+ — Compare. Escolha. Economize.{" "}
          {TRANSPARENCY_DISCLAIMER}.
        </p>
      </div>
    </footer>
  );
}
