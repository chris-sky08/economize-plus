---
description: Executa checagem estrita de tipos TypeScript, valida o build de produção Next.js e verifica prontidão para deploy na Vercel e Supabase.
---

# Workflow: /pre-build

Antes de enviar alterações para o GitHub / Vercel, execute esta sequência completa de verificação:

1. **Checagem Estrita de Tipos TypeScript:**
   ```powershell
   npx tsc --noEmit
   ```
   Corrija qualquer erro de tipagem ou uso indevido de tipos implícitos.

2. **Auditoria de Variáveis e Segurança:**
   - Confirme que nenhuma chave secreta (`service_role`) está presente em arquivos rastreados pelo Git.
   - Verifique se `.env.example` e `supabase/schema.sql` estão atualizados.

3. **Teste de Build de Produção Next.js:**
   ```powershell
   npm run build
   ```
   Certifique-se de que todas as rotas estáticas e dinâmicas compilam sem erros.

4. **Sincronização Git (Quando solicitado):**
   - Verifique `git status`, faça commit semântico e envie para `origin main` para acionar o deploy automático na Vercel.
