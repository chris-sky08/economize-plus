-- =============================================================================
-- ECONOMIZE+ | MIGRATION 0003: RESILIÊNCIA RLS PARA OPERAÇÃO COM JWT E FORMULÁRIOS
-- =============================================================================
begin;

-- 1. Supermercados: escrita total para Admin e atualização de perfil/updated_at pelo dono
drop policy if exists "mercados_admin_total" on public.supermarkets;
create policy "mercados_admin_total" on public.supermarkets for all
  using (public.is_admin())
  with check (public.is_admin());

grant insert, delete on public.supermarkets to authenticated;
grant update (
  name,
  cnpj,
  responsible_name,
  email,
  phone,
  address,
  neighborhood,
  city,
  state,
  zip_code,
  lat,
  lng,
  is_partner,
  opening_hours,
  plan_id,
  delivery_available,
  delivery_info,
  status,
  verified_at,
  updated_at
) on public.supermarkets to authenticated;

-- 2. Produtos: escrita permitida para Admin e Membros de Mercados Parceiros
drop policy if exists "produtos_escrita_parceiro_admin" on public.products;
create policy "produtos_escrita_parceiro_admin" on public.products
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.market_members m where m.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.market_members m where m.user_id = auth.uid()
    )
  );

-- 3. Formulários públicos validados pela API server-side (sem WITH CHECK (true))
do $$
begin
  alter table public.partner_applications alter column state drop not null;
exception when others then null;
end $$;

drop policy if exists "solicitacoes_insercao_validada" on public.partner_applications;
create policy "solicitacoes_insercao_validada" on public.partner_applications
  for insert to anon, authenticated
  with check (
    length(trim(market_name)) >= 2
    and length(trim(responsible_name)) >= 2
    and position('@' in email) > 1
    and status = 'em_analise'
  );

drop policy if exists "entregadores_insercao_validada" on public.couriers;
create policy "entregadores_insercao_validada" on public.couriers
  for insert to anon, authenticated
  with check (
    length(trim(full_name)) >= 2
    and position('@' in email) > 1
    and status = 'pre_cadastro'
  );

drop policy if exists "relatos_insercao_validada" on public.price_reports;
create policy "relatos_insercao_validada" on public.price_reports
  for insert to anon, authenticated
  with check (
    supermarket_id is not null
    and product_id is not null
    and length(trim(reason)) >= 3
    and status = 'pendente'
  );

commit;
