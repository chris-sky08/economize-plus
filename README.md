# Economize+ | Compare. Escolha. Economize.

Plataforma web responsiva e PWA para comparação transparente de preços entre mercados locais, lista de compras inteligente por medida (`R$/kg`, `R$/L`, `R$/un`, `R$/rolo`) e conexão direta entre consumidores e mercados parceiros.

## Tecnologias e Identidade Visual
- **Frontend / Fullstack:** Next.js 16 (App Router + `src/proxy.ts`) + React 19 + TypeScript estrito
- **Paleta Oficial (Guia de Redes Sociais):**
  - Azul Escuro Institucional (`brand-navy`): `#063A6B`
  - Azul Ciano Vibrante (`brand-blue`): `#00AFCF`
  - Verde Economia (`brand-green`): `#52D95D`
  - Amarelo Ouro (`brand-yellow`): `#FFC928`
  - Azul Suave (`brand-light`): `#E6F7FB`
  - Tipografia: `Poppins` (pesos `500`, `600`, `700`, `800`) + `Inter`
- **Banco de Dados & Segurança:** Supabase (`supabase/schema.sql` e `supabase/migrations/`) com RLS estrito, `public.profiles.app_role`, `public.market_members`, histórico auditável `public.price_history` e buckets privados `'encartes'` e `'evidencias'`.
- **Catálogo Padronizado:** Integração server-side com Open Food Facts Brasil (`GET /api/produtos/ean/[ean]`) sob licenças ODbL 1.0 e CC BY-SA 3.0.

## Estrutura de Rotas
- `/` — Página Inicial com busca, categorias, ofertas publicadas, comparação justa por medida e resumo da Lista Inteligente
- `/buscar` — Comparador de Preços com filtros laterais e distinção entre menor preço total e menor preço por quilo/litro/unidade
- `/produto/[id]` — Detalhes do produto, histórico/origem da coleta, atribuição Open Food Facts e relato de divergência protegido por Turnstile
- `/lista` — Lista de Compras Inteligente com busca no banco, scanner de código de barras EAN e separação entre cesta completa e parcial
- `/mercados` e `/mercados/[id]` — Mercados ativos ordenados por distância em linha reta (`~ X km em linha reta`)
- `/seja-parceiro` — Apresentação para comerciantes e envio de solicitação validada no servidor
- `/painel-parceiro` — Área restrita ao membro do mercado (`public.market_members`) com importação CSV validada, revisão obrigatória de encartes extraídos por IA e gestão de catálogo
- `/admin` e `/admin/coleta` — Painel Administrativo restrito a `app_role = 'admin'` e ferramenta de coleta presencial da equipe com foto de evidência (`source = 'team_collected'`)
- `/entregas`, `/conta` e `/institucional` — Cadastro de entregadores, autenticação Supabase Auth e Termos/Privacidade transparentes
