---
description: Executa a Fase 10 completa de QA (tsc, lint, build, npm audit, grep de mocks e validação visual 390x844 e 1440x900).
---

# Workflow: /qa-completo

1. Rode `npx tsc --noEmit`.
2. Rode o lint do projeto (`npm run lint`).
3. Rode `npm run build` e `npm audit`.
4. Rode grep em `src/` e `supabase/` por: `mock`, `INITIAL_`, `demonstra`, `fict`, `unsplash`, `3456`, `12.345.678`, `"Hoje, "`.
5. Valide as páginas em `390x844` e `1440x900` (zero erros de console, zero erro de hidratação, zero `overflow-x`).
6. Gere ou atualize `docs/qa-AAAA-MM-DD.md`.
