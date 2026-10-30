# Checklist de Conformidade Legal e Regulatória — Economize+ (Brasil)

> **Aviso importante:** Este documento consolida os requisitos técnicos e operacionais implementados na plataforma **Economize+** e os pontos que exigem validação por advogado(a) e contador(a) antes da operação comercial em larga escala.

---

## 1. Código de Defesa do Consumidor (CDC — Lei nº 8.078/1990)

- **Art. 30 e Art. 31 (Informação Clara e Ostensiva):**
  - Todo preço exibido apresenta a unidade de medida exata da embalagem (`sizeLabel`) e o preço proporcional calculado (`R$/kg`, `R$/L`, `R$/un`, `R$/rolo`) quando `unit_value` e `unit_type` estão disponíveis.
  - Embalagens de tamanhos distintos (ex.: `Arroz 5 kg` vs. `Arroz 1 kg`) nunca são agrupadas como se fossem o mesmo produto.
  - Cada preço exibe a **fonte real** (`Planilha do parceiro`, `Encarte revisado` ou `Coleta em loja`) e a **data/hora completa** (`dd/MM/yyyy às HH:mm`) da coleta.
  - Preços com mais de 7 dias (`updated_at > 7 dias`) recebem automaticamente o selo **Desatualizado**.
  - A plataforma exibe de forma clara que os preços estão sujeitos a alteração na loja física e que o Economize+ atua como comparador informativo, não realizando venda direta.
- **Art. 36 (Identificação da Publicidade):**
  - Qualquer item patrocinado exibe o selo explícito **Destaque Patrocinado** e nunca altera a ordenação objetiva por menor preço quando o consumidor ordena por preço.

---

## 2. Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)

- **Minimização de Dados:**
  - A navegação e a comparação de preços não exigem criação de conta.
  - A geolocalização do navegador (`navigator.geolocation`) só é acionada mediante clique e consentimento explícito no modal de localização; o usuário pode optar por informar apenas o CEP.
- **Segurança Técnica (Art. 46):**
  - Row Level Security (RLS) ativo em todas as tabelas do Supabase (`supermarkets`, `products`, `market_prices`, `profiles`, `market_members`, `shopping_lists`, `shopping_list_items`, `partner_applications`, `courier_applications`, `price_reports`).
  - Buckets de armazenamento de encartes (`encartes`) e fotos de gôndola (`evidencias`) configurados como **privados** (`public = false`).
- **Pendências Jurídicas antes do lançamento comercial:**
  - [ ] Nomeação formal do Encarregado de Dados (DPO) e publicação do canal oficial de atendimento ao titular (Art. 41 da LGPD).
  - [ ] Revisão jurídica formal da Política de Privacidade e dos Termos de Uso publicados em `/institucional`.

---

## 3. Licenciamento Open Food Facts (ODbL 1.0 e CC BY-SA 3.0)

- **Base de Dados (ODbL 1.0):**
  - O rodapé global (`Footer.tsx`), a página institucional (`/institucional`) e a página de detalhe do produto (`/produto/[id]`) exibem a atribuição obrigatória ao **Open Food Facts Brasil** com link direto para a licença ODbL 1.0 e para a página do produto quando `source = 'open_food_facts'`.
- **Imagens de Embalagens (CC BY-SA 3.0):**
  - As imagens originadas do Open Food Facts mantêm atribuição explícita sob licença Creative Commons Attribution-ShareAlike 3.0.
- **Uso Técnico Responsável:**
  - Todas as chamadas à API do Open Food Facts são realizadas exclusivamente no servidor (`/api/produtos/ean/[ean]`) com cabeçalho `User-Agent` identificando o projeto e cache de 30 dias no banco (`products.off_synced_at`), sem chamadas ao endpoint lento `cgi/search.pl` no navegador.

---

## 4. Nota Fiscal Eletrônica (NFC-e / SEFAZ)

- No escopo atual de produção, a captura de preços é realizada por:
  1. Upload de planilha CSV pelo mercado parceiro (`source = 'partner_csv'`).
  2. Extração assistida de encartes com revisão humana obrigatória (`source = 'flyer_ocr'`).
  3. Coleta presencial pela equipe com foto da etiqueta (`source = 'team_collected'`).
- **Pendência para futura leitura automatizada de QR Code de NFC-e (`nfce_qr`):**
  - [ ] Verificar os termos de uso de cada SEFAZ estadual antes de automatizar consultas a portais estaduais de NFC-e ou contratar API comercial homologada.

---

## 5. Enquadramento Fiscal e Contábil (Planos B2B para Mercados)

- **Pendências Contábeis antes de ativar cobrança recorrente (Planos Básico e Premium):**
  - [ ] Definir CNAE adequado (ex.: portal/provedor de conteúdo na internet, intermediação de negócios ou publicidade/divulgação) junto à contabilidade.
  - [ ] Configurar emissão de NFS-e municipal para cobrança de mensalidades de mercados parceiros.

---

## 6. Operação Futura de Entregas (Trabalhista, Securitário e Responsabilidade Civil)

- Atualmente a página `/entregas` opera **exclusivamente como pré-cadastro informativo de interesse**, sem pedidos ou pagamentos ativos.
- **Pendências obrigatórias antes de ativar entregas reais:**
  - [ ] Elaborar contrato de parceria comercial autônoma com entregadores (sem subordinação exclusiva) revisado por assessoria jurídica trabalhista.
  - [ ] Contratar seguro contra acidentes pessoais para entregadores em rota, conforme legislação e jurisprudência aplicáveis.
  - [ ] Definir regras claras de responsabilidade sobre conservação de alimentos perecíveis, cadeia de frio e logística reversa (direito de arrependimento — Art. 49 do CDC).
