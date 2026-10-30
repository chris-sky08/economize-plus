---
trigger: always_on
description: Diretrizes Visuais, Design System Anti-IA Genérica e Loop de Validação Visual do Economize+
---

# Diretrizes Visuais e de Experiência (UI/UX — Economize+)

## 1. Estética Anti-IA Genérica & Tokens de Marca
- **Proibido usar cores padrão saturadas ou layouts genéricos.** Utilize sempre a paleta oficial da marca e as variáveis CSS globais definidas em `src/app/globals.css`:
  - `--bg-surface`: `#F8FBFF` (Fundo principal limpo)
  - `--bg-card`: `#FFFFFF` (Superfície de cards e modais)
  - `--bg-soft`: `#EAF3FF` (Azul-claro de destaque suave)
  - `--text-primary`: `#041834` (Azul-marinho para títulos e leitura de alto contraste)
  - `--text-secondary`: `#475569` (Textos de apoio e metadados)
  - `--accent`: `#176BCE` (Azul principal para navegação, CTAs primários e links)
  - `--accent-economy`: `#159447` (Verde para menor preço, economia estimada e confirmação)
  - `--accent-promo`: `#FFD447` (Amarelo para selos de oferta e destaques pontuais)
- **Tipografia com Hierarquia Clara:**
  - Títulos: `Poppins` (`font-heading`), pesos `600`, `700`, `800`, com `tracking-tight`.
  - Corpo e dados numéricos: `Inter` (`font-sans`), garantindo alinhamento tabular em preços (`tabular-nums`).

## 2. Mobile-First, Acabamento Nativo & Acessibilidade
- Sempre aplique `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)` em barras fixas e modais móveis.
- Desative o highlight de toque padrão (`-webkit-tap-highlight-color: transparent`).
- **Alvos de toque mínimos:** Botões interativos, seletores de quantidade (`- / +`) e links de navegação móvel devem respeitar área mínima clicável de `44x44px` (`min-h-[44px]`).
- **Micro-interações de toque:** Aplique `active:scale-95` em botões de ação e `focus-visible:ring-2` para navegação por teclado.

## 3. Estados Completos Obrigatórios
- Nunca crie uma tela apenas com o "caminho feliz". Toda listagem, busca ou comparação DEVE implementar:
  1. **Skeleton Loading** (`animate-pulse` estruturado no formato real do card).
  2. **Empty State estilizado** (com ícone, explicação clara do motivo — ex.: raio de distância sem mercados ou filtro restritivo — e botão de ação imediata para limpar filtros ou ampliar o raio).
  3. **Tratamento visual de erro e avisos de transparência** (indicando claramente dados demonstrativos e itens sem preço cadastrado).

## 4. Performance de Animação (60fps)
- Utilize apenas `transform` e `opacity` em transições.
- Use a curva `cubic-bezier(0.22, 1, 0.36, 1)` para transições suaves de cards, modais e toasts.
- Evite sombras pesadas, excesso de gradientes, elementos 3D ou animações que prejudiquem o LCP/CLS.

## 5. Loop de Validação Visual no Navegador
- Após qualquer alteração relevante de interface:
  1. Certifique-se de que o servidor local (`npm run dev`) esteja ativo.
  2. Valide o layout nas resoluções **Desktop (`1440x900`)** e **Mobile (`390x844`)**.
  3. Verifique a ausência de `overflow-x` indesejado e erros no console do navegador.
