---
trigger: always_on
description: Padrões de Engenharia, TypeScript Estrito, Componentização e Segurança Supabase do Economize+
---

# Regras de Código e Arquitetura (Economize+)

## 1. TypeScript Estrito
- **Proibido usar `any`.** Crie interfaces e tipos explícitos para todas as entidades (`Market`, `Product`, `MarketPrice`, `ShoppingListItem`, `UserProfile`, `PartnerApplication`, `CourierApplication`, `PriceReport`).
- Valide sempre com `npx tsc --noEmit` antes de concluir tarefas de código.

## 2. Componentização e Organização Modular
- Separe responsabilidades de forma limpa:
  - `src/components/`: Componentes de UI reutilizáveis e desacoplados (`Navbar`, `Footer`, `LocationModal`, `ProductComparisonCard`, `SkeletonCard`).
  - `src/context/`: Estado global e hooks customizados (`useApp`).
  - `src/lib/`: Integração com serviços externos e cliente Supabase (`supabase.ts`).
  - `src/data/`: Dados demonstrativos centralizados e funções puras de formatação e cálculo (`formatBRL`, `calculateUnitPrice`).
  - `supabase/`: Esquema SQL (`schema.sql`), migrations e políticas Row Level Security (RLS).

## 3. Regras de Negócio Inegociáveis do Economize+
- **Comparação Justa:** Nunca misture tamanhos, pesos ou volumes diferentes como se fossem produtos equivalentes (ex.: `Arroz 5 kg` e `Arroz 1 kg` possuem IDs separados).
- **Preço Total vs. Preço por Unidade:** Sempre exiba o preço total e o preço calculado por medida (`R$/kg`, `R$/L`, `R$/un`, `R$/rolo`).
- **Cálculo de Lista Inteligente:** Nunca trate um item sem preço cadastrado ou sem estoque como se custasse `R$ 0,00`. Separe cestas completas de cestas parciais e liste explicitamente os itens excluídos do subtotal.
- **Transparência e Conformidade Legal (LGPD):** Solicite permissão antes de usar geolocalização do dispositivo, ofereça seleção manual de bairro/CEP e identifique claramente dados demonstrativos e destaques patrocinados.

## 4. Compatibilidade Híbrida e Segurança
- Ao utilizar APIs do navegador (`localStorage`, `navigator.geolocation`), proteja sempre com checagem de ambiente (`typeof window !== "undefined"`) e `try/catch` para evitar falhas em Server Components / SSR.
- Nunca exponha chaves secretas (`service_role`) no código cliente; utilize apenas variáveis públicas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com RLS ativo no banco.
