---
name: agency-agents
description: Esquadrao completo Agency Agents (msitarzewski/agency-agents) com Orquestrador Central e mais de 280 especialistas divididos em Prospeccao, Vendas, Desenvolvimento, Marketing, Redes Sociais, Design, Seguranca, QA e Atendimento.
---

# Agency Agents — Empresa Completa de Agentes Especializados (`msitarzewski/agency-agents`)

Esta skill disponibiliza o catálogo completo de **Agency Agents** em `.agent/skills/agency-agents/divisions/`, organizado nas divisões apresentadas no vídeo `d6Fut1rMpHk`:

## Divisões Prontas em `.agent/skills/agency-agents/divisions/`

1. **Orquestrador Central (`divisions/specialized/agents-orchestrator.md` & `divisions/strategy/nexus-strategy.md`)**:
   - Recebe o objetivo de negócio ou produto, seleciona os especialistas necessários, distribui tarefas em paralelo via `define_subagent` + `invoke_subagent` e coordena a entrega integrada.
2. **Prospecção & Vendas (`divisions/sales/` & `divisions/specialized/sales-outreach.md`)**:
   - Prospecção de supermercados locais, mensagens personalizadas de abordagem B2B, estruturação de propostas comerciais, follow-up e agendamento de reuniões.
3. **Desenvolvimento & Engenharia (`divisions/engineering/`, `divisions/security/`, `divisions/testing/`)**:
   - Arquitetos Full-Stack Next.js/Supabase, especialistas em performance, segurança/RLS e automação de testes.
4. **Marketing & Tráfego Pago (`divisions/marketing/` & `divisions/paid-media/`)**:
   - Planejamento de campanhas locais, anúncios de aquisição de consumidores e lojistas, SEO e CRO.
5. **Redes Sociais & Conteúdo (`divisions/marketing/` & `divisions/design/`)**:
   - Calendário de publicações do `@economizemais_oficial`, roteiros de Reels/Shorts, direção de arte e guardião da identidade da marca (`design-brand-guardian.md`).
6. **Atendimento & Suporte (`divisions/support/` & `divisions/specialized/customer-service.md`)**:
   - Fluxos de suporte, respostas rápidas no WhatsApp e acompanhamento de sucesso do parceiro.

## Como Invocar no Antigravity

Quando o usuário pedir para acionar o time de agentes ou resolver uma demanda multidisciplinar:
1. Leia a persona correspondente em `.agent/skills/agency-agents/divisions/<divisao>/<agente>.md`.
2. Registre o especialista na conversa com `define_subagent` (usando o prompt do arquivo `.md` adaptado às regras do Economize+) e lance-o em paralelo com `invoke_subagent`.
