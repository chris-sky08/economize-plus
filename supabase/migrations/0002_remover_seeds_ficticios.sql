-- =============================================================================
-- MIGRATION 0002: LIMPEZA DE REGISTROS LEGADOS DE TESTE
-- Backup salvo em: tests/fixtures/backup-pre-migracao-2026-10-30.json
-- =============================================================================
begin;

-- 1) Remove registros legados sem origem verificada
delete from public.supermarkets
where id like 'mercado-%'
   or (cnpj is not null and cnpj like '__.___.___/0001-_0');

-- 2) Caso a tabela legada public.markets do prototipo inicial exista no banco, limpa seus registros legados
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'markets') then
    execute 'delete from public.markets where id like ''mercado-%'' or id like ''11111111-%'' or id like ''22222222-%'' or id like ''33333333-%'' or id like ''44444444-%''';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'market_prices' and column_name = 'is_demo') then
    execute 'delete from public.market_prices where is_demo = true';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'is_demo') then
    execute 'delete from public.products where is_demo = true';
  end if;
end $$;

commit;
