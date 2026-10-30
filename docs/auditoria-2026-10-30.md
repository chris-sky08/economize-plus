# Relatório de Auditoria: Dados Reais e Segurança Supabase (`2026-10-30`)

Este documento registra a execução dos workflows `/auditar-dados-reais` e `/seguranca-supabase` imediatamente após a **Fase 1 (Banco de Dados e Migrations)**, servindo como linha de base e verificação final para as Fases 2 a 10.

---

## 1. Inventário do Banco de Dados Supabase Antes da Migração

Antes de qualquer alteração destrutiva, o banco do projeto (`ezatyiuhwegqiuavrgfo`) foi inspecionado em modo somente-leitura e seu backup completo foi salvo em `tests/fixtures/backup-pre-migracao-2026-10-30.json` (fora do bundle da aplicação):

| Tabela no Banco | Linhas Encontradas | Observação da Inspeção Pré-Migração |
| :--- | :---: | :--- |
| `public.markets` (legada) | `4` | 4 mercados demonstrativos (`is_demo = true`, IDs `11111111-...` a `44444444-...`) |
| `public.categories` | `7` | 7 categorias iniciais |
| `public.products` | `18` | 18 produtos demonstrativos (`is_demo = true`) |
| `public.market_prices` | `54` | 54 preços demonstrativos (`is_demo = true`) |
| `public.shopping_lists` | `0` | Vazia |
| `public.shopping_list_items` | `0` | Vazia |
| `public.partner_applications` | `0` | Vazia |
| `public.couriers` | `0` | Vazia |
| `public.profiles` | `0` | Vazia (nenhum dado pessoal exposto) |
| `public.price_history` | `0` | Vazia |

---

## 2. Auditoria `/seguranca-supabase` (Pós-Fase 1)

### 2.1. Políticas RLS (`supabase/migrations/0001_dados_reais.sql` e `supabase/schema.sql`)
- **Remoção de `using (true)` / `with check (true)` em operações de escrita:**
  - Removidas as policies permissivas `"Inserção automática de novos produtos do Open Food Facts"`, `"Atualização de preços por parceiros e OCR"`, `"Envio de solicitação de parceria"`, `"Envio de pré-cadastro de entregador"` e `"Envio de relato de preço"`.
- **Novas Policies baseadas em `public.is_admin()` e `public.is_market_member(supermarket_id)`:**
  - `supermarkets`: leitura pública restrita a `status = 'ativo'` (ou dono/admin); `update` restrito ao membro do mercado apenas nas colunas `(phone, opening_hours, delivery_available, delivery_info)`.
  - `profiles`: leitura apenas do próprio usuário ou admin; `update` restrito a `(full_name)` pelo próprio usuário (`app_role` nunca pode ser alterado pelo cliente).
  - `market_members`: leitura restrita ao próprio usuário ou admin.
  - `products`: leitura pública (`select using (true)`); escrita realizada exclusivamente no servidor via `service_role`.
  - `market_prices`: leitura pública apenas quando `status = 'publicado'`, dentro da validade (`valid_until is null or valid_until > now()`) e com mercado `status = 'ativo'`. Inserção pelo dono exige `source in ('partner_manual', 'partner_csv', 'flyer_ocr')` e obriga `status = 'pendente'` quando `source = 'flyer_ocr'`.
  - `partner_applications`, `couriers`, `price_reports`: acesso direto via RLS restrito a `public.is_admin()`; submissões públicas passam pelas rotas de servidor `/api/public/*` com validação Cloudflare Turnstile e rate limit.
  - `storage.objects`: buckets `'encartes'` e `'evidencias'` privados (`public = false`), com acesso restrito ao dono do mercado (`encartes`) e ao admin (`evidencias`).

---

## 3. Auditoria `/auditar-dados-reais` — Mapeamento `arquivo:linha` (Pré-Fases 2 a 9)

A varredura inicial antes da limpeza do código cliente identificou os seguintes pontos que estão sendo eliminados nas Fases 2 a 9:

1. **Mocks e Seeds Estáticos (`INITIAL_*`, `DEFAULT_SHOPPING_LIST`, `mockData.ts`):**
   - `src/data/mockData.ts:206-1033` — `INITIAL_MARKETS`, `INITIAL_PRODUCTS`, `INITIAL_PRICES`, `DEFAULT_SHOPPING_LIST`, CNPJs `12.345.678/0001-10` a `45.678.901/0001-40`, telefones `(11) 3456-*` e horários `"Hoje, 08:40"`.
   - `src/context/AppContext.tsx:8-18, 126-189` — inicialização com `INITIAL_*` e exemplos de solicitações/denúncias.
2. **Autenticação Demonstrativa (`loginDemoRole` e `"mercado-a"`):**
   - `src/context/AppContext.tsx:76, 273, 398-432` — `loginDemoRole` e `marketId: "mercado-a"`.
   - `src/components/Navbar.tsx:36, 114` — seletor `"Alternar visão"`.
   - `src/app/conta/page.tsx:23, 111, 134, 410-453` — coluna `"Sessão Demonstrativa"`.
   - `src/app/admin/page.tsx:24, 50-53`, `src/app/painel-parceiro/page.tsx:32, 103`, `src/app/seja-parceiro/page.tsx:18, 95, 262`.
3. **Chaves e Fallbacks Inventados no Cliente Supabase e Ingestão:**
   - `src/lib/supabase.ts:6-9, 38-102` — URL/chave hardcoded e fallbacks (`"(11) 3456-0000"`, `"04101-000"`, `lat: -23.5849`, `distanceKm: 1.2`, `"Atualizado recentemente"`, `"Gerência"`, `"Marca"`).
   - `src/app/api/ingest/csv/route.ts:15, 87-96, 113` — default `"mercado-a"`, `"Catálogo Parceiro"` e `.then(() => {})`.
   - `src/app/api/ingest/flyer/route.ts:48, 117-141, 165` — default `"mercado-a"`, itens de exemplo (Camil, Liza, Piracanjuba) e `.then(() => {})`.
   - `src/services/productLookup.ts:31, 55, 69, 98-105, 148` — `"1 un"`, `|| 500`, ordem de `"água"` antes de `"limpeza"`, `"Marca Nacional"`.
   - `src/hooks/useUserLocation.ts:47-74` — `NEIGHBORHOOD_COORDS` e fallback para Vila Mariana.
   - `src/components/Footer.tsx:130-138` — contatos fictícios (`contato@economizemais.com.br`, `(11) 4000-1234`, `@economizemais`).
   - `next.config.mjs:14` — `images.unsplash.com`.

---

## 4. Resultado Pós-Execução das Fases 2 a 10

> Atualizado automaticamente na Fase 10 após a remoção completa de todos os itens acima e execução do grep final (ver também `docs/qa-2026-10-30.md`).
