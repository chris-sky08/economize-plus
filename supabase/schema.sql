-- =============================================================================
-- ECONOMIZE+ | SCHEMA COMPLETO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- "Compare. Escolha. Economize."
-- =============================================================================

-- 1. EXTENSÕES
create extension if not exists "uuid-ossp";

-- 2. PERFIS DE USUÁRIO (Vinculados ao auth.users do Supabase)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'consumidor' check (role in ('consumidor', 'mercado', 'entregador', 'admin')),
  city text default 'São Paulo',
  neighborhood text default 'Vila Mariana',
  zip_code text default '04101-000',
  consent_lgpd boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. PLANOS COMERCIAIS (Básico e Premium para Mercados Parceiros)
create table if not exists public.plans (
  id text primary key,
  name text not null,
  description text not null,
  features jsonb not null default '[]'::jsonb,
  price_defined boolean default false,
  monthly_price numeric(10,2),
  created_at timestamptz default now()
);

-- 4. MERCADOS PARCEIROS
create table if not exists public.markets (
  id text primary key,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  responsible_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  neighborhood text not null,
  city text not null,
  state text not null default 'SP',
  zip_code text not null,
  distance_km numeric(5,2),
  opening_hours text not null,
  plan_id text references public.plans(id) default 'basico',
  delivery_available boolean default false,
  delivery_info text default 'Entrega própria ou via entregadores parceiros em fase de implantação.',
  is_demo boolean default true,
  status text default 'ativo' check (status in ('pendente', 'ativo', 'suspenso')),
  last_catalog_update timestamptz default now(),
  created_at timestamptz default now()
);

-- 5. CATEGORIAS DE PRODUTOS
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  icon text not null,
  description text
);

-- 6. PRODUTOS (Catálogo Padronizado - sem misturar tamanhos ou medidas diferentes)
create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null,
  category_id text references public.categories(id) on delete restrict,
  size_label text not null,          -- Ex: '5 kg', '900 ml', '1 L', '500 g'
  unit_type text not null,           -- Ex: 'kg', 'L', 'un', '100g'
  unit_multiplier numeric(10,4) not null default 1, -- Fator para cálculo de preço por kg/L/un
  image_url text not null,
  is_popular boolean default false,
  is_demo boolean default true,
  created_at timestamptz default now()
);

-- 7. PREÇOS POR MERCADO (Relação Produto <-> Mercado)
create table if not exists public.market_prices (
  id uuid default uuid_generate_v4() primary key,
  market_id text references public.markets(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  price numeric(10,2) not null check (price > 0),
  regular_price numeric(10,2),
  is_promo boolean default false,
  promo_label text,
  in_stock boolean default true,
  is_sponsored boolean default false,
  updated_at timestamptz default now(),
  unique (market_id, product_id)
);

-- 8. HISTÓRICO DE ATUALIZAÇÃO DE PREÇOS
create table if not exists public.price_history (
  id uuid default uuid_generate_v4() primary key,
  market_id text references public.markets(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  old_price numeric(10,2),
  new_price numeric(10,2) not null,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz default now()
);

-- 9. LISTAS DE COMPRAS INTELIGENTES
create table if not exists public.shopping_lists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'Minha Lista de Compras',
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

-- 10. SOLICITAÇÕES DE CADASTRO DE MERCADOS PARCEIROS
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
  notes text,
  created_at timestamptz default now()
);

-- 11. ENTREGADORES PARCEIROS E OPERAÇÃO FUTURA DE ENTREGA
create table if not exists public.couriers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  vehicle_type text not null check (vehicle_type in ('bicicleta', 'moto', 'carro', 'utilitario')),
  service_neighborhoods text[] not null default '{}',
  status text default 'pre_cadastro' check (status in ('pre_cadastro', 'em_analise', 'aprovado', 'suspenso')),
  created_at timestamptz default now()
);

create table if not exists public.delivery_orders (
  id uuid default uuid_generate_v4() primary key,
  consumer_id uuid references public.profiles(id) on delete set null,
  market_id text references public.markets(id) on delete set null,
  courier_id uuid references public.couriers(id) on delete set null,
  status text not null default 'aguardando_confirmacao' check (
    status in ('aguardando_confirmacao', 'preparando', 'aguardando_coleta', 'em_entrega', 'entregue')
  ),
  delivery_fee numeric(10,2),
  estimated_minutes integer,
  delivery_region text,
  is_demo_simulation boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 12. DENÚNCIAS DE DADOS INCORRETOS E LOGS ADMINISTRATIVOS
create table if not exists public.price_reports (
  id uuid default uuid_generate_v4() primary key,
  market_id text references public.markets(id) on delete cascade,
  product_id text references public.products(id) on delete cascade,
  reason text not null,
  details text,
  status text default 'pendente' check (status in ('pendente', 'revisado', 'arquivado')),
  created_at timestamptz default now()
);

-- =============================================================================
-- SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.markets enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.market_prices enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.partner_applications enable row level security;
alter table public.couriers enable row level security;
alter table public.price_reports enable row level security;

-- Leitura pública para catálogo, categorias, mercados ativos e preços
create policy "Leitura pública de categorias" on public.categories for select using (true);
create policy "Leitura pública de planos" on public.plans for select using (true);
create policy "Leitura pública de mercados" on public.markets for select using (status = 'ativo');
create policy "Leitura pública de produtos" on public.products for select using (true);
create policy "Leitura pública de preços" on public.market_prices for select using (true);

-- Envios públicos de pré-cadastro de parceiros, entregadores e denúncias
create policy "Envio de solicitação de mercado parceiro" on public.partner_applications for insert with check (true);
create policy "Envio de pré-cadastro de entregador" on public.couriers for insert with check (true);
create policy "Envio de denúncia de preço" on public.price_reports for insert with check (true);

-- Isolamento por usuário nas listas de compras e perfis
create policy "Usuário vê o próprio perfil" on public.profiles for select using (auth.uid() = id);
create policy "Usuário edita o próprio perfil" on public.profiles for update using (auth.uid() = id);
create policy "Usuário gerencia suas listas" on public.shopping_lists for all using (auth.uid() = user_id);
create policy "Usuário gerencia itens de suas listas" on public.shopping_list_items for all using (
  exists (select 1 from public.shopping_lists s where s.id = list_id and s.user_id = auth.uid())
);

-- Isolamento de mercado parceiro (só altera preços do próprio estabelecimento)
create policy "Parceiro gerencia preços do próprio mercado" on public.market_prices for all using (
  exists (select 1 from public.markets m where m.id = market_id and m.owner_id = auth.uid())
);

-- =============================================================================
-- SEED INICIAL DE DADOS DEMONSTRATIVOS
-- =============================================================================
insert into public.plans (id, name, description, features, price_defined, monthly_price) values
  ('basico', 'Plano Básico', 'Presença digital local e cadastro de catálogo para mercados de bairro.', '["Perfil completo do estabelecimento", "Cadastro de produtos e preços", "Aparição na busca e no comparador de listas", "Alerta de preços desatualizados"]'::jsonb, false, null),
  ('premium', 'Plano Premium', 'Recursos avançados de visibilidade local, campanhas promocionais e métricas.', '["Tudo do Plano Básico", "Destaque patrocinado claramente identificado", "Divulgação de encartes e campanhas sazonais", "Painel avançado de visualizações e produtos mais buscados", "Importação rápida de catálogo via planilha"]'::jsonb, false, null)
on conflict (id) do nothing;

insert into public.categories (id, name, slug, icon, description) values
  ('mercearia', 'Mercearia', 'mercearia', 'Package', 'Arroz, feijão, óleo, massas, café e itens essenciais da despensa.'),
  ('hortifruti', 'Hortifruti', 'hortifruti', 'Apple', 'Frutas, verduras, legumes e temperos frescos selecionados.'),
  ('laticinios', 'Laticínios e Frios', 'laticinios', 'Milk', 'Leites, queijos, manteigas, iogurtes e ovos.'),
  ('bebidas', 'Bebidas', 'bebidas', 'CupSoda', 'Sucos, águas, refrigerantes e bebidas para a família.'),
  ('limpeza', 'Limpeza', 'limpeza', 'Sparkles', 'Sabão, detergente, desinfetante e cuidado com a casa.'),
  ('higiene', 'Higiene Pessoal', 'higiene', 'HeartHandshake', 'Sabonetes, shampoos, creme dental e papel higiênico.'),
  ('padaria', 'Padaria e Matinais', 'padaria', 'Croissant', 'Pães de forma, biscoitos, cereais e itens para o café da manhã.')
on conflict (id) do nothing;
