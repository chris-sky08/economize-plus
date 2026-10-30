---
name: seguranca-supabase
description: Audita RLS, papéis, policies using(true), chaves expostas e rate limit no projeto Economize+, propondo migrations numeradas.
---

# Skill: /seguranca-supabase

Execute esta auditoria de segurança de banco de dados e autenticação:

1. **Auditoria de Chaves e Ambientes:**
   - Verifique se `src/` contém qualquer chave hardcoded (`sb_publishable_`, `eyJ`, `service_role`, URLs fixas do Supabase).
   - Confirme que `SUPABASE_SERVICE_ROLE_KEY` é lida apenas dentro de `src/lib/server/` (com `import "server-only"`).
2. **Auditoria de Row Level Security (RLS):**
   - Verifique em `supabase/schema.sql` e `supabase/migrations/` se todas as tabelas possuem `ENABLE ROW LEVEL SECURITY`.
   - Confirme que **nenhuma** policy de escrita (`INSERT`, `UPDATE`, `DELETE`, `ALL`) utiliza `USING (true)` ou `WITH CHECK (true)`.
   - Confirme que `public.profiles.app_role` e `public.market_members` são a única fonte de verdade de autorização (nunca `user_metadata`).
3. **Proteção de Rotas e Rate Limit:**
   - Confirme que `/admin`, `/admin/coleta` e `/painel-parceiro` são protegidos no servidor (`src/proxy.ts` + helpers `requireAdmin` / `requireMarketMember`).
   - Confirme que formulários públicos (`/api/public/*`) exigem validação de Cloudflare Turnstile e rate limit.
4. **Saída:**
   - Registre o resultado em `docs/auditoria-AAAA-MM-DD.md` e proponha migrations numeradas em `supabase/migrations/` caso encontre brechas.
