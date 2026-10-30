---
name: qa-completo
description: Executa a bateria completa de QA da Fase 10 (tsc --noEmit, lint, npm run build, npm audit, grep de mocks e validação visual 390x844 e 1440x900).
---

# Skill: /qa-completo

Execute a validação completa de qualidade antes de abrir PR ou publicar em produção:

1. **Verificação Estática e Build:**
   - `npx tsc --noEmit` (zero erros de TypeScript).
   - Script de lint compatível com o Next.js 16 instalado.
   - `npm run build` (todas as rotas e APIs compilando sem erro).
   - `npm audit` (verificação de vulnerabilidades nas dependências).
2. **Varredura Grep de Dados Fictícios (`src/` e `supabase/`):**
   - Confirme zero ocorrências indevidas para: `mock`, `INITIAL_`, `demonstra`, `fict`, `unsplash`, `3456`, `12.345.678`, `"Hoje, "`.
3. **Validação de Viewport e Console:**
   - Teste as rotas principais nos tamanhos Mobile (`390x844`) e Desktop (`1440x900`), verificando zero erros de console, zero falhas de hidratação e ausência de `overflow-x`.
4. **Relatório:**
   - Salve o resultado detalhado em `docs/qa-AAAA-MM-DD.md`.
