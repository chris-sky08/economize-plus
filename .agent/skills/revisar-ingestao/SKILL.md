---
name: revisar-ingestao
description: Audita as rotas /api/ingest/* verificando autenticação, vínculo com mercado, limites de payload, validação GTIN/EAN, tratamento de erros, status pendente para OCR e validade de promoção.
---

# Skill: /revisar-ingestao

Use este procedimento para auditar as rotas `POST /api/ingest/csv` e `POST /api/ingest/flyer`:

1. **Autenticação e Vínculo de Mercado:**
   - Confirme que ambas as rotas chamam `requireMarketMember` ou `requireAdmin` no servidor.
   - O `supermarket_id` deve vir de `public.market_members` (ou ser validado contra ele), nunca de um fallback como `"mercado-a"`.
2. **Ingestão CSV (`POST /api/ingest/csv`):**
   - Limite máximo de `2 MB` e `5.000 linhas`.
   - Parser CSV real suportando campos entre aspas e delimitadores `,` ou `;`.
   - Validação de GTIN/EAN (8, 12, 13 ou 14 dígitos com cálculo do dígito verificador módulo 10) e `price > 0`.
   - Upsert em lote (sem `await` linha a linha em loop desnecessário), retornando erros detalhados por linha e **nunca engolindo erros** (proibido `.then(() => {})`).
   - Produtos com EAN desconhecido entram com `data_status = 'pendente_revisao'` e campos desconhecidos como `null` (sem inventar `"Catálogo Parceiro"` ou `"1 un"`), tentando enriquecer via Open Food Facts no servidor.
3. **Ingestão de Encarte por IA (`POST /api/ingest/flyer`):**
   - Zero itens fictícios de fallback (Camil, Liza, Piracanjuba). Sem `GEMINI_API_KEY` ou sem itens extraídos, retorne HTTP `503` ou `422` sem gravar no banco.
   - Upload do arquivo para o bucket privado `'encartes'` no Supabase Storage e processamento a partir de lá.
   - Schema estruturado exigindo `ean`, `valid_from` e `valid_until`, gravando em `market_prices` com `source = 'flyer_ocr'` e `status = 'pendente'` para revisão humana obrigatória em `/painel-parceiro`.
