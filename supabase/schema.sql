-- =============================================================================
-- ECONOMIZE+ | ARQUITETURA DE PRODUÇÃO (SUPABASE / POSTGRESQL)
-- "Compare. Escolha. Economize."
-- =============================================================================

create extension if not exists "uuid-ossp";

-- 1. SUPERMERCADOS E MERCADOS DE BAIRRO
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
  state text not null default 'SP',
  zip_code text default '04101-000',
  lat numeric(10, 7) not null,
  lng numeric(10, 7) not null,
  is_partner boolean default true,
  opening_hours text default 'Seg a Sáb: 07h às 21h • Dom: 08h às 14h',
  plan_id text default 'basico' check (plan_id in ('basico', 'premium')),
  delivery_available boolean default false,
  delivery_info text default 'Retirada em loja • Entrega parceira sob consulta regional',
  status text default 'ativo' check (status in ('pendente', 'ativo', 'suspenso')),
  updated_at timestamptz default now()
);

-- 2. CATÁLOGO DE PRODUTOS PADRONIZADOS (Integrado ao Open Food Facts Brasil por EAN)
create table if not exists public.products (
  id text primary key,
  ean text unique not null,
  name text not null,
  brand text not null,
  category text not null,
  size_label text not null,
  unit_type text not null check (unit_type in ('kg', 'L', 'un', 'rolo')),
  unit_value numeric(10, 4) not null default 1,
  image_url text not null,
  is_popular boolean default false,
  description text,
  created_at timestamptz default now()
);

-- 3. PREÇOS POR MERCADO E FONTE DE CAPTURA
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
  source text not null default 'partner_csv' check (source in ('partner_csv', 'nfce_qr', 'flyer_ocr')),
  updated_at timestamptz default now(),
  unique (supermarket_id, product_id)
);

-- 4. LISTAS DE COMPRAS INTELIGENTES (Vinculadas ao auth.users)
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

-- 5. SOLICITAÇÕES DE PARCERIA, ENTREGADORES E RELATOS DE PREÇOS
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
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- =============================================================================
alter table public.supermarkets enable row level security;
alter table public.products enable row level security;
alter table public.market_prices enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.partner_applications enable row level security;
alter table public.couriers enable row level security;
alter table public.price_reports enable row level security;

create policy "Leitura pública de supermercados" on public.supermarkets for select using (status = 'ativo');
create policy "Leitura pública de produtos" on public.products for select using (true);
create policy "Inserção automática de novos produtos do Open Food Facts" on public.products for insert with check (true);
create policy "Leitura pública de preços" on public.market_prices for select using (true);
create policy "Atualização de preços por parceiros e OCR" on public.market_prices for all using (true) with check (true);

create policy "Usuário gerencia suas listas" on public.shopping_lists for all using (auth.uid() = user_id);
create policy "Usuário gerencia itens de suas listas" on public.shopping_list_items for all using (
  exists (select 1 from public.shopping_lists s where s.id = list_id and s.user_id = auth.uid())
);

create policy "Envio de solicitação de parceria" on public.partner_applications for insert with check (true);
create policy "Envio de pré-cadastro de entregador" on public.couriers for insert with check (true);
create policy "Envio de relato de preço" on public.price_reports for insert with check (true);

-- =============================================================================
-- DADOS INICIAIS DE PRODUÇÃO (SUPERMERCADOS COM LAT/LNG E PRODUTOS COM EAN REAL)
-- =============================================================================
insert into public.supermarkets (id, name, cnpj, responsible_name, email, phone, address, neighborhood, city, state, zip_code, lat, lng, is_partner, plan_id)
values
  ('mercado-a', 'Supermercado Vila Mariana', '12.345.678/0001-10', 'Carlos Eduardo Mendes', 'contato@supervilamariana.com.br', '(11) 3456-1010', 'Rua Domingos de Morais, 410', 'Vila Mariana', 'São Paulo', 'SP', '04010-000', -23.5849000, -46.6388000, true, 'premium'),
  ('mercado-b', 'Mercadinho Super Bairro Saúde', '23.456.789/0001-20', 'Fernanda Costa', 'gerencia@superbairrosaude.com.br', '(11) 3456-2020', 'Av. Jabaquara, 890', 'Saúde', 'São Paulo', 'SP', '04045-000', -23.6119000, -46.6377000, true, 'premium'),
  ('mercado-c', 'Mini Mercado Vergueiro', '34.567.890/0001-30', 'Roberto Almeida', 'atendimento@minimercadovergueiro.com.br', '(11) 3456-3030', 'Rua Vergueiro, 1250', 'Vila Mariana', 'São Paulo', 'SP', '04101-000', -23.5778000, -46.6395000, true, 'basico'),
  ('mercado-d', 'Empório da Família Ipiranga', '45.678.901/0001-40', 'Juliana Ribeiro', 'contato@emporioipiranga.com.br', '(11) 3456-4040', 'Rua Silva Bueno, 620', 'Ipiranga', 'São Paulo', 'SP', '04208-000', -23.5882000, -46.6021000, true, 'basico')
on conflict (id) do nothing;
