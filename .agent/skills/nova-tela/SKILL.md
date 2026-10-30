---
name: nova-tela
description: Cria uma nova tela completa seguindo o Design System do Economize+, com estados de Skeleton Loading, Empty State, tratamento de erro, responsividade mobile-first e validação TypeScript.
---

# Skill: /nova-tela

Use este procedimento sempre que criar uma nova rota ou tela no projeto **Economize+**:

1. **Design Tokens:** Utilize as variáveis CSS em `src/app/globals.css` (`--bg-surface`, `--text-primary`, `--accent`, `--accent-economy`, `--accent-promo`) e a tipografia `Poppins` (títulos) + `Inter` (corpo).
2. **Estados Obrigatórios:** Implemente sempre Skeleton Loading, Empty State com ação de recuperação e avisos claros de transparência.
3. **Mobile-First:** Garanta alvos de toque mínimos de `44x44px`, `active:scale-95` e zero `overflow-x` em `390x844`.
4. **Validação:** Execute `npx tsc --noEmit` ao finalizar.
