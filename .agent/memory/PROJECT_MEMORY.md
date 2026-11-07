# Memória Viva do Projeto — Economize+ (`PROJECT_MEMORY.md`)

> Atualizado automaticamente pela skill `claude-mem`.

## 1. Identidade, Domínios e Redes Oficiais
- **Nome Oficial:** Economize+ (*"Compare. Escolha. Economize."*)
- **Domínio Oficial em Produção (Vercel):** `https://economize-nine.vercel.app`
- **Instagram Oficial:** `https://www.instagram.com/economizemais_oficial` (`@economizemais_oficial`)
- **Repositório Principal (Git Origin):** `https://github.com/skyleywinfoster-netizen/economize-plus.git`
- **Repositório Conectado na Vercel (Fork de Deploy):** `https://github.com/chris-sky08/economize-plus`

## 2. Identidade Visual & Ícones 3D Autorais
- **Paleta Oficial (Opção B):**
  - `--bg-surface`: `#F4FAFC`
  - `--bg-card`: `#FFFFFF`
  - `--bg-soft` / `brand-light`: `#E6F7FB`
  - `--text-primary` / `brand-navy`: `#063A6B`
  - `--accent` / `brand-blue`: `#00AFCF`
  - `--accent-economy` / `brand-green`: `#52D95D`
  - `--accent-promo` / `brand-yellow`: `#FFC928`
- **16 Ícones 3D Glossy Autorais (`public/icons/`):**
  - `01-mercearia.jpg` a `07-padaria.jpg` (7 categorias de produtos na Home)
  - `08-sua-conta.jpg`, `09-minha-lista.jpg`, `10-seja-parceiro.jpg`, `11-entregas.jpg` (atalhos da Navbar e Subnav)
  - `12-qr-geral.jpg` a `16-qr-supermercado-ativo.jpg` (5 modalidades de QR Code em `/divulgacao`)
  - Todos seguem a moldura circular com arco azul, verde-limão e amarelo-ouro inspirada na logo oficial (`public/brand/logo-economize.jpg`).

## 3. Pacote de Entrega da Equipe (`entrega-equipe/`)
- **Vídeos Narrados em Português (Kokoro-82M v1.0, voz neural `pf_dora`):**
  - `entrega-equipe/video-lancamento-economize.mp4` (Horizontal `16:9`, `1920x1080`, `58,8s`)
  - `entrega-equipe/video-shorts-economize.mp4` (Vertical `9:16` Shorts/Reels, `1080x1920`, `28,0s`)
- **Roteiro de Dublagem Humana:** `entrega-equipe/ROTEIRO-DUBLAGEM.md` (também embutido em `entrega-equipe/RELATORIO-EQUIPE.html` e `RELATORIO-EQUIPE.md`)
- **QR Codes Oficiais:**
  - `entrega-equipe/qrcode-economize-nine.png` (`https://economize-nine.vercel.app`)
  - `entrega-equipe/qrcode-instagram-economizemais.png` (`https://www.instagram.com/economizemais_oficial`)

## 4. Arquitetura Técnica & Resiliência
- **Stack:** Next.js App Router, TypeScript estrito (zero `any`), Tailwind CSS, Supabase (PostgreSQL + RLS + Auth), Google Gemini API (`@google/genai` com fallback multi-chave em `getCandidateGeminiKeys()`), Remotion 4.
- **Regra Mestra:** Zero dados fictícios em produção. Sem dado no banco -> exibir Empty State honesto.
