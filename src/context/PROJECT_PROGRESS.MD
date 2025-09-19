# Project Progress - BidExpert

## DONE
- **Item 1:** **Core Architecture Refactoring:** Fully migrated the application to a layered MVC + Service + Repository architecture using Prisma ORM.
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
- **Item 19: Padronização de Identificadores `data-ai-id`:** Adicionados atributos `data-ai-id` a todos os contêineres e componentes estruturais da interface do usuário para melhorar a testabilidade e a manipulação por IA.
- **Item 24: Unificação dos Componentes de Card (UniversalCard):** Refatorado todas as listagens e grids para usar `UniversalCard` e `UniversalListItem`.
- **Item 26: Adicionar Atalho de Mapa nos Cards:** Implementado um ícone clicável de mapa nos componentes `UniversalCard` e `UniversalListItem` que abre o Google Maps com as coordenadas do item.
- **Item 21: Implementar Responsividade Completa (Mobile & Tablet):** Ajustado o layout de todos os painéis (Admin, User, Consignor), header, tabelas e formulários para garantir uma experiência de uso consistente em dispositivos móveis.

## DOING
- **Item 20: Auditoria e Refatoração Arquitetural (Análise de GAPs)**
    - **Objetivo:** Corrigir as lacunas entre as regras de arquitetura definidas e a implementação atual do código.
    - **Status Atual:**
        - **Arquitetura de Dados (Conforme):** Todas as chamadas diretas ao `prisma` em `actions.ts` foram refatoradas para a camada de Serviço/Repositório.
        - **Padrão Controller-Service-Repository (Em Andamento):** Refatorando `actions` que pulam a camada de serviço e chamam repositórios diretamente.
    - **Próximos Passos:**
        - Auditar e padronizar nomenclatura (Português).
        - Garantir a aplicação consistente do atributo `data-ai-id`.
        - Auditar o uso do componente `EntitySelector` em todos os formulários.

## NEXT
- **Item 27: Refatorar Testes de Integração e E2E:**
    - **Objetivo:** Alinhar todos os testes (`*.test.ts`) com a arquitetura de serviços refatorada.
    - **Tarefas:**
        - Modificar testes para chamar `Server Actions` como ponto de entrada, em vez de instanciar serviços diretamente.
        - Garantir que os `mocks` e o `setup` dos testes reflitam a nova estrutura de dados e fluxo de controle.
        - Validar a lógica de negócio que foi movida para a camada de serviço.
- **(A definir):** Próximas funcionalidades a serem priorizadas após a conclusão dos itens acima.
