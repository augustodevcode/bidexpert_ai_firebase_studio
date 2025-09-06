# Project Progress - BidExpert

## DONE
- **Item 1:** **Core Architecture Refactoring:** Fully migrated the application to a layered MVC + Service + Repository architecture using Prisma ORM. This standardized data access and improved maintainability.
- **Item 2:** **Comprehensive Admin Panel:** Implemented full CRUD functionality for all major entities (`Auctions`, `Lots`, `Users`, `Sellers`, `Auctioneers`, `Categories`, `Judicial Entities`, etc.).
- **Item 3 & 12:** **Full Test Coverage:** Expanded the E2E test suite to cover all remaining entities and user flows, ensuring complete application stability. This includes the expanded scenarios requested.
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
- **Item 15:** **Melhorar Formulário de Leilão com Seletores de Localização e Mapa:** Substituídos os campos de texto por `EntitySelector` e integrado um mapa interativo no formulário para definir a localização visualmente.
- **Item 16: Lógica de Relistagem de Lotes:** Implementada a funcionalidade para relistar um lote que não foi vendido, incluindo a UI no modal da página de edição do lote.
- **Item 17: Reloteamento de Bens:** Criada a lógica para desvincular um `Bem` de um lote não vendido, revertendo seu status para "DISPONÍVEL".
- **Item 18: Implementação de Pagamento Parcelado:** Criado o fluxo de checkout e um painel financeiro para pagamentos parcelados, incluindo um novo perfil de usuário "Financeiro".
- **Item 23: Implementar Lógica de Precificação por Etapa:** Refatorada a base de dados (Prisma), serviços e a interface de usuário (formulários, páginas de detalhe) para suportar a definição de preços (lance inicial, incremento) por etapa/praça do leilão, em vez de um valor fixo no lote.

## DOING
- **(Nenhum item em andamento no momento)**

## NEXT
- **Item 21: Refatoração e Abstração de Componentes e Lógica (Análise de Padrões)**
    - **Relatório de Análise:**
        - **Componente Genérico de Tabela de Dados (<ResourceDataTable />):** A estrutura de administração em `src/app/admin/` é altamente repetitiva. A lógica para renderizar a tabela, paginação, filtros e ações é duplicada em cada página de listagem. A solução é criar um componente `<ResourceDataTable />` reutilizável que abstrai essa lógica.
        - **Wrapper Genérico de Formulário de Recurso (<ResourceForm />):** Os formulários de criação e edição em `src/app/admin/*/new` e `src/app/admin/*/[id]/edit` repetem a lógica de busca de dados, configuração de formulário (react-hook-form, Zod), estado de submissão e exibição de toasts. A solução é criar um componente wrapper `<ResourceForm />` que gerencia o estado e a lógica de submissão.
        - **Abstração para Server Actions CRUD (createCrudActions):** Cada arquivo `actions.ts` repete a estrutura básica para operações CRUD (create, update, delete, fetch). A solução é criar uma função de fábrica (`createCrudActions`) que gera essas ações com base em um modelo Prisma e schemas Zod, reduzindo a repetição e padronizando o comportamento.
        - **Pacote de Componentes de UI de Domínio (@suaorg/domain-ui):** Componentes específicos do domínio de leilões (ex: `AuctionStatusBadge`, `LotCard`, `CountdownTimer`) estão espalhados. A solução é agrupá-los em um pacote interno para garantir consistência e reutilização.
- **Item 20: Auditoria e Refatoração Arquitetural (Análise de GAPs)**
    - **Objetivo:** Corrigir as lacunas entre as regras de arquitetura definidas e a implementação atual do código.
    - **Relatório de Análise:**
        - **Arquitetura de Dados (Não Conforme):** Chamadas diretas ao `prisma` foram encontradas em Server Actions. É necessário refatorar para que todas as chamadas passem pelas classes de Repositório.
        - **Padrão Controller-Service-Repository (Não Conforme):** A separação de camadas não é rigorosa. As Server Actions (Controllers) pulam a camada de Serviço e/ou Repositório. É preciso auditar e corrigir os fluxos de dados.
        - **Nomenclatura (Parcialmente Conforme):** O código mistura português e inglês. É preciso padronizar para português em todo novo código.
        - **Atributos de Teste/IA (Não Conforme):** Falta padronização e aplicação consistente do atributo `data-ai-id` em elementos estruturais.
        - **Uso do EntitySelector (Não Verificado):** É preciso auditar todos os formulários de admin para garantir que o componente `EntitySelector` está sendo usado para todos os relacionamentos, em vez de um `<select>` padrão.
- **Item 19: Padronização de Identificadores `data-ai-id`:**
    - **Objetivo:** Adicionar atributos `data-ai-id` únicos, legíveis e funcionais a todos os contêineres e componentes estruturais da interface do usuário que ainda não os possuem.
    - **Racional:** A prática atual depende de classes de CSS ou do atributo `data-ai-hint`, que não são seletores estáveis. Um `data-ai-id` padronizado (ex: `[contexto]-[funcao]-[tipo]`) irá facilitar a criação de testes E2E robustos, permitir que assistentes de IA manipulem a UI de forma precisa e simplificar o debugging.
    - **Exemplos Críticos a serem Mapeados:**
        - Contêineres de página (`checkout-page-container`).
        - Layouts de grid (`checkout-layout-grid`).
        - Cards principais (`checkout-order-summary-card`, `lot-card-container`).
        - Componentes complexos (`admin-auctions-data-table`).
        - Menus de ação em tabelas (`data-table-row-actions-menu`).
- **(A definir):** Próximas funcionalidades a serem priorizadas após a conclusão dos itens acima.
