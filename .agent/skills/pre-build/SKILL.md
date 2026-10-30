---
name: pre-build
description: Executa checagem estrita de tipos TypeScript (tsc --noEmit), auditoria de segurança de variáveis e teste de build de produção Next.js antes do deploy na Vercel.
---

# Skill: /pre-build

Use este procedimento antes de qualquer deploy ou push para produção:

1. Rode `npx tsc --noEmit` e corrija qualquer alerta de tipagem.
2. Verifique se nenhuma chave privada foi exposta no código cliente.
3. Rode `npm run build` para validar todas as rotas estáticas e dinâmicas do Next.js.
