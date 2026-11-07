---
name: superpowers
description: Sistema completo de planejamento estruturado, brainstorming, execucao guiada por subagentes, TDD, depuracao sistematica e revisao rigorosa antes de alterar o codigo em producao (obra/superpowers).
---

# Superpowers — Planejamento, Revisão e Engenharia com Subagentes (`obra/superpowers`)

Esta skill força o agente a **desacelerar, planejar com rigor e revisar o próprio código** antes de tocar nos arquivos de produção.

## Fluxo Obrigatório Superpowers

1. **Brainstorming & Design (`workflows/brainstorming/SKILL.md`)**:
   - Entenda o contexto completo, explore alternativas arquiteturais e valide o design antes de escrever código.
2. **Plano de Implementação (`workflows/writing-plans/SKILL.md`)**:
   - Quebre a funcionalidade em tarefas atômicas e verificáveis de 2 a 5 minutos cada, especificando arquivos exatos, tipos e testes.
3. **Desenvolvimento Guiado por Subagentes (`workflows/subagent-driven-development/SKILL.md` & `workflows/dispatching-parallel-agents/SKILL.md`)**:
   - Despache subagentes focados (`invoke_subagent`) para tarefas independentes e revise cada entrega em 2 estágios (conformidade com a especificação + qualidade de código).
4. **Depuração Sistemática (`workflows/systematic-debugging/SKILL.md`)**:
   - Rastreie a causa raiz em 4 fases (reprodução, isolamento, hipótese verificada e defesa em profundidade) — nunca aplique chutes paliativos.
5. **Verificação Antes de Concluir (`workflows/verification-before-completion/SKILL.md`)**:
   - No Economize+, execute obrigatoriamente `npx tsc --noEmit`, `npm run build` e validação visual (`1440x900` e `390x844`) antes de declarar qualquer tarefa concluída.
