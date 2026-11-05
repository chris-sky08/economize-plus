---
description: Gera um vídeo de lançamento e tutorial explicativo (MP4 16:9 e 9:16 Shorts) usando Remotion + um Material Digital Interativo em HTML explicando todo o funcionamento do Economize+.
---

# Workflow `/video-lancamento`

1. Leia as instruções completas em [`.agent/skills/video-lancamento/SKILL.md`](file:///c:/Users/leywin/Downloads/economize/.agent/skills/video-lancamento/SKILL.md), [`.agent/skills/voz-da-marca/SKILL.md`](file:///c:/Users/leywin/Downloads/economize/.agent/skills/voz-da-marca/SKILL.md) e na skill `generative_ui`.
2. Colete as cores oficiais (`#063A6B`, `#00AFCF`, `#52D95D`, `#FFC928`), o logotipo oficial (`public/logo-oficial.jpg`) e as capturas de tela reais Desktop e Mobile do aplicativo.
3. Atualize o projeto Remotion em `<artifactDir>/scratch/remotion-launch` com as composições `EconomizeLaunch` (`1920x1080`, 24s, 720 frames) e `EconomizeShorts` (`1080x1920`, 21s, 630 frames), incluindo animações `spring`, cursor simulado, passo a passo do funcionamento do app e barra de progresso por capítulos.
4. Renderize os vídeos MP4 (H.264) usando `npx remotion render` com Microsoft Edge headless e copie para `<artifactDir>/` e `public/`.
5. Gere o Material Digital Interativo (`<artifactDir>/material-digital-economize.html`) e atualize o artefato `<artifactDir>/video-lancamento.md` com os vídeos embutidos e carrossel explicativo.
