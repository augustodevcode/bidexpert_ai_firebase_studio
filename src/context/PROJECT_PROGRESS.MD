# Project Progress - BidExpert

## DONE
- **Item 1:** **Core Architecture Refactoring:** Fully migrated the application to a layered MVC + Service + Repository architecture using Prisma ORM. This standardized data access and improved maintainability.
- **Item 2:** **Comprehensive Admin Panel:** Implemented full CRUD functionality for all major entities (`Auctions`, `Lots`, `Users`, `Sellers`, `Auctioneers`, `Categories`, `Judicial Entities`, etc.).
- **Item 4:** **Functional Dashboards:** Built and populated with data the main User Dashboard (`/dashboard/*`) and the Consignor Dashboard (`/consignor-dashboard/*`).
- **Item 5:** **Public-Facing Pages:** Developed key public pages including the Homepage, Search, and detailed views for auctions, lots, sellers, and auctioneers.
- **Item 6:** **User Authentication & Permissions:** Implemented a secure session-based authentication system with a granular, role-based permission model.
- **Item 7:** **Auction Creation Wizard Enhancement:** Refactored the auction wizard to correctly filter assets based on auction type (judicial vs. extrajudicial) and improved the workflow visualization.
- **Item 8:** **Full AI Integration:** Connecting the UI to the existing Genkit AI flows (`suggest-listing-details`, `predict-opening-value`) to provide listing suggestions and predictions to users during the auction creation process.
- **Item 9:** **PDF Document Generation:** Implemented the server-side logic using Puppeteer to generate PDF documents for winning bid terms, accessible from both the admin and user dashboards.
- **Item 10:** **Advanced UI/UX Features:** Implemented real-time updates for bids and auction status using polling and expanded the gamification system.
- **Item 11:** **Payment Gateway Integration:** Integrated a simulated payment processor for handling final payments for won lots, including checkout page, form validation, and status updates.
- **Item 13: Extração de Dados de Documentos com IA:** Implemented the full flow for document upload, AI data extraction, and a validation modal for user confirmation and form-filling.
- **Item 14: BidExpertOkrs - Dashboards de Análise e KPIs (Estratégico):**
    - **Fase 1:** Implementado o Dashboard de Relatórios Gerais (`/admin/reports`).
    - **Fase 2:** Criados dashboards de análise de grupo para Cidades, Estados, Comitentes, Leiloeiros, Categorias, Lotes e Leilões.
    - **Fase 3:** Adicionadas seções de dashboard de performance individual nas páginas de edição de Comitentes, Leiloeiros e Leilões.
    - **Fase 4:** Implementados dashboards de análise para todas as entidades judiciais (Tribunais, Comarcas e Varas).
    - **Fase 5:** Integrado o Genkit para fornecer análises e recomendações inteligentes em todos os dashboards de análise de grupo.
- **Item 15:** **Melhorar Formulário de Leilão com Seletores de Localização:** Substituídos os campos de texto "Estado" e "Cidade" no formulário de criação/edição de leilões por componentes `EntitySelector` inteligentes.
- **Item 19:** **Infraestrutura e UI para Marcas/Modelos de Veículos:** Criado todo o backend (Schema, Service, Repo) e as telas de CRUD no Admin para gerenciar Marcas e Modelos de veículos. Adicionados seletores no formulário de Bem e integrados aos filtros da página de busca.
- **Item 20:** **Inteligência de Herança de Comitente:** Ao criar um novo lote, se um leilão for selecionado, o campo "Comitente" do lote é preenchido automaticamente com o comitente do leilão.
- **Item 21:** **Implementar Incremento de Lance no Lote:** Adicionado o campo `bidIncrementStep` no formulário de lote. A lógica de lances agora valida o incremento mínimo.
- **Item 22: Gerenciamento Flexível da Galeria de Imagens:** Implementada a lógica de herança de imagens de um `Bem` específico para um `Lote`, incluindo a UI no formulário de lote e a exibição correta das imagens nos componentes visuais da plataforma.
- **Item 23: Implementar Lógica de Precificação por Etapa (Back-end e UI):**
    - **Fase 1: Refatoração do Back-end:** Atualizados os serviços (`LotService`, `AuctionService`) e o schema para ler/escrever os dados financeiros na tabela `LotAuctionStageDetails`.
    - **Fase 2: Refatoração da UI:** Modificados os formulários para permitir a configuração de valores por praça/etapa.
    - **Fase 3: Atualização dos Componentes Visuais:** Garantido que a UI exiba o preço correto para a etapa atual do leilão.

## DOING
- **Item 15 (Continuação):** Integrar um mapa interativo no formulário para definir a localização do leilão visualmente.
- **Item 3 & 12:** **Full Test Coverage:** Expand the E2E test suite to cover all remaining entities and user flows, ensuring complete application stability. This includes the expanded scenarios requested.

## NEXT
- **Item 16: Lógica de Relistagem de Lotes:**
    - Implementar a funcionalidade para relistar um lote que não foi vendido.
    - Permitir a aplicação de descontos automáticos na relistagem (ex: 50%).
    - Adicionar um badge de "Super Oferta" ou "2ª Chance" para lotes relistados.
- **Item 17: Reloteamento de Bens:**
    - Criar a lógica para desvincular um `Bem` de um lote não vendido.
    - Permitir que um `Bem` desvinculado seja associado a um novo lote em um novo leilão.
    - Garantir que o histórico do `Bem` reflita sua participação em múltiplos lotes e leilões.
- **Item 18: Implementação de Pagamento Parcelado:**
    - Criar o fluxo de "checkout" para pagamento parcelado (ex: 12 boletos).
    - Adicionar um novo `Role` "Financeiro".
    - Desenvolver um painel financeiro para que o time possa visualizar o status dos pagamentos, comissões e desvalorização de ativos.
- **(A definir):** Próximas funcionalidades a serem priorizadas após a conclusão dos itens acima.
