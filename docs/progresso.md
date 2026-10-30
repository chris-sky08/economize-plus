# Progresso da Migração para Dados Reais (Economize+)

- **Branch ativa**: `feat/dados-reais`
- **Backup pré-migração salvo em**: `tests/fixtures/backup-pre-migracao-2026-10-30.json`
- **Auditoria completa**: `docs/auditoria-2026-10-30.md`
- **Conformidade legal/regulatória**: `docs/conformidade.md`
- **Relatório de QA**: `docs/qa-2026-10-30.md`

## Status das Fases

- [x] **Pausas Obrigatórias (1 a 5)**: Respondidas e confirmadas pelo usuário.
- [x] **Customizações `.agent/`**: Regras, 6 skills (`auditar-dados-reais`, `seguranca-supabase`, `revisar-ingestao`, `conformidade-br`, `qa-completo`, `voz-da-marca`) e workflows criados.
- [x] **Fase 1 — Banco (`supabase/migrations/`)**: `0001_dados_reais.sql`, `0002_remover_seeds_ficticios.sql` e `supabase/schema.sql` sem seeds fictícios e com RLS estrito.
- [x] **Fase 2 — Autenticação e Papéis**: Removidos `loginDemoRole`, barra `"Alternar visão"`, `"Sessão Demonstrativa"` e `"mercado-a"`. Criados `src/lib/server/auth.ts`, `src/app/api/auth/session/route.ts` e `src/proxy.ts` (Next.js 16 Proxy).
- [x] **Fase 3 — Fim do `mockData.ts` e Fallbacks**: `src/data/mockData.ts` removido; criados `src/types/domain.ts` e `src/lib/format.ts`; paginação e busca trigram em `src/lib/supabase.ts`; estados vazios honestos em todas as páginas.
- [x] **Fase 4 — Ingestão de Preços**: `/api/ingest/csv` com parser RFC-4180 e validação GTIN; `/api/ingest/flyer` com Gemini 3.8 Flash (`@google/genai`), bucket privado `'encartes'` e fila `status = 'pendente'`; `/api/ingest/review` com aprovação individual e em lote no `/painel-parceiro`.
- [x] **Fase 5 — Catálogo Open Food Facts**: Rota `/api/produtos/ean/[ean]` com `User-Agent` oficial e cache de 30 dias; atribuição ODbL 1.0 e CC BY-SA 3.0 no rodapé, `/institucional` e `/produto/[id]`.
- [x] **Fase 6 — Geolocalização e Distância**: Rota `/api/cep/[cep]` (ViaCEP + BrasilAPI v2 / Nominatim 1 req/s); `useUserLocation` sem coordenadas inventadas; exibição `"~ X km em linha reta"` somente quando há coordenadas reais.
- [x] **Fase 7 — Identidade Visual e PWA**: Paleta Opção B (`#063A6B`, `#00AFCF`, `#52D95D`, `#FFC928`), ícones PNG reais em `public/` sem texto pequeno, `manifest.ts` e `next.config.mjs` atualizados.
- [x] **Fase 8 — Operação Piloto**: Criadas as rotas `/api/admin/mercados` e `/api/admin/coleta` e a tela mobile-first `/admin/coleta` com scanner EAN e upload de foto da etiqueta para o bucket `'evidencias'` (`source = 'team_collected'`).
- [x] **Fase 9 — Conformidade Legal**: `/institucional` revisada com minuta técnica fiel e `docs/conformidade.md` criado.
- [x] **Fase 10 — QA Completo**: `npx tsc --noEmit`, `npm run lint`, `npm run build` e `npm audit` aprovados com zero erros e zero dados fictícios.
