---
name: auditar-dados-reais
description: Varre o repositório atrás de mocks, fallbacks inventados, textos de demonstração, contatos de exemplo e horários fixos, gerando relatório com arquivo:linha.
---

# Skill: /auditar-dados-reais

Execute esta auditoria para garantir conformidade total com a **REGRA MESTRA** (zero dados fictícios no código de aplicação e no banco):

1. **Varredura de Padrões Proibidos em `src/` e `supabase/`:**
   - Procure por identificadores de mock: `mock`, `INITIAL_`, `DEFAULT_SHOPPING_LIST`, `NEIGHBORHOOD_COORDS`, `loginDemoRole`, `isDemoAuth`.
   - Procure por textos de demonstração: `demonstra`, `fict`, `Simulação`, `Exemplo`.
   - Procure por URLs e contatos inventados: `unsplash`, `3456`, `4000-1234`, `economizemais.com.br`, `@economizemais`, `12.345.678`, `23.456.789`, `34.567.890`, `45.678.901`.
   - Procure por horários e fallbacks estáticos: `"Hoje, "`, `"Ontem, "`, `"Agora mesmo"`, `"Atualizado recentemente"`, `"Marca Nacional"`, `"Catálogo Parceiro"`, `|| 500`, `mercado-a`.
2. **Verificação de Separação de Fixtures:**
   - Confirme que qualquer fixture de teste reside exclusivamente em `tests/fixtures/` e nunca é importada por arquivos dentro de `src/`.
3. **Relatório:**
   - Liste todas as ocorrências encontradas no formato `arquivo:linha — trecho` ou confirme `0 ocorrências` em `docs/auditoria-AAAA-MM-DD.md`.
