---
description: Faz um pente-fino visual na tela atual focando em micro-interações, contraste, alinhamento, alvos de toque de 44px e responsividade mobile.
---

# Workflow: /polish-ui

Execute uma revisão rigorosa de acabamento visual (UI Polish) nos componentes da tela:

1. **Micro-interações e Fluidez (60fps):**
   - Adicione feedback tátil visual (`active:scale-95`, `transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]`) em todos os botões e cards interativos.
   - Garanta estados claros de `hover:` e `focus-visible:ring-2 focus-visible:ring-brand-yellow`.

2. **Hierarquia Tipográfica e Números:**
   - Aplique `tabular-nums` em todos os preços (`R$`), distâncias (`km`) e contadores de quantidade para alinhamento vertical perfeito.
   - Verifique o contraste entre texto e fundo (usando `#041834` sobre fundos claros `#FFFFFF` e `#EAF3FF`).

3. **Responsividade Mobile (390x844) e Safe Areas:**
   - Verifique se nenhum elemento gera `overflow-x` horizontal em telas de `390px` de largura.
   - Confirme que todos os botões de ação e seletores `- / +` possuem altura/largura mínima de `44px` para toque confortável no celular.
   - Garanta espaçamento inferior suficiente (`pb-24 md:pb-12`) para que a barra de navegação móvel fixa não cubra conteúdos.
