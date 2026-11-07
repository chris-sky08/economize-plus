---
name: design-anti-ia
description: Pipeline completo em 5 etapas (Taste Skill, Auditoria Vercel, 74 Design Systems de grandes marcas como Stripe/Apple/Linear, Print-to-Code e Playwright Visual QA) para eliminar a cara generica de IA (fundo escuro roxo neon tudo centralizado) do app.
---

# Como Tirar a Cara de IA do seu App — Pipeline em 5 Etapas

A maioria dos apps gerados por IA denuncia sua origem em 2 segundos: fundo escuro genérico, gradiente roxo/azul sem função, tudo centralizado e ícones repetitivos sem peso visual. Esta skill aplica os **5 pilares na ordem exata**: **Gosto primeiro -> Auditoria depois -> Navegador no fim**.

## Os 5 Pilares (Ordem de Execução Obrigatória)

### 1. Taste Skill (Gosto de Design Refinado)
- **Proibido estética "AI-Slop":** Nunca use fundo escuro com glow roxo/neon, gradientes decorativos sem função ou blocos de 3 cards idênticos centralizados sem hierarquia.
- **Contraste & Ritmo Espacial:** Alterne seções densas de dados com respiro generoso (`#F4FAFC` no fundo, `#FFFFFF` nos cards com bordas sutis `border-slate-200/80` e sombras em camadas suaves).
- **Tipografia com Personalidade:** `Poppins` (`tracking-tight`, pesos `600`/`700`/`800`) nos títulos e `Inter` com `tabular-nums` obrigatório em todos os preços, distâncias, porcentagens e contadores.
- **Iconografia Autoral:** Priorize os 16 ícones 3D glossy oficiais do Economize+ (`public/icons/01-mercearia.jpg` a `16-qr-supermercado-ativo.jpg`) combinados com micro-interações táteis (`active:scale-95`, `hover:-translate-y-0.5`).

### 2. Regras de Design da Vercel (Auditoria de Código UI)
- Aplique o checklist da skill `web-design-guidelines` (`.agent/skills/web-design-guidelines/SKILL.md`):
  - Estados completos obrigatórios (Skeleton Loading no formato real do card, Empty State honesto, estados de erro claros).
  - Acessibilidade real: `focus-visible:ring-2`, `aria-label` em botões de ícone, alvos de toque mínimos de `44x44px` (`min-h-[44px]`), suporte a `env(safe-area-inset-bottom)`.

### 3. Referência dos 74 Design Systems de Grandes Marcas (`references/design-systems-catalog.md`)
- Antes de desenhar um componente novo (tabela comparativa, card de oferta, barra de busca, checkout/lista, modal ou dashboard), consulte `references/design-systems-catalog.md` para absorver padrões reais de marcas líderes (**Stripe**, **Apple HIG**, **Linear**, **Vercel Geist**, **Airbnb**, **Shopify Polaris**, **Wise**, **Nubank**, **Mercado Livre**, **iFood**).

### 4. Print-to-Code (Referência Visual -> Código Fiel)
- Quando o usuário enviar uma foto, logo ou print de referência:
  1. Decomponha proporções, raio de borda, paleta exata, direção de luz/sombra e densidade tipográfica.
  2. Reconstrua com fidelidade cirúrgica em React + Tailwind CSS sem substituir por equivalentes genéricos.

### 5. Playwright / Browser Visual QA (Conferência Real no Navegador)
- **Nunca entregue às cegas:** Abra o navegador local (`http://localhost:3000`), inspecione e capture screenshots em **Desktop (`1440x900`)** e **Mobile (`390x844`)**, verificando ausência de `overflow-x`, alinhamento de preços e nitidez das imagens antes de concluir.
