---
name: google-ai-studio-kit
description: Aplica o fluxo integrado das ferramentas gratuitas de IA do Google (Pomelli para kit de marketing e QR Code de divulgação na identidade da marca, Stitch para design de interface em código, Opal para pipelines encadeados de ingestão/histórico, Mixboard para composição visual e Antigravity para orquestração de subagentes).
---

# Kit Google AI (Pomelli · Stitch · Opal · Mixboard · Antigravity)

Esta skill traz para o repositório **Economize+** os 5 fluxos de trabalho apresentados no vídeo das ferramentas gratuitas do Google (`kpbQKAOrnq8`):

## 1. Fluxo Pomelli — Marketing da Marca & QR Code de Divulgação (`/divulgacao`)
- A partir da URL de demonstração ou produção do site (ou da página específica de um supermercado parceiro `/mercados/[id]`), gera automaticamente:
  - **QR Code Vetorial (SVG e PNG em alta resolução)** pronto para impressão em balcão de caixa, gôndola, encarte ou post de redes sociais.
  - **Cartaz / Display A4 e Post para Instagram/WhatsApp** na paleta oficial da marca (`#063A6B`, `#00AFCF`, `#52D95D`, `#FFC928`) com o logotipo circular oficial e o slogan *"Compare. Escolha. Economize."*

## 2. Fluxo Stitch — Design de Interface Direto em Código
- Toda nova tela ou componente (`src/components/*`, `src/app/*`) nasce diretamente com:
  - Paleta oficial Opção B (`brand-navy`, `brand-blue`, `brand-green`, `brand-yellow`, `brand-surface`).
  - Tipografia `Poppins` + `Inter` (`tabular-nums` em preços).
  - Estados completos (Skeleton Loading, Empty State honesto, tratamento de erro) e alvos de toque de `44x44px`.

## 3. Fluxo Opal — Automação Encadeada de Preços e Histórico
- Encadeia de ponta a ponta o ciclo de vida do preço:
  1. **Entrada Autenticada**: Manual (`partner_manual`), Planilha CSV (`partner_csv`), Leitura de Encarte IA (`flyer_ocr` com `status = 'pendente'`) ou Coleta em Loja (`team_collected`).
  2. **Validação Automática**: Dígito verificador GTIN-8/12/13/14, cálculo proporcional (`R$/kg`, `R$/L`, `R$/un`) e validade de promoção (`valid_from` / `valid_until`).
  3. **Registro de Histórico (`public.price_history`)**: Trigger `trg_log_price_history` + visualização da linha do tempo de variações de preço (`↑ / ↓ / =`) no produto e no painel do mercado.

## 4. Fluxo Antigravity — Orquestração de Subagentes Especializados
- Divide tarefas complexas entre agentes especializados (`define_subagent` / `invoke_subagent`) para garantir zero perda de requisitos, auditoria de segurança Supabase (RLS), revisão de voz da marca e validação TypeScript (`npx tsc --noEmit`).
