# Catálogo de Referência — Design Systems de Grandes Marcas (Inspirado em `awesome-design-md`)

Use estes princípios práticos ao projetar interfaces no Economize+:

1. **Stripe Design System (Tabelas, Preços & Checkout):**
   - Números sempre alinhados com `font-variant-numeric: tabular-nums`.
   - Bordas de `1px` ultrafinas (`#E2E8F0`) com sombras multicamadas de baixa opacidade (`0 2px 4px rgba(6,58,107,0.04), 0 8px 16px rgba(6,58,107,0.06)`).
   - Selos de status com fundo pastel de alto contraste e texto saturado escuro.
2. **Apple Human Interface Guidelines (Mobile-First & Toque):**
   - Alvos de toque mínimos de `44x44px`.
   - Barras fixas com `backdrop-blur-md` translúcido e respeito ao `safe-area-inset`.
   - Feedback físico imediato (`active:scale-95`, transições suaves `cubic-bezier(0.22, 1, 0.36, 1)`).
3. **Linear & Vercel Geist (Clareza & Densidade de Informação):**
   - Hierarquia conduzida por contraste tipográfico e peso (`#063A6B` primário vs `#475569` secundário vs `#94A3B8` metadados), sem poluição visual.
   - Atalhos rápidos, filtros instantâneos e estados de carregamento (Skeleton) que espelham exatamente a geometria final do componente.
4. **Airbnb & iFood / Mercado Livre (Cards de Produto, Busca Local & Cesta):**
   - Foto ou ícone do produto limpo sobre fundo claro neutro, selo de menor preço/economia em destaque imediato (`#52D95D` / `#FFC928`), preço principal grande + preço por quilo/litro (`R$/kg`, `R$/L`) logo abaixo para comparação honesta.
