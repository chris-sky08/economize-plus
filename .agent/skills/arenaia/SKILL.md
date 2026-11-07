---
name: arenaia
description: Comando /arenaia que cria e executa o torneio eliminatório de 30 agentes na Arena IA (.arena/) com estratégias distintas de engenharia, UX mobile-first (390x844), estado real sem fantasmas e QA visual no navegador real.
---

# `/arenaia` — Torneio de 30 Agentes Arena IA (Economize+)

Quando o usuário acionar `/arenaia` (ou pedir para rodar a Arena IA com 30 agentes):

1. **Inicialização Oficial de 30 Competidores (`bracket.py`)**:
   - Escreva a especificação completa do problema em `.arena/task.md` (incluindo prints enviados pelo usuário, requisitos mobile `390x844`, regras de estado limpo sem dados fantasmas e critérios de aceite).
   - Execute:
     ```bash
     python .agent/skills/arena-skill/bracket.py init --agents 30 --seed 20261107 --task-file .arena/task.md
     ```
2. **Batalha entre as 30 Estratégias (`spawn` -> `attack` -> `defend` -> `judge` -> `winner`)**:
   - Os 30 agentes recebem cartões de estratégia exclusivos sorteados de `strategies.json` (First Principles, Inversion, Adversarial Thinking, Edge-Case Driven, Mobile-First Ergonomics, State Invariant Verification, etc.).
   - Dispare subagentes para gerar, atacar, defender e julgar as soluções até restar 1 campeão invicto (`python .agent/skills/arena-skill/bracket.py winner`).
3. **Validação Obrigatória em Viewport Mobile Real (`390x844`) e Desktop (`1440x900`)**:
   - Nunca valide apenas em `1440x900`. Todo resultado campeão do `/arenaia` deve ser inspecionado em navegador Chromium real na resolução de celular (`390x844`) e desktop (`1440x900`), capturando screenshots reais antes de concluir.
