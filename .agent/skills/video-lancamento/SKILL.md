---
name: video-lancamento
description: Gera um vídeo de lançamento e tutorial explicativo (Product Launch & Explainer Video em MP4 16:9 e 9:16 Shorts/Reels) a partir do projeto usando Remotion, combinado com um Material Digital Interativo (Generative UI) que explica o funcionamento completo do aplicativo usando a paleta oficial, tipografia, telas reais e voz da marca.
---

# Vídeo de Lançamento & Material Digital Explicativo (`video-lancamento`)

Use esta skill sempre que o usuário pedir para criar, recriar ou melhorar um **vídeo de lançamento**, **vídeo promocional**, **demo animada**, **shorts/reels explicativo** ou **material digital explicando o funcionamento do app** a partir do código-fonte do projeto.

Esta skill integra as práticas oficiais de **Remotion (`@remotion/cli`, `@remotion/renderer`)** com as skills do projeto:
- **`voz-da-marca`**: Linguagem amiga, direta, transparente e sem superlativos não comprováveis (proibido *"melhores preços"* ou *"garantia do menor preço"*).
- **`auditar-dados-reais`**: Exemplos visuais honestos, destacando fonte da coleta (`source`), horário (`collected_at`), separação de cestas completas vs. parciais e cálculo proporcional (`R$/kg`, `R$/L`).
- **`generative_ui`**: Criação de um manual/guia digital interativo em HTML autocontido + artefato Markdown com carrossel e vídeos embutidos.

---

## Como funciona (Fluxo em 6 Etapas)

### 1. Extração da Identidade Visual e Fluxos Reais do Código
Antes de criar as cenas e o material digital, inspecione o repositório para extrair:
- **Paleta de Cores Oficial** (`src/app/globals.css` / `tailwind.config.ts`):
  - Navy institucional (`#063A6B`)
  - Azul-ciano de ação (`#00AFCF`)
  - Verde economia (`#52D95D`)
  - Amarelo oferta (`#FFC928`)
  - Superfície suave (`#F4FAFC` / `#E6F7FB`)
- **Tipografia**:
  - Títulos: `Poppins` (`700` / `800`, `tracking-tight`)
  - Corpo e preços: `Inter` com `font-variant-numeric: tabular-nums`
- **Ativos Visuais e Capturas Reais**:
  - Logotipo oficial (`public/logo-oficial.jpg` / `public/icon-512.png`)
  - Screenshots reais em alta resolução (Desktop `1440x900` e Mobile `390x844`) das rotas principais: Home (`/`), Busca (`/buscar`), Lista Inteligente (`/lista`), Mercados (`/mercados`) e Seja Parceiro (`/seja-parceiro`).
- **Jornada Completa do Produto (Passo a Passo)**:
  1. **Localização por CEP ou GPS**: Filtro de mercados reais dentro do raio do consumidor (fórmula de Haversine).
  2. **Busca & Leitor de Código de Barras (EAN-13)**: Catálogo integrado ao Open Food Facts Brasil + comparação justa que separa embalagens diferentes e calcula automaticamente o preço por quilo, litro ou unidade (`R$/kg`, `R$/L`, `R$/un`).
  3. **Rastreabilidade de Preços**: Exibição obrigatória da fonte (`Parceiro`, `CSV`, `Encarte OCR`, `Coleta Equipe`) e data/hora exata da atualização, mais alerta de preço desatualizado (> 7 dias).
  4. **Lista de Compras Inteligente**: Comparativo de cesta entre mercados que separa **Cestas Completas** de **Cestas Parciais** e nunca soma item sem preço/estoque como `R$ 0,00`.
  5. **Portal do Mercado Parceiro**: Atualização via planilha CSV validada por GTIN, leitura de encartes por IA (status `pendente` até revisão humana) ou painel manual autenticado.

---

### 2. Regras Técnicas de Animação no Remotion (Motion Design)
Ao programar composições em Remotion (`useCurrentFrame`, `useVideoConfig`, `spring`, `interpolate`, `Sequence`):
1. **Proibido depender de `transition` ou `@keyframes` do CSS**: Toda animação deve ser função pura de `frame` para garantir renderização determinística quadro a quadro.
2. **Física de Mola (`spring`) com Presets Claros**:
   - *Snappy UI / Pílulas e Badges*: `{ damping: 15, stiffness: 160, mass: 0.8 }`
   - *Bouncy / Revelação de Logo e Cards*: `{ damping: 12, stiffness: 120, mass: 0.9 }`
   - *Smooth Camera / Mockups 3D*: `{ damping: 18, stiffness: 90, mass: 1.1 }`
3. **Cursores e Toques Simulados (UI Walkthrough)**:
   - Adicione um cursor animado (Desktop) ou indicador de toque com onda de expansão (*tap ripple* no Mobile) que percorre os elementos reais da tela para demonstrar visualmente onde o usuário clica.
4. **Barra de Progresso por Capítulos**:
   - Inclua uma barra de progresso inferior discreta dividida pelos capítulos do vídeo (`Problema`, `Economize+`, `Passo 1 & 2: Busca e R$/kg`, `Passo 3: Cesta Inteligente`, `Passo 4: Parceiros`, `Comece Agora`) para orientar a leitura.
5. **Dois Formatos de Saída**:
   - **Widescreen (`1920x1080`, 16:9, 30fps)**: Ideal para apresentação web, YouTube, pitch deck e README.
   - **Vertical Shorts/Reels (`1080x1920`, 9:16, 30fps)**: Ideal para YouTube Shorts, Instagram Reels, TikTok e WhatsApp Status.

---

### 3. Roteiro de 6 Cenas (24 Segundos / 720 Frames @ 30fps)
1. **Cena 1 — Hook Cinético & Problema (0s – 3.2s | Frames `0–95`)**:
   - Tipografia cinética de alto contraste sobre fundo `#041E3A` + cards flutuantes ilustrando a variação de preço do mesmo item no mesmo bairro.
2. **Cena 2 — Revelação da Marca Economize+ (2.8s – 6.2s | Frames `85–185`)**:
   - Entrada em `spring()` do ícone circular oficial, título **Economize+**, slogan *"Compare. Escolha. Economize."* e selos de transparência.
3. **Cena 3 — Passos 1 e 2: CEP/GPS, Código EAN e Preço por Quilo/Litro (5.8s – 10.5s | Frames `175–315`)**:
   - Mockup de navegador Desktop com screenshot real da Home e transição da subnav animada, cursor simulado clicando nas abas e cards explicativos sobre **Raio Real (CEP/GPS)** e **Cálculo Automático (`R$/kg`, `R$/L`)**.
4. **Cena 4 — Passo 3: Lista de Compras Inteligente no Celular (10.2s – 15.0s | Frames `305–450`)**:
   - Dois iPhones em perspectiva (`mobile__buscar.png` e `mobile__lista.png`) + destaque da barra inferior animada e card demonstrando a separação entre **Cesta Completa** e **Cesta Parcial** (sem somar item em falta como `R$ 0,00`).
5. **Cena 5 — Passo 4: Ecossistema de Mercados Parceiros & Auditoria (14.7s – 19.5s | Frames `440–585`)**:
   - Tela real de parceiros (`mobile__seja-parceiro.png` e `mobile__mercados.png`) + pipeline visual das 4 fontes autenticadas (`Planilha CSV GTIN`, `Encarte OCR com revisão humana`, `Painel do Parceiro`, `Coleta Verificada`).
6. **Cena 6 — Resumo dos 4 Passos & Call to Action Final (19.2s – 24.0s | Frames `575–720`)**:
   - Fechamento com logo circular oficial, resumo visual dos 4 passos e botão de ação com clique animado.

---

### 4. Renderização em MP4 (H.264)
Execute a renderização utilizando o navegador local (Edge ou Chrome headless):
```powershell
npx remotion render src/index.ts EconomizeLaunch "<artifactDir>/video-lancamento-economize.mp4" --codec=h264 --browser-executable="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
npx remotion render src/index.ts EconomizeShorts "<artifactDir>/video-shorts-economize.mp4" --codec=h264 --browser-executable="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
```

---

### 5. Material Digital Interativo (`material-digital-economize.html` + `video-lancamento.md`)
Combinando a skill `generative_ui`, gere também:
1. **`material-digital-economize.html`**: Guia digital interativo e autocontido com:
   - Navegação por abas interativas (`Visão Geral & Vídeo`, `Passo a Passo do Consumidor`, `Simulador R$/kg & Cesta Inteligente`, `Jornada do Mercado Parceiro`, `Arquitetura & Conformidade`).
   - Simulador interativo onde o usuário pode testar na prática a diferença entre **Preço Total vs. Preço por Quilo/Litro** e entender como a **Lista Inteligente** trata produtos sem estoque sem distorcer o subtotal.
2. **`video-lancamento.md`**: Artefato Markdown de apresentação contendo os vídeos embutidos (`16:9` e `9:16`), diagrama de arquitetura em Mermaid e carrossel visual das telas reais.
