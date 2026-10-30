---
trigger: always_on
description: Padrões de Engenharia, TypeScript Estrito, REGRA MESTRA de Dados Reais e Segurança Supabase do Economize+
---

# Regras de Código e Arquitetura (Economize+)

## 1. REGRA MESTRA (Inegociável)
- **Nenhum dado fictício em produção.** Preço, mercado, telefone, CNPJ, e-mail, distância, selo "verificado" e horário de atualização precisam ter origem real e rastreável (`source` + data/hora completa).
- **Sem dado:** exiba estado vazio honesto (`Empty State`), nunca valor padrão inventado, nunca `"(Fictício)"`.
- **Fixtures de teste:** permitidas apenas em `tests/fixtures/`, fora do bundle da aplicação e fora do banco de dados de produção.

## 2. TypeScript Estrito
- **Proibido usar `any`.** Crie interfaces e tipos explícitos para todas as entidades (`Market`, `Product`, `MarketPrice`, `ShoppingListItem`, `UserProfile`, `PartnerApplication`, `CourierApplication`, `PriceReport`).
- Valide sempre com `npx tsc --noEmit` antes de concluir tarefas de código.

## 3. Componentização e Organização Modular
- Separe responsabilidades de forma limpa:
  - `src/components/`: Componentes de UI reutilizáveis e desacoplados (`Navbar`, `Footer`, `LocationModal`, `ProductComparisonCard`, `SkeletonCard`, `BarcodeScannerModal`).
  - `src/context/`: Estado global e hooks customizados (`useApp`), carregando exclusivamente dados reais do Supabase.
  - `src/lib/`: Cliente público do Supabase (`supabase.ts`), formatadores puros (`format.ts`) e utilitários.
  - `src/lib/server/`: Helpers exclusivos de servidor (`auth.ts`, `supabaseAdmin.ts` com `service_role`, `rateLimit.ts`, `turnstile.ts`). **Nunca importe `src/lib/server/*` em componentes cliente.**
  - `src/types/`: Definições de tipos TypeScript do domínio (`domain.ts`).
  - `supabase/`: Esquema SQL (`schema.sql`), `supabase/migrations/` numeradas e políticas Row Level Security (RLS).

## 4. Regras de Negócio e Segurança Inegociáveis
- **Comparação Justa:** Nunca misture tamanhos, pesos ou volumes diferentes como se fossem produtos equivalentes (ex.: `Arroz 5 kg` e `Arroz 1 kg` possuem EANs e IDs separados).
- **Preço Total vs. Preço por Unidade:** Sempre exiba o preço total e o preço calculado por medida (`R$/kg`, `R$/L`, `R$/un`, `R$/rolo`) quando `unit_value` e `unit_type` estiverem completos.
- **Cálculo de Lista Inteligente:** Nunca trate um item sem preço cadastrado ou sem estoque como se custasse `R$ 0,00`. Separe cestas completas de cestas parciais e liste explicitamente os itens excluídos do subtotal.
- **Escrita de Preço Só Autenticada:** Nenhum preço pode ser gravado sem autenticação validada no servidor (`requireMarketMember` ou `requireAdmin`), sem `source` explícito (`'partner_manual' | 'partner_csv' | 'flyer_ocr' | 'nfce_qr' | 'team_collected'`) e sem `collected_at`. Preços vindos de `'flyer_ocr'` entram obrigatoriamente como `status = 'pendente'` até aprovação humana do responsável pelo mercado.
- **Segurança de Chaves:** Nunca exponha `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` ou `TURNSTILE_SECRET_KEY` no cliente, em commits ou logs.
