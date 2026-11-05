---
name: video-lancamento
description: Gera um vídeo de lançamento (Product Launch Video em MP4 60fps) a partir do projeto usando Remotion, extraindo automaticamente a paleta de cores, tipografia, telas reais e proposta de valor do site.
---

# Skill: Vídeo de Lançamento de Produto (`/video-lancamento`)

Esta skill transforma o projeto web em um **vídeo de lançamento cinematográfico (`.mp4`)** pronto para redes sociais (Reels/Shorts `1080x1920` ou Widescreen `1920x1080` a `60fps`), seguindo o fluxo de 3 passos:

## Passo 1 — Extração da Identidade e Captura das Telas Reais
1. Leia os tokens visuais do projeto (`src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`) para extrair:
   - Paleta oficial (`#063A6B` Navy, `#00AFCF` Blue, `#52D95D` Green, `#FFC928` Yellow, `#F4FAFC` Surface).
   - Fontes (`Poppins` para títulos de impacto, `Inter` com `tabular-nums` para preços).
   - Logotipo oficial (`public/logo-oficial.jpg` / `public/icon-512.png`).
2. Capture screenshots reais em alta definição das telas principais do projeto rodando localmente (`Desktop 1440x900` e `Mobile 390x844`).

## Passo 2 — Roteiro de Cenas (Motion Design em Remotion)
Monte uma composição Remotion (`60fps`) dividida em 5 cenas dinâmicas com animações `spring()` e `interpolate()`:
- **Cena 1 — Hook Tipográfico (0s–2.5s):** Pergunta de impacto com tipografia cinética (*"Cansado de descobrir no caixa que pagou mais caro?"*).
- **Cena 2 — Revelação da Marca (2.5s–5s):** Entrada com física de mola (`spring`) do logo oficial **Economize+** + slogan *"Compare. Escolha. Economize."*
- **Cena 3 — Demonstração Real Desktop & Mobile (5s–9s):** Mockups 3D suaves exibindo as telas reais do site (comparação por quilo/litro, leitor de código de barras EAN e barra inferior animada no celular).
- **Cena 4 — Pilares de Valor (9s–12s):** Cards animados destacando *Comparação Justa por EAN*, *Lista de Compras Inteligente* e *Origem e Horário Rastreáveis*.
- **Cena 5 — Call to Action Final (12s–15s):** Fechamento com logo, chamada para ação e identidade da marca.

## Passo 3 — Renderização do MP4
Renderize o vídeo final com `@remotion/cli` (`npx remotion render`) em H.264 `.mp4` e disponibilize o arquivo para revisão.
