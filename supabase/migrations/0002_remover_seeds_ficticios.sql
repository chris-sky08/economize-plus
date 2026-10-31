-- =============================================================================
-- MIGRATION 0002: REMOÇÃO DOS SEEDS E MERCADOS FICTÍCIOS (CONFIRMADO PELO USUÁRIO)
-- Backup prévio salvo em: tests/fixtures/backup-pre-migracao-2026-10-30.json
-- =============================================================================
begin;

-- 1) Remove os 4 mercados fictícios pelo CNPJ (Anexo B)
-- As tabelas market_prices, price_history e price_reports desses mercados saem junto (on delete cascade)
delete from public.supermarkets where cnpj in
  ('12.345.678/0001-10','23.456.789/0001-20','34.567.890/0001-30','45.678.901/0001-40');

-- 2) Remove também por ID caso tenham sido inseridos sem CNPJ
delete from public.supermarkets where id in
  ('mercado-a','mercado-b','mercado-c','mercado-d');

-- 3) Caso a tabela legada public.markets do protótipo inicial exista no banco, limpa seus dados de demonstração
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'markets') then
    execute 'delete from public.markets where id in (
      ''11111111-1111-4111-8111-111111111111'',
      ''22222222-2222-4222-8222-222222222222'',
      ''33333333-3333-4333-8333-333333333333'',
      ''44444444-4444-4444-8444-444444444444'',
      ''mercado-a'', ''mercado-b'', ''mercado-c'', ''mercado-d''
    )';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'market_prices' and column_name = 'is_demo') then
    execute 'delete from public.market_prices where is_demo = true';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'is_demo') then
    execute 'delete from public.products where is_demo = true';
  end if;
end $$;

commit;
