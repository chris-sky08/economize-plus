---
name: pre-build
description: Executa a auditoria de dados reais (/auditar-dados-reais), auditoria de segurança Supabase (/seguranca-supabase) e o QA completo (/qa-completo) antes do deploy.
---

# Skill: /pre-build

Use este procedimento obrigatoriamente antes de qualquer PR ou deploy em produção:

1. **Passo 1 — `/auditar-dados-reais`:**
   - Varra `src/` e `supabase/` para confirmar zero mocks, zero contatos fictícios, zero fallbacks inventados e zero horários estáticos.
2. **Passo 2 — `/seguranca-supabase`:**
   - Audite RLS (zero policies de escrita com `using(true)`), uso restrito de `service_role` em `src/lib/server/` e proteção de `/admin` e `/painel-parceiro`.
3. **Passo 3 — `/qa-completo`:**
   - Rode `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm audit` e valide as resoluções `390x844` e `1440x900`.
