---
description: Cria uma nova tela completa seguindo o Design System do Economize+, com estados de loading/empty/erro, responsividade mobile-first e validação TypeScript.
---

# Workflow: /nova-tela

Ao criar uma nova página ou rota no projeto **Economize+**, execute obrigatoriamente os seguintes passos:

1. **Análise de Design Tokens e Referências:**
   - Verifique as variáveis CSS em `src/app/globals.css` (`--bg-surface`, `--text-primary`, `--accent`, `--accent-economy`, `--accent-promo`).
   - Se o usuário anexou imagem de referência, extraia primeiro a estrutura de grid, espaçamentos e hierarquia tipográfica (`Poppins` para títulos, `Inter` para dados).

2. **Implementação Completa dos 3 Estados:**
   - **Skeleton Loading:** Renderize placeholders estruturados enquanto dados assíncronos estiverem carregando.
   - **Empty State:** Caso a lista ou filtro retorne vazio, exiba card amigável com ícone, explicação clara e botão de ação para redefinir filtros ou ampliar o raio de localização.
   - **Error / Aviso de Transparência:** Inclua feedback acessível (`role="status"` / `aria-live="polite"`) e o aviso de dados demonstrativos quando aplicável.

3. **Regras Mobile-First e Acessibilidade:**
   - Garanta alvos de toque mínimos de `44x44px` (`min-h-[44px]`) e micro-interação `active:scale-95`.
   - Adicione `aria-label` em botões de ícone e rótulos associados em todos os campos de formulário.

4. **Validação Técnica e Visual:**
   - Execute `npx tsc --noEmit` para garantir zero erros de tipagem.
   - Verifique a página em `http://localhost:3000` nos tamanhos Desktop (`1440x900`) e Mobile (`390x844`).
