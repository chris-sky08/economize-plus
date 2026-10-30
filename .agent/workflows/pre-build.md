---
description: Executa /auditar-dados-reais, /seguranca-supabase e /qa-completo antes de qualquer build ou deploy de produção.
---

# Workflow: /pre-build

Antes de enviar alterações para o GitHub / Vercel, execute obrigatoriamente:

1. **Etapa 1 — `/auditar-dados-reais`:**
   - Confirme ausência total de mocks, fallbacks inventados, contatos fictícios e horários estáticos em `src/` e `supabase/`.
2. **Etapa 2 — `/seguranca-supabase`:**
   - Confirme RLS sem `using(true)` em escrita, chaves secretas restritas a `src/lib/server/` e proteção server-side de `/admin` e `/painel-parceiro`.
3. **Etapa 3 — `/qa-completo`:**
   - Rode `npx tsc --noEmit`, `npm run lint`, `npm run build` e `npm audit`, validando as resoluções `390x844` e `1440x900`.
