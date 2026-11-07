-- ============================================================================
-- Migration 20261107_002: Tabela public.user_feedback (Avaliações, Sugestões e Bugs)
-- Integrada com envio automático para empresaeconomizemais@gmail.com e painel /admin
-- ============================================================================

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  rating smallint not null check (rating >= 1 and rating <= 5),
  category text not null check (category in ('sugestao', 'bug', 'indicar_mercado', 'duvida')),
  message text not null check (char_length(message) >= 5 and char_length(message) <= 1500),
  sender_name text,
  sender_contact text,
  page_path text,
  email_dispatched boolean not null default false,
  status text not null default 'novo' check (status in ('novo', 'lido', 'resolvido')),
  created_at timestamptz not null default now()
);

alter table public.user_feedback enable row level security;

-- Apenas administradores autenticados leem/atualizam pelo cliente; escrita pública passa exclusivamente pela rota /api/public/feedback (service_role + anti-spam + rate limit)
drop policy if exists "admin_select_user_feedback" on public.user_feedback;
create policy "admin_select_user_feedback"
  on public.user_feedback
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "admin_update_user_feedback" on public.user_feedback;
create policy "admin_update_user_feedback"
  on public.user_feedback
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
