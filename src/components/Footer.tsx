"use client";

import React from "react";
import Link from "next/link";
import { Database, ExternalLink } from "lucide-react";
import { TRANSPARENCY_DISCLAIMER } from "@/lib/format";

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
            rastreabilidade de origem, horário de coleta e cálculo proporcional
            por unidade de medida.
          </p>
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
                Criar Conta / Salvar Listas
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
            Parceiros Locais
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
