-- =============================================================================
-- ECONOMIZE+ | MIGRATION 0002: CADASTRO REAL DE CONSUMIDORES EM PUBLIC.PROFILES
-- E ÍNDICE DE HISTÓRICO DE PREÇOS POR PRODUTO
-- =============================================================================

-- 1. Colunas de cadastro real do consumidor em public.profiles
alter table public.profiles
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists city text,
  add column if not exists neighborhood text,
  add column if not exists cep text,
  add column if not exists lgpd_consent boolean default true,
  add column if not exists lgpd_consent_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- 2. Atualiza trigger de criação de usuário (auth.users -> public.profiles)
-- para gravar nome completo, e-mail, telefone, cidade, bairro, CEP e consentimento LGPD
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    city,
    neighborhood,
    cep,
    lgpd_consent,
    lgpd_consent_at,
    app_role,
    updated_at
  )
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'city', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'neighborhood', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'cep', '')), ''),
    case
      when new.raw_user_meta_data->>'lgpd_consent' in ('true', 'false')
        then (new.raw_user_meta_data->>'lgpd_consent')::boolean
      else true
    end,
    now(),
    case when lower(new.email) = 'skyleywinfoster@gmail.com' then 'admin' else 'consumidor' end,
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = coalesce(excluded.email, public.profiles.email),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    neighborhood = coalesce(excluded.neighborhood, public.profiles.neighborhood),
    cep = coalesce(excluded.cep, public.profiles.cep),
    lgpd_consent = coalesce(excluded.lgpd_consent, public.profiles.lgpd_consent),
    updated_at = now();
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Permissão explícita de atualização das colunas cadastrais do próprio consumidor autenticado
-- (sem permitir alteração de app_role)
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, city, neighborhood, cep, lgpd_consent, lgpd_consent_at, updated_at) on public.profiles to authenticated;

-- 4. Índice otimizado para consulta de histórico de preços por produto nos últimos 30 dias
create index if not exists price_history_product_recorded_idx
  on public.price_history (product_id, recorded_at desc);
