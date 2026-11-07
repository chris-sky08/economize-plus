---
name: claude-mem
description: Sistema de memoria persistente entre sessoes (.agent/memory/PROJECT_MEMORY.md) que lembra automaticamente a arquitetura, dominios, redes sociais, preferencias visuais, chaves configuradas e decisoes do Economize+ sem precisar reexplicar nada.
---

# ClaudeMem — Memória Persistente Entre Sessões (`.agent/memory/`)

Esta skill garante que nenhum agente ou subagente esqueça o contexto histórico, as decisões técnicas ou o estilo do usuário ao iniciar uma nova conversa.

## Como Funciona

1. **Leitura no Início da Tarefa**:
   - Sempre leia `.agent/memory/PROJECT_MEMORY.md` antes de iniciar alterações arquiteturais, visuais ou de deploy.
2. **Atualização Contínua (Write-Back)**:
   - Sempre que uma decisão importante for tomada (ex.: novo domínio, nova preferência de design, correção de bug recorrente, nova rota de API ou integração externa), atualize `.agent/memory/PROJECT_MEMORY.md` com data e resumo objetivo.
3. **Zero Re-Explicação**:
   - Nunca peça ao usuário informações que já constam em `.agent/memory/PROJECT_MEMORY.md` (como o link do site na Vercel, o `@` do Instagram, a paleta de cores, ou onde ficam os vídeos e QR Codes da equipe).
