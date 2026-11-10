# Memória Viva do Projeto — Economize+ (`PROJECT_MEMORY.md`)

> Atualizado automaticamente pela skill `claude-mem`.

## 1. Identidade, Domínios, Redes e Contatos Oficiais
- **Nome Oficial:** Economize+ (*"Compare. Escolha. Economize."*)
- **Sede / Localização Oficial:** Bertioga, SP, Brasil
- **Domínio Oficial em Produção (Vercel):** `https://economize-nine.vercel.app`
- **E-mail Oficial Institucional:** `empresaeconomizemais@gmail.com`
- **Instagram Oficial:** `https://www.instagram.com/economizemais_oficial` (`@economizemais_oficial`)
- **Facebook Oficial:** Perfil direto `https://www.facebook.com/economizemaisoficial` (Página `Economize mais` — Bertioga, SP, Brazil)
- **Repositório Principal (`origin`):** `https://github.com/skyleywinfoster-netizen/economize-plus.git`
- **Repositório Conectado na Vercel (`chris`):** `https://github.com/chris-sky08/economize-plus.git` (ambos com permissão de push ativa — sempre rodar `git push origin main; git push chris main`)

## 2. Identidade Visual, Redesign Magalu & 25 Ícones Realistas
- **Paleta Oficial (Opção B):**
  - `--bg-surface`: `#F4FAFC`
  - `--bg-card`: `#FFFFFF`
  - `--bg-soft` / `brand-light`: `#E6F7FB`
  - `--text-primary` / `brand-navy`: `#063A6B`
  - `--accent` / `brand-blue`: `#00AFCF`
  - `--accent-economy` / `brand-green`: `#52D95D`
  - `--accent-promo` / `brand-yellow`: `#FFC928`
- **Logotipo Oficial Preservado Intacto:** `/logo-oficial.jpg` e `public/brand/logo-economize.jpg`.
- **25 Ícones Realistas de Varejo Estilo Magalu (`public/icons/` & `src/lib/icons.ts`):**
  - `01-mercearia.jpg` a `07-padaria.jpg` (7 departamentos principais)
  - `08-sua-conta.jpg`, `09-minha-lista.jpg`, `09-minha-cesta.jpg`, `10-seja-parceiro.jpg`, `11-entregas.jpg` (atalhos da Super-Header, Subnav e MobileBottomNav)
  - `12-qr-geral.jpg` a `16-qr-supermercado-ativo.jpg` (5 modalidades de QR Code em `/divulgacao`)
  - `17-scanner-ean.jpg`, `18-preco-medida.jpg`, `19-cesta-completa.jpg`, `20-fonte-rastreavel.jpg`, `21-passo-cep-gps.jpg`, `22-passo-busca-ean.jpg`, `23-passo-economia.jpg`, `24-ciberseguranca.jpg` e `hero-magalu-economize.jpg`.

## 3. Cibersegurança Red-Team & Blue-Team (`22/22` Testes Aprovados)
- **Módulo Server-Only (`src/lib/server/security.ts`):** Anti-CSRF (`validateSameOrigin`), Anti-XSS (`sanitizeText`), Anti-CSV/DDE Formula Injection (`sanitizeCsvCell`), Anti-Open Redirect (`validateSafeRedirectPath`), Anti-SSRF/Cloud Metadata (`validateSafeHttpUrl`), Checksum GS1 Modulo-10 (`validateGtinEan`), Magic Bytes binários (`validateFileMagicBytes`) e CNPJ Modulo-11 (`validateCnpj`).
- **Headers HTTP (`next.config.mjs`):** `poweredByHeader: false`, `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` e `Cross-Origin-Resource-Policy`.
- **Pentest Automatizado:** `node scripts/red-team-security-test.mjs` (`22/22` testes aprovados).

## 4. Pacote de Entrega da Equipe (`entrega-equipe/`)
- **Vídeos Narrados em Português (Kokoro-82M v1.0, voz neural `pf_dora`):**
  - `entrega-equipe/video-lancamento-economize.mp4` (`16:9`, `1920x1080`, `58,8s`)
  - `entrega-equipe/video-shorts-economize.mp4` (`9:16` Shorts/Reels, `1080x1920`, `28,0s`)
- **Roteiro de Dublagem Humana:** `entrega-equipe/ROTEIRO-DUBLAGEM.md`
