---
name: open-seo-audit
description: Audita e implementa SEO técnico completo (OpenSEO), documentação estruturada (AppFlowy/OpenProject) e captura de demonstrações (Cap) no projeto Economize+, garantindo sitemap.ts, robots.ts, OpenGraph, JSON-LD e performance mobile.
---

# OpenSEO & Open-Source Productivity Kit (`open-seo-audit`)

Inspirada no conjunto de ferramentas open-source de alta produtividade (**OpenSEO**, **OpenProject**, **AppFlowy**, **VoiceStudio**, **OpenWhispr**, **Cap**, **Cal.diy**, **Chatwoot** e **Open Higgsfield**):

## Quando usar
- Para auditar e gerar metadados de busca (`src/app/sitemap.ts`, `src/app/robots.ts`, `metadata` OpenGraph/Twitter Cards e Schema.org `WebApplication` / `Product` / `GroceryStore`).
- Para estruturar roadmaps de MVP, checklists de lançamento e documentação viva do produto sem depender de SaaS pagos.

## Checklist de Execução (OpenSEO no Next.js App Router)
1. **Metadados Globais (`src/app/layout.tsx`)**:
   - `title.template`, `description` clara sem superlativos proibidos, `openGraph`, `icons` apontando para o ícone circular oficial (`icon-512.png`, `apple-icon.png`, `favicon.ico`) e `manifest.ts`.
2. **Indexação Técnica**:
   - Verificar `sitemap.ts` e `robots.ts` com as rotas públicas (`/`, `/buscar`, `/lista`, `/mercados`, `/seja-parceiro`, `/entregas`, `/institucional`, `/divulgacao`).
   - Proteger rotas privadas (`/admin`, `/painel-parceiro`, `/api/*`) no `robots.ts`.
3. **Acessibilidade Semântica & Core Web Vitals**:
   - Apenas um `<h1>` por página, hierarquia `<h2>`/`<h3>` limpa, atributos `alt` descritivos com peso/medida nos produtos e atribuição ODbL ao Open Food Facts.
