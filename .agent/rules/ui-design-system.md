---
trigger: always_on
description: Diretrizes Visuais, Paleta Oficial do Guia de Redes Sociais, Voz da Marca e Validação Visual do Economize+
---

# Diretrizes Visuais, Paleta e Voz da Marca (UI/UX — Economize+)

## 1. Paleta Oficial da Marca (Opção B — Guia de Redes Sociais)
- **Proibido usar cores padrão saturadas ou layouts genéricos.** Utilize sempre a paleta oficial da marca definida em `src/app/globals.css` e `tailwind.config.ts`:
  - `--bg-surface`: `#F4FAFC` (Fundo principal limpo e suave)
  - `--bg-card`: `#FFFFFF` (Superfície de cards e modais)
  - `--bg-soft` / `brand-light`: `#E6F7FB` (Azul-claro suave de destaque)
  - `--text-primary` / `brand-navy`: `#063A6B` (Azul-escuro institucional para títulos, cabeçalho e leitura de alto contraste)
  - `--text-secondary`: `#475569` (Textos de apoio e metadados)
  - `--accent` / `brand-blue`: `#00AFCF` (Azul-ciano vibrante para CTAs, links e interações)
  - `--accent-economy` / `brand-green`: `#52D95D` (Verde economia para menor preço, economia calculada e confirmação)
  - `--accent-promo` / `brand-yellow`: `#FFC928` (Amarelo-ouro para selos de oferta e destaques)
- **Tipografia com Hierarquia Clara:**
  - Títulos: `Poppins` (`font-heading`), pesos `500`, `600`, `700`, `800`, com `tracking-tight`.
  - Corpo e dados numéricos: `Inter` (`font-sans`), garantindo alinhamento tabular em preços (`tabular-nums`).

## 2. Tom de Voz da Marca
- **Personalidade:** Amiga que ajuda a economizar — simples, direta, positiva, transparente e educativa.
- **Slogan:** *"Compare. Escolha. Economize."*
- **Proibições de Linguagem:**
  - Nunca use superlativos ou promessas não comprováveis (ex.: proibido *"melhores preços"*, *"preço baixo de verdade"*, *"garantia do menor preço"*).
  - Nunca afirme *"Compatível com a LGPD"* como selo promocional; descreva de forma objetiva como os dados são tratados e mantenha os termos marcados como *"pendente de revisão jurídica"*.
  - Sempre mostre data e hora completas das coletas (`"atualizado em 28/10 às 14:20"` ou `"Preço coletado pela equipe em 28/10 às 14h"`) e exiba o selo `"Desatualizado"` quando tiver mais de 7 dias.
  - O selo `"Verificado"` em um mercado só pode aparecer se `verified_at` não for nulo no banco.

## 3. Mobile-First, Acabamento Nativo & Acessibilidade
- Sempre aplique `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)` em barras fixas e modais móveis.
- Desative o highlight de toque padrão (`-webkit-tap-highlight-color: transparent`).
- **Alvos de toque mínimos:** Botões interativos, seletores de quantidade (`- / +`) e links de navegação móvel devem respeitar área mínima clicável de `44x44px` (`min-h-[44px]`).
- **Micro-interações de toque:** Aplique `active:scale-95` em botões de ação e `focus-visible:ring-2` para navegação por teclado.

## 4. Estados Completos Obrigatórios
- Toda listagem, busca ou comparação DEVE implementar:
  1. **Skeleton Loading** (`animate-pulse` estruturado no formato real do card).
  2. **Empty State honesto e estilizado** (ex.: `"Nenhum mercado parceiro por aqui ainda — indique um mercado"` quando não houver mercados na região; nunca invente mercados ou preços).
  3. **Tratamento visual de erro e avisos de transparência** (incluindo atribuição obrigatória ao Open Food Facts — ODbL / CC BY-SA — no rodapé e na página de produto).

## 5. Loop de Validação Visual no Navegador
- Após qualquer alteração relevante de interface:
  1. Certifique-se de que o servidor local (`npm run dev`) ou preview da Vercel esteja ativo.
  2. Valide o layout nas resoluções **Desktop (`1440x900`)** e **Mobile (`390x844`)**.
  3. Verifique a ausência de `overflow-x` indesejado, erros de hidratação e erros no console do navegador.
