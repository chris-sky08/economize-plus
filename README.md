# Economize+ | Compare. Escolha. Economize.

Plataforma web responsiva para comparação de preços de produtos entre mercados locais, lista de compras inteligente e conexão entre consumidores e mercados parceiros de bairro.

## Tecnologias Utilizadas
- **Frontend / Fullstack:** Next.js (App Router) + React 19 + TypeScript
- **Estilização:** Tailwind CSS (Paleta oficial: Azul `#176BCE`, Azul-claro `#EAF3FF`, Verde `#159447`, Amarelo `#FFD447`, Azul-marinho `#041834` e Branco `#FFFFFF`; Tipografia `Poppins` + `Inter`)
- **Backend & Banco de Dados:** Supabase (`@supabase/supabase-js`) com esquema SQL completo e Políticas de Segurança Row Level Security (RLS) em `supabase/schema.sql`.
- **Hospedagem:** Preparado para deploy automático na Vercel via GitHub.

## Estrutura de Rotas
- `/` — Página Inicial (Busca, localização, categorias, card interativo "Compare o mesmo produto", ofertas em destaque, como funciona, prévia da lista inteligente e mercados próximos)
- `/buscar` — Comparador de Preços com filtros laterais (marca, categoria, mercado, faixa de preço, disponibilidade) e distinção entre menor preço total e menor preço por unidade (`R$/kg`, `R$/L`)
- `/produto/[id]` — Detalhes do produto, comparativo entre mercados e formulário de relato de preço divergente
- `/lista` — Lista de Compras Inteligente com comparativo de cesta completa vs. cesta parcial por mercado
- `/mercados` e `/mercados/[id]` — Mercados próximos por raio de distância e perfil individual do mercado com catálogo
- `/seja-parceiro` — Apresentação para comerciantes, Planos Básico e Premium e formulário de solicitação de parceria
- `/painel-parceiro` — Painel isolado do mercado parceiro para gestão de preços, promoções, novos produtos, importação CSV, alertas de preços desatualizados e métricas demonstrativas
- `/entregas` — Arquitetura preparada para futura operação com entregadores parceiros e simulação de estados de pedido
- `/conta` — Autenticação Supabase Auth (Login, Cadastro, Recuperação de Senha) + seletor rápido de perfis demonstrativos
- `/admin` — Painel Administrativo protegido para moderação de mercados, solicitações, denúncias e destaques patrocinados
- `/institucional` — Central de Ajuda, Política de Privacidade (LGPD), Termos de Uso e Contato
