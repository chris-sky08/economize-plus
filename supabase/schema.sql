-- =============================================================================
-- ECONOMIZE+ | ARQUITETURA DE PRODUÇÃO COM 100% DADOS REAIS (SUPABASE / POSTGRESQL)
-- "Compare. Escolha. Economize."
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm with schema extensions;

-- 1. SUPERMERCADOS E MERCADOS DE BAIRRO (Sem defaults inventados)
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

-- 2. CATÁLOGO DE PRODUTOS PADRONIZADOS (Integrado ao Open Food Facts Brasil por EAN)
create table if not exists public.products (
  id text primary key,
  ean text unique not null,
  name text not null,
  brand text,
  category text,
  size_label text,
  unit_type text check (unit_type in ('kg', 'L', 'un', 'rolo')),
  unit_value numeric(10, 4),
  image_url text,
  is_popular boolean default false,
  description text,
  source text not null default 'manual' check (source in ('open_food_facts', 'partner', 'manual')),
  data_status text not null default 'pendente_revisao' check (data_status in ('completo', 'pendente_revisao')),
  off_fetched_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists products_name_trgm on public.products using gin (name extensions.gin_trgm_ops);

-- 3. PREÇOS POR MERCADO E FONTE DE CAPTURA RASTREÁVEL
create table if not exists public.market_prices (
  id uuid default uuid_generate_v4() primary key,
  supermarket_id text references public.supermarkets(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  price numeric(10, 2) not null check (price > 0),
  regular_price numeric(10, 2),
  is_promo boolean default false,
  promo_label text,
  in_stock boolean default true,
  is_sponsored boolean default false,
  source text not null check (source in ('partner_manual', 'partner_csv', 'flyer_ocr', 'nfce_qr', 'team_collected')),
  status text not null default 'pendente' check (status in ('pendente', 'publicado', 'rejeitado')),
  valid_from timestamptz,
  valid_until timestamptz,
  collected_at timestamptz not null default now(),
  evidence_path text,
  submitted_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  updated_at timestamptz default now(),
  unique (supermarket_id, product_id)
);

-- 4. PERFIS, PAPÉIS E VÍNCULO COM MERCADOS
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  app_role text not null default 'consumidor' check (app_role in ('consumidor', 'mercado', 'entregador', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.market_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  supermarket_id text not null references public.supermarkets(id) on delete cascade,
  member_role text not null default 'owner' check (member_role in ('owner', 'staff')),
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
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and app_role = 'admin');
$$;

create or replace function public.is_market_member(p_market text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.market_members where user_id = auth.uid() and supermarket_id = p_market);
$$;

-- 5. HISTÓRICO AUDITÁVEL DE PREÇOS
create table if not exists public.price_history (
  id bigint generated always as identity primary key,
  supermarket_id text not null references public.supermarkets(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  price numeric(10, 2) not null check (price > 0),
  is_promo boolean not null default false,
  source text not null,
  recorded_at timestamptz not null default now()
);

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

-- 6. LISTAS DE COMPRAS INTELIGENTES (Vinculadas ao auth.users)
create table if not exists public.shopping_lists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Minha Lista Economize+',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.shopping_list_items (
  id uuid default uuid_generate_v4() primary key,
  list_id uuid references public.shopping_lists(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  quantity integer not null default 1 check (quantity > 0),
  checked boolean default true,
  unique (list_id, product_id)
);

-- 7. SOLICITAÇÕES DE PARCERIA, ENTREGADORES E RELATOS DE PREÇOS (Inserção via API server-side com rate-limit/captcha)
create table if not exists public.partner_applications (
  id uuid default uuid_generate_v4() primary key,
  market_name text not null,
  responsible_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  neighborhood text not null,
  city text not null,
  zip_code text not null,
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

create table if not exists public.price_reports (
  id uuid default uuid_generate_v4() primary key,
  supermarket_id text references public.supermarkets(id) on delete cascade,
  product_id text references public.products(id) on delete cascade,
  reason text not null,
  details text,
  status text default 'pendente' check (status in ('pendente', 'revisado', 'arquivado')),
  created_at timestamptz default now()
);

-- =============================================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS ESTRITO, ZERO USING(TRUE) EM ESCRITA)
-- =============================================================================
alter table public.supermarkets enable row level security;
alter table public.products enable row level security;
alter table public.market_prices enable row level security;
alter table public.profiles enable row level security;
alter table public.market_members enable row level security;
alter table public.price_history enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.partner_applications enable row level security;
alter table public.couriers enable row level security;
alter table public.price_reports enable row level security;

create policy "mercados_leitura" on public.supermarkets for select
  using (status = 'ativo' or public.is_admin() or public.is_market_member(id));
create policy "mercados_edicao_dono" on public.supermarkets for update
  using (public.is_market_member(id)) with check (public.is_market_member(id));
revoke update on public.supermarkets from authenticated, anon;
grant update (phone, opening_hours, delivery_available, delivery_info) on public.supermarkets to authenticated;

create policy "perfil_leitura" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "perfil_edicao" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

create policy "membros_leitura" on public.market_members for select
  using (user_id = auth.uid() or public.is_admin());

create policy "produtos_leitura_publica" on public.products for select using (true);

create policy "precos_leitura_publica" on public.market_prices for select
  using (status = 'publicado'
    and (valid_until is null or valid_until > now())
    and exists (select 1 from public.supermarkets s where s.id = supermarket_id and s.status = 'ativo'));
create policy "precos_leitura_dono_admin" on public.market_prices for select
  using (public.is_admin() or public.is_market_member(supermarket_id));
create policy "precos_insercao_dono" on public.market_prices for insert
  with check (public.is_market_member(supermarket_id)
    and source in ('partner_manual', 'partner_csv', 'flyer_ocr')
    and (source <> 'flyer_ocr' or status = 'pendente'));
create policy "precos_edicao_dono" on public.market_prices for update
  using (public.is_market_member(supermarket_id))
  with check (public.is_market_member(supermarket_id) and source in ('partner_manual', 'partner_csv', 'flyer_ocr'));
create policy "precos_exclusao_dono" on public.market_prices for delete
  using (public.is_market_member(supermarket_id));
create policy "precos_admin_total" on public.market_prices for all
  using (public.is_admin()) with check (public.is_admin());

create policy "historico_leitura_publica" on public.price_history for select
  using (exists (select 1 from public.supermarkets s where s.id = supermarket_id and s.status = 'ativo'));

create policy "Usuário gerencia suas listas" on public.shopping_lists for all using (auth.uid() = user_id);
create policy "Usuário gerencia itens de suas listas" on public.shopping_list_items for all using (
  exists (select 1 from public.shopping_lists s where s.id = list_id and s.user_id = auth.uid())
);

create policy "solicitacoes_admin" on public.partner_applications for all
  using (public.is_admin()) with check (public.is_admin());
create policy "entregadores_admin" on public.couriers for all
  using (public.is_admin()) with check (public.is_admin());
create policy "relatos_admin" on public.price_reports for all
  using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- STORAGE PRIVADO (Buckets: 'encartes' e 'evidencias')
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('encartes', 'encartes', false), ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

create policy "encartes_upload_dono" on storage.objects for insert to authenticated
  with check (bucket_id = 'encartes' and public.is_market_member((storage.foldername(name))[1]));
create policy "encartes_leitura_dono" on storage.objects for select to authenticated
  using (bucket_id = 'encartes' and public.is_market_member((storage.foldername(name))[1]));
create policy "evidencias_admin" on storage.objects for all to authenticated
  using (bucket_id = 'evidencias' and public.is_admin())
  with check (bucket_id = 'evidencias' and public.is_admin());
