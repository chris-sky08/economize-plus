---
id: 1
title: "Validação visual deve sempre inspecionar mobile 390x844 e checar classes Tailwind v4 em projetos Tailwind v3"
status: open
type: internal
skill: [qa-completo, polish-ui, arenaia]
proposes_skill: []
target_file: []
siblings_checked: "qa-family: qa-completo, polish-ui, arenaia — all added"
area: "Mobile viewport QA (390x844) and localStorage state migration"
date: 2026-11-07
session_context: "Revisão de 3 prints de celular mostrando modal cortado por h-13 w-13 no Tailwind v3 e 10 itens fantasmas na lista de compras"
parked_until:
resolved:
resolution:
reference:
commands_verified: none
next_actor:
use_evidence:
escalated:
---

**Issue:** O teste E2E anterior abriu o navegador apenas em `1440x900` (onde `sm:h-14 sm:w-14` funcionava), não detectando que em `< 640px` (`390x844`) a classe `h-13 w-13` não existe no Tailwind v3 (`3.4.17`), fazendo a imagem do cabeçalho do modal renderizar em `640x640px` e o botão `X` sobrepor o texto. Além disso, chaves legadas de `localStorage` (`economize_shopping_list`) com IDs antigos (`prod-1`..`prod-5`) continuavam inflando o contador para `10` unidades / `5` itens mesmo com `0` produtos reais renderizados.

**Suggested improvement:** Exigir em `qa-completo`, `polish-ui` e `arenaia` que (1) todo modal e página sejam abertos e fotografados na resolução mobile `390x844` além de `1440x900`, (2) classes exclusivas do Tailwind v4 (`h-13`, `w-13`, `shadow-2xs`, `shadow-xs`, `backdrop-blur-xs`) sejam mapeadas em `tailwind.config.ts` quando o projeto usar Tailwind v3, e (3) contadores de estado persistido (`localStorage`) filtrem apenas itens existentes no catálogo real.

**Principle:** Uma validação visual só é completa quando testa a resolução mobile real (`390x844`) com estado sujo/legado de `localStorage` e garante paridade entre a versão do framework CSS instalado e as classes utilitárias usadas.
