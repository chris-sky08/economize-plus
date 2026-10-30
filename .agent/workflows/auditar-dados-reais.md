---
description: Varre o repositório atrás de mocks, fallbacks inventados, textos de demonstração, contatos de exemplo e horários fixos; gera relatório com arquivo:linha.
---

# Workflow: /auditar-dados-reais

1. Execute busca por expressões regulares em `src/` e `supabase/` para: `mock`, `INITIAL_`, `demonstra`, `fict`, `unsplash`, `3456`, `12.345.678`, `"Hoje, "`, `"Agora mesmo"`, `"Marca Nacional"`, `"Catálogo Parceiro"`, `NEIGHBORHOOD_COORDS`, `loginDemoRole`.
2. Verifique se todas as fixtures estão isoladas em `tests/fixtures/`.
3. Documente o resultado com `arquivo:linha` em `docs/auditoria-AAAA-MM-DD.md`.
