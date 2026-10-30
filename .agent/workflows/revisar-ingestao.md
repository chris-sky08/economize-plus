---
description: Audita as rotas /api/ingest/* (auth, dono do mercado, limites, validação de EAN, erros não engolidos, status pendente, validade de promoção).
---

# Workflow: /revisar-ingestao

1. Verifique `src/app/api/ingest/csv/route.ts`:
   - `requireMarketMember` ou `requireAdmin` ativo.
   - Limite de 2 MB e 5.000 linhas.
   - Parser CSV suportando aspas e `,` / `;`.
   - Validação de dígito verificador GTIN/EAN (8/12/13/14) e `price > 0`.
   - Upsert em lote sem `.then(() => {})`, retornando erros por linha.
2. Verifique `src/app/api/ingest/flyer/route.ts`:
   - Sem fallback de itens fictícios; retorna 503/422 se falhar ou faltar chave.
   - Upload no bucket privado `'encartes'`, processamento com Gemini e gravação com `source = 'flyer_ocr'` e `status = 'pendente'`.
