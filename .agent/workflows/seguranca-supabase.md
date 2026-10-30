---
description: Audita RLS, papéis, policies using(true), chaves expostas e rate limit; propõe migrations numeradas.
---

# Workflow: /seguranca-supabase

1. Audite `supabase/schema.sql` e `supabase/migrations/*.sql` garantindo que nenhuma policy de escrita (`insert`, `update`, `delete`, `all`) utilize `using (true)` ou `with check (true)`.
2. Verifique se `SUPABASE_SERVICE_ROLE_KEY` existe apenas em `src/lib/server/` com `server-only`.
3. Verifique se `public.profiles.app_role` e `public.market_members` governam todas as permissões de `/admin` e `/painel-parceiro`.
4. Atualize `docs/auditoria-AAAA-MM-DD.md` com o parecer de segurança.
