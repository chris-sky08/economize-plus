-- =============================================================================
-- MIGRATION 0001: ARQUITETURA DE DADOS REAIS, PERFIS, HISTÓRICO E RLS ESTRITO
-- =============================================================================
begin;

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm with schema extensions;

-- 0) Garantir que as tabelas base existam caso o banco venha da estrutura anterior (markets -> supermarkets)
create table if not exists public.supermarkets (
  id text primary key,
  name text not null,
  cnpj text unique,
  responsible_name text,
  email text,
  phone text,
  address text not null,
  neighborhood text not null,
  city text not null,
  state text not null,
  zip_code text,
  lat numeric(10, 7),
  lng numeric(10, 7),
  is_partner boolean default false,
  opening_hours text,
  plan_id text default 'basico' check (plan_id in ('basico', 'premium')),
  delivery_available boolean default false,
  delivery_info text,
  status text default 'pendente' check (status in ('pendente', 'ativo', 'suspenso')),
  verified_at timestamptz,
  updated_at timestamptz default now()
);


create table if not exists public.partner_applications (
  id uuid default uuid_generate_v4() primary key,
  market_name text not null,
  cnpj text,
  responsible_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  state text not null,
  neighborhood text not null default '',
  address text not null default '',
  zip_code text not null default '',
  desired_plan text default 'basico',
  status text default 'em_analise' check (status in ('em_analise', 'aprovado', 'recusado')),
  created_at timestamptz default now()
);

create table if not exists public.couriers (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  vehicle_type text not null check (vehicle_type in ('bicicleta', 'moto', 'carro', 'utilitario')),
  service_neighborhoods text[] not null default '{}',
  status text default 'pre_cadastro' check (status in ('pre_cadastro', 'em_analise', 'aprovado', 'suspenso')),
  created_at timestamptz default now()
);

create table if not exists public.shopping_lists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null default 'Minha Lista',
  updated_at timestamptz default now()
);

create table if not exists public.shopping_list_items (
  id uuid default uuid_generate_v4() primary key,
  list_id uuid references public.shopping_lists(id) on delete cascade,
  product_id text references public.products(id) on delete cascade,
  quantity integer not null default 1,
  checked boolean not null default true,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.price_reports (
  id uuid default uuid_generate_v4() primary key,
  supermarket_id text references public.supermarkets(id) on delete cascade,
  product_id text references public.products(id) on delete cascade,
  reason text not null,
  details text,
  status text default 'pendente' check (status in ('pendente', 'revisado', 'arquivado')),
  created_at timestamptz default now()
);

-- Compatibilidade caso products/market_prices tenham sido criados pelo schema inicial
alter table public.products add column if not exists ean text unique;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists size_label text;
alter table public.products add column if not exists unit_value numeric(10, 4);
alter table public.products add column if not exists description text;

alter table public.market_prices add column if not exists supermarket_id text references public.supermarkets(id) on delete cascade;
alter table public.market_prices add column if not exists price numeric(10, 2);
alter table public.market_prices add column if not exists is_promo boolean default false;
alter table public.market_prices add column if not exists is_sponsored boolean default false;
alter table public.market_prices add column if not exists source text;

-- 1) Fim dos valores padrão que inventam dados
alter table public.supermarkets alter column is_partner set default false;
alter table public.supermarkets alter column status set default 'pendente';
alter table public.supermarkets alter column state drop default;
alter table public.supermarkets alter column zip_code drop default;
alter table public.supermarkets alter column opening_hours drop default;
alter table public.supermarkets alter column delivery_info drop default;
alter table public.supermarkets add column if not exists verified_at timestamptz;

alter table public.products alter column category drop not null;
alter table public.products alter column brand drop not null;
alter table public.products alter column size_label drop not null;
alter table public.products alter column unit_type drop not null;
alter table public.products alter column unit_value drop not null;
alter table public.products alter column unit_value drop default;
alter table public.products alter column image_url drop not null;
alter table public.products add column if not exists source text not null default 'manual'
  check (source in ('open_food_facts','partner','manual'));
alter table public.products add column if not exists data_status text not null default 'pendente_revisao'
  check (data_status in ('completo','pendente_revisao'));
alter table public.products add column if not exists off_fetched_at timestamptz;
create index if not exists products_name_trgm on public.products using gin (name extensions.gin_trgm_ops);

-- 2) Preços: revisão, validade, evidência e nova fonte
alter table public.market_prices add column if not exists status text not null default 'pendente'
  check (status in ('pendente','publicado','rejeitado'));
alter table public.market_prices add column if not exists valid_from timestamptz;
alter table public.market_prices add column if not exists valid_until timestamptz;
alter table public.market_prices add column if not exists collected_at timestamptz not null default now();
alter table public.market_prices add column if not exists evidence_path text;
alter table public.market_prices add column if not exists submitted_by uuid references auth.users(id);
alter table public.market_prices add column if not exists reviewed_by uuid references auth.users(id);
alter table public.market_prices add column if not exists reviewed_at timestamptz;
alter table public.market_prices drop constraint if exists market_prices_source_check;
alter table public.market_prices add constraint market_prices_source_check
  check (source in ('partner_manual','partner_csv','flyer_ocr','nfce_qr','team_collected'));
alter table public.market_prices alter column source drop default;

-- 3) Perfis, papéis e donos de mercado
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  app_role text not null default 'consumidor'
    check (app_role in ('consumidor','mercado','entregador','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists app_role text not null default 'consumidor'
  check (app_role in ('consumidor','mercado','entregador','admin'));

create table if not exists public.market_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  supermarket_id text not null references public.supermarkets(id) on delete cascade,
  member_role text not null default 'owner' check (member_role in ('owner','staff')),
  created_at timestamptz not null default now(),
  primary key (user_id, supermarket_id)
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, app_role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    case when lower(new.email) = 'skyleywinfoster@gmail.com' then 'admin' else 'consumidor' end
  )
  on conflict (id) do update
    set app_role = case when lower(new.email) = 'skyleywinfoster@gmail.com' then 'admin' else public.profiles.app_role end;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name)
select id, raw_user_meta_data->>'full_name' from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and app_role = 'admin');
$$;
create or replace function public.is_market_member(p_market text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.market_members where user_id = auth.uid() and supermarket_id = p_market);
$$;

-- 4) Histórico de preços
create table if not exists public.price_history (
  id bigint generated always as identity primary key,
  supermarket_id text not null references public.supermarkets(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  price numeric(10,2) not null check (price > 0),
  is_promo boolean not null default false,
  source text not null,
  recorded_at timestamptz not null default now()
);
alter table public.price_history add column if not exists supermarket_id text references public.supermarkets(id) on delete cascade;
alter table public.price_history add column if not exists price numeric(10,2);
alter table public.price_history add column if not exists is_promo boolean not null default false;
alter table public.price_history add column if not exists source text;
alter table public.price_history add column if not exists recorded_at timestamptz not null default now();
create index if not exists price_history_idx on public.price_history (supermarket_id, product_id, recorded_at desc);

create or replace function public.log_price_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'publicado' and (
       tg_op = 'INSERT'
       or new.price is distinct from old.price
       or new.status is distinct from old.status) then
    insert into public.price_history (supermarket_id, product_id, price, is_promo, source, recorded_at)
    values (new.supermarket_id, new.product_id, new.price, new.is_promo, new.source, coalesce(new.collected_at, now()));
  end if;
  return new;
end $$;
drop trigger if exists trg_log_price_history on public.market_prices;
create trigger trg_log_price_history after insert or update on public.market_prices
  for each row execute function public.log_price_history();

-- 5) RLS
alter table public.supermarkets enable row level security;
alter table public.products enable row level security;
alter table public.market_prices enable row level security;
alter table public.price_reports enable row level security;
alter table public.profiles enable row level security;
alter table public.market_members enable row level security;
alter table public.price_history enable row level security;

drop policy if exists "Leitura pública de supermercados" on public.supermarkets;
drop policy if exists "Leitura pública de produtos" on public.products;
drop policy if exists "Inserção automática de novos produtos do Open Food Facts" on public.products;
drop policy if exists "Leitura pública de preços" on public.market_prices;
drop policy if exists "Atualização de preços por parceiros e OCR" on public.market_prices;
drop policy if exists "Parceiro gerencia preços do próprio mercado" on public.market_prices;
drop policy if exists "Envio de solicitação de parceria" on public.partner_applications;
drop policy if exists "Envio de solicitação de mercado parceiro" on public.partner_applications;
drop policy if exists "Envio de pré-cadastro de entregador" on public.couriers;
drop policy if exists "Envio de relato de preço" on public.price_reports;
drop policy if exists "Envio de denúncia de preço" on public.price_reports;

drop policy if exists "mercados_leitura" on public.supermarkets;
drop policy if exists "mercados_edicao_dono" on public.supermarkets;
create policy "mercados_leitura" on public.supermarkets for select
  using (status = 'ativo' or public.is_admin() or public.is_market_member(id));
create policy "mercados_edicao_dono" on public.supermarkets for update
  using (public.is_market_member(id)) with check (public.is_market_member(id));
revoke update on public.supermarkets from authenticated, anon;
grant update (phone, opening_hours, delivery_available, delivery_info) on public.supermarkets to authenticated;

drop policy if exists "perfil_leitura" on public.profiles;
drop policy if exists "perfil_edicao" on public.profiles;
create policy "perfil_leitura" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "perfil_edicao" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

drop policy if exists "membros_leitura" on public.market_members;
create policy "membros_leitura" on public.market_members for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "produtos_leitura_publica" on public.products;
create policy "produtos_leitura_publica" on public.products for select using (true);

drop policy if exists "precos_leitura_publica" on public.market_prices;
drop policy if exists "precos_leitura_dono_admin" on public.market_prices;
drop policy if exists "precos_insercao_dono" on public.market_prices;
drop policy if exists "precos_edicao_dono" on public.market_prices;
drop policy if exists "precos_exclusao_dono" on public.market_prices;
drop policy if exists "precos_admin_total" on public.market_prices;

create policy "precos_leitura_publica" on public.market_prices for select
  using (status = 'publicado'
    and (valid_until is null or valid_until > now())
    and exists (select 1 from public.supermarkets s where s.id = supermarket_id and s.status = 'ativo'));
create policy "precos_leitura_dono_admin" on public.market_prices for select
  using (public.is_admin() or public.is_market_member(supermarket_id));
create policy "precos_insercao_dono" on public.market_prices for insert
  with check (public.is_market_member(supermarket_id)
    and source in ('partner_manual','partner_csv','flyer_ocr')
    and (source <> 'flyer_ocr' or status = 'pendente'));
create policy "precos_edicao_dono" on public.market_prices for update
  using (public.is_market_member(supermarket_id))
  with check (public.is_market_member(supermarket_id) and source in ('partner_manual','partner_csv','flyer_ocr'));
create policy "precos_exclusao_dono" on public.market_prices for delete
  using (public.is_market_member(supermarket_id));
create policy "precos_admin_total" on public.market_prices for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "historico_leitura_publica" on public.price_history;
create policy "historico_leitura_publica" on public.price_history for select
  using (exists (select 1 from public.supermarkets s where s.id = supermarket_id and s.status = 'ativo'));

drop policy if exists "solicitacoes_admin" on public.partner_applications;
create policy "solicitacoes_admin" on public.partner_applications for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "entregadores_admin" on public.couriers;
create policy "entregadores_admin" on public.couriers for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "relatos_admin" on public.price_reports;
create policy "relatos_admin" on public.price_reports for all
  using (public.is_admin()) with check (public.is_admin());

-- 6) Storage privado
insert into storage.buckets (id, name, public)
values ('encartes','encartes',false), ('evidencias','evidencias',false)
on conflict (id) do nothing;

drop policy if exists "encartes_upload_dono" on storage.objects;
drop policy if exists "encartes_leitura_dono" on storage.objects;
drop policy if exists "evidencias_admin" on storage.objects;

create policy "encartes_upload_dono" on storage.objects for insert to authenticated
  with check (bucket_id = 'encartes' and public.is_market_member((storage.foldername(name))[1]));
create policy "encartes_leitura_dono" on storage.objects for select to authenticated
  using (bucket_id = 'encartes' and public.is_market_member((storage.foldername(name))[1]));
create policy "evidencias_admin" on storage.objects for all to authenticated
  using (bucket_id = 'evidencias' and public.is_admin())
  with check (bucket_id = 'evidencias' and public.is_admin());

-- 7) Atribuição da conta Admin confirmada na Pausa 3 (skyleywinfoster@gmail.com)
update public.profiles
set app_role = 'admin'
where id = (select id from auth.users where lower(email) = 'skyleywinfoster@gmail.com');

commit;
