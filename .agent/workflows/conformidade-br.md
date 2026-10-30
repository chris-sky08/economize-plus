---
description: Confere CDC, LGPD e licença do Open Food Facts; lista o que validar com profissional em docs/conformidade.md.
---

# Workflow: /conformidade-br

1. Verifique a transparência de preços (CDC): origem (`source`), data/hora completa (`collected_at` / `updated_at`), selo de desatualizado (> 7 dias) e aviso de alteração na loja física.
2. Verifique a conformidade de privacidade (LGPD): permissão antes do GPS, ausência de selo promocional `"Compatível com a LGPD"` e termos marcados como `"pendente de revisão jurídica"`.
3. Verifique a atribuição obrigatória do Open Food Facts (ODbL / CC BY-SA) no rodapé e na página do produto.
4. Atualize `docs/conformidade.md`.
