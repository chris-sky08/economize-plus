---
name: polish-ui
description: Faz um pente-fino visual na tela atual focando em micro-interações 60fps, contraste tipográfico, alinhamento tabular de preços e alvos de toque de 44px no mobile.
---

# Skill: /polish-ui

Use este procedimento para refinar o acabamento visual de componentes existentes:

1. **Micro-interações 60fps:** Aplique `active:scale-95` e transições com curva `cubic-bezier(0.22, 1, 0.36, 1)`.
2. **Alinhamento Numérico:** Aplique `tabular-nums` em todos os preços (`R$`), preços por quilo/litro e distâncias.
3. **Alvos de Toque e Safe Areas:** Garanta área mínima clicável de `44x44px` e respeito a `env(safe-area-inset-bottom)` na navegação móvel.
