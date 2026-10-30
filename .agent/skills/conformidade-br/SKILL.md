---
name: conformidade-br
description: Confere CDC, LGPD e licença ODbL/CC BY-SA do Open Food Facts no Economize+ e lista pontos pendentes de validação jurídica/contábil.
---

# Skill: /conformidade-br

Execute esta auditoria de conformidade legal e atribuição de licenças:

1. **Código de Defesa do Consumidor (CDC - Lei 8.078/90):**
   - Verifique se todos os preços exibem claramente a origem (`source`), a data/hora completa da coleta (`collected_at` / `updated_at`), a validade da oferta (`valid_until` quando aplicável) e o aviso de que preços podem sofrer alteração na loja física.
   - Confirme que destaques patrocinados possuem identificação explícita (`Patrocinado`).
2. **Lei Geral de Proteção de Dados (LGPD - Lei 13.709/18):**
   - Verifique se a geolocalização do dispositivo nunca é acionada sem ação explícita do usuário.
   - Confirme que não há alegação promocional genérica de `"Compatível com a LGPD"` sem revisão jurídica concluída.
   - Verifique se a Política de Privacidade e os Termos de Uso descrevem exatamente o que o app coleta e trazem o selo `"Documento pendente de revisão jurídica formal"`.
3. **Licença Open Food Facts (ODbL 1.0 e CC BY-SA 3.0):**
   - Confirme que o rodapé (`Footer.tsx`) e a página de detalhe do produto (`/produto/[id]`) exibem a atribuição obrigatória ao Open Food Facts com link para `https://br.openfoodfacts.org`.
4. **Documentação:**
   - Mantenha `docs/conformidade.md` atualizado com a lista de validações jurídicas, fiscais e operacionais para profissional habilitado.
