# Memória Viva do Projeto — Economize+ (`PROJECT_MEMORY.md`)

> Atualizado automaticamente pela skill `claude-mem`.

## 1. Identidade, Domínios, Redes e Contatos Oficiais
- **Nome Oficial:** Economize+ (*"Compare. Escolha. Economize."*)
- **Sede / Localização Oficial:** Bertioga, SP, Brasil
- **Domínio Oficial em Produção (Vercel):** `https://economize-nine.vercel.app`
- **E-mail Oficial Institucional:** `empresaeconomizemais@gmail.com`
- **Instagram Oficial:** `https://www.instagram.com/economizemais_oficial` (`@economizemais_oficial`)
- **Facebook Oficial:** Perfil direto `https://www.facebook.com/share/1Doz9GDF72/` (Página `Economize mais` — Bertioga, SP, Brazil)
- **Repositório Principal (`origin`):** `https://github.com/skyleywinfoster-netizen/economize-plus.git`
- **Repositório Conectado na Vercel (`chris`):** `https://github.com/chris-sky08/economize-plus.git` (ambos com permissão de push ativa — sempre rodar `git push origin main; git push chris main`)

## 2. Identidade Visual, Redesign Navy Premium & 30 Ícones Otimizados (.webp)
- **Paleta Oficial Ativa (`tailwind.config.ts` & `src/app/globals.css`):**
  - `--bg-surface` / `brand-surface`: `#F8FAFC`
  - `--bg-card` / `brand-white`: `#FFFFFF`
  - `--bg-soft` / `brand-light`: `#F0F7FF`
  - `--text-primary` / `brand-navy`: `#0F1E36`
  - `--accent` / `brand-blue`: `#2563EB`
  - `--accent-sky` / `brand-sky`: `#38BDF8`
  - `--accent-economy` / `brand-green`: `#16A34A`
  - `--accent-promo` / `brand-yellow`: `#F59E0B`
- **Framework & Segurança:** Next.js `16.4.6` (Turbopack) com `experimental.agentUpgrade: "security"`.
- **Logotipo Oficial Preservado Intacto:** `/logo-oficial.jpg` e `public/brand/logo-economize.jpg`.
- **30 Ícones Realistas de Varejo Estilo Magalu (`public/icons/*.webp` & `src/lib/icons.ts`):**
  - `01-mercearia.webp` a `07-padaria.webp` (7 departamentos principais)
  - `08-sua-conta.webp`, `09-minha-cesta.webp`, `10-seja-parceiro.webp`, `11-entregas.webp` (atalhos da Super-Header, Subnav e MobileBottomNav)
  - `12-qr-geral.webp` a `16-qr-supermercado-ativo.webp` (5 modalidades de QR Code em `/divulgacao`)
  - `17-scanner-ean.webp`, `18-preco-medida.webp`, `19-cesta-completa.webp`, `20-fonte-rastreavel.webp`, `21-passo-cep-gps.webp`, `22-passo-busca-ean.webp`, `23-passo-economia.webp`, `24-ciberseguranca.webp`, `25-avaliacao-feedback.webp`, `26-instagram-oficial.webp` a `29-canais-oficiais.webp` e `hero-magalu-economize.webp`.

## 3. Cibersegurança Red-Team & Blue-Team (`22/22` Testes Aprovados)
- **Módulo Server-Only (`src/lib/server/security.ts`):** Anti-CSRF (`validateSameOrigin`), Anti-XSS (`sanitizeText`), Anti-CSV/DDE Formula Injection (`sanitizeCsvCell`), Anti-Open Redirect (`validateSafeRedirectPath`), Anti-SSRF/Cloud Metadata (`validateSafeHttpUrl`), Checksum GS1 Modulo-10 (`validateGtinEan`), Magic Bytes binários (`validateFileMagicBytes`) e CNPJ Modulo-11 (`validateCnpj`).
- **Headers HTTP (`next.config.mjs`):** `poweredByHeader: false`, `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` e `Cross-Origin-Resource-Policy`.
- **Pentest Automatizado:** `node scripts/red-team-security-test.mjs` (`22/22` testes aprovados).

## 4. Pacote de Entrega da Equipe (`entrega-equipe/`)
- **Vídeos Narrados em Português (Kokoro-82M v1.0, voz neural `pf_dora`):**
  - `entrega-equipe/video-lancamento-economize.mp4` (`16:9`, `1920x1080`, `58,8s`)
  - `entrega-equipe/video-shorts-economize.mp4` (`9:16` Shorts/Reels, `1080x1920`, `28,0s`)
- **Roteiro de Dublagem Humana:** `entrega-equipe/ROTEIRO-DUBLAGEM.md`
