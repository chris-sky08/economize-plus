"use client";

import React from "react";
import Link from "next/link";
import { Instagram, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { TRANSPARENCY_DISCLAIMER } from "@/data/mockData";

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
                Economize<span className="text-brand-yellow">+</span>
              </span>
              <p className="text-xs text-brand-light">
                Compare. Escolha. Economize.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-300">
            Plataforma para comparação de preços entre mercados locais, catálogo
            integrado ao Open Food Facts Brasil e conexão entre consumidores e
            comerciantes de bairro.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-brand-yellow">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Compatível com a LGPD e Marco Civil da Internet</span>
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
                Lista Inteligente + Scanner EAN
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
                Seja um Mercado Parceiro (Planos Básico e Premium)
              </Link>
            </li>
            <li>
              <Link href="/painel-parceiro" className="hover:text-brand-yellow">
                Painel do Parceiro (Upload CSV e Encartes IA)
              </Link>
            </li>
            <li>
              <Link href="/entregas" className="hover:text-brand-yellow">
                Entregadores Parceiros
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-brand-yellow">
                Painel Administrativo e Moderação
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
            Ajuda, Privacidade e Contato
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            <li>
              <Link
                href="/institucional?aba=ajuda"
                className="hover:text-brand-yellow"
              >
                Central de Ajuda e Como Funciona
              </Link>
            </li>
            <li>
              <Link
                href="/institucional?aba=privacidade"
                className="hover:text-brand-yellow"
              >
                Política de Privacidade (LGPD)
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
            <li className="flex items-center gap-2 pt-1 text-slate-300">
              <Mail className="h-3.5 w-3.5 text-brand-yellow" />
              <span>contato@economizemais.com.br</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <Phone className="h-3.5 w-3.5 text-brand-yellow" />
              <span>(11) 4000-1234</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <Instagram className="h-3.5 w-3.5 text-brand-yellow" />
              <span>@economizemais</span>
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-brand-yellow" />
              <span>São Paulo - SP • Mercados de Bairro</span>
            </li>
          </ul>
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
