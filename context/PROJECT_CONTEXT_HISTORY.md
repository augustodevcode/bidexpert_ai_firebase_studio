# Project Context History - BidExpert

This document summarizes the BidExpert project, including its purpose, core features, technological stack, style guidelines, key development milestones, decisions, and errors encountered and resolved.

**Atenção:** As regras de negócio e especificações detalhadas do projeto foram consolidadas no arquivo `REGRAS_NEGOCIO_CONSOLIDADO.md`. Este arquivo de histórico deve ser usado para entender a evolução do projeto, mas o `REGRAS_NEGOCIO_CONSOLIDADO.md` é a única fonte da verdade para as regras atuais.

## Project Overview

**App Name**: BidExpert

**Core Purpose**: To create a comprehensive online auction platform enabling users to participate in and manage auctions efficiently.

**Core Features (from PRD):**
*   Auction Catalog: Filterable, sortable catalog of auctions on the home page.
*   Lot Detail Presentation: User-friendly lot details page.
*   User Authentication: Account creation, login, and profile management pages.
*   Auction Search: Implement auction browse and search to quickly locate auctions by various criteria such as category and location.
*   Site Navigation: Facilitate easy navigation across the site with clear menu structures and a comprehensive footer.
*   AI-Powered Auction Guidance: Recommendations for listing details, optimal opening values, and similar listing suggestions.

**Technology Stack & Architecture:**
*   **Architecture**: MVC (Model-View-Controller) with a Service Layer and Repository Layer.
    *   **Model**: Prisma ORM (`prisma/schema.prisma`).
    *   **View**: Next.js, React, ShadCN UI components, Tailwind CSS.
    *   **Controller**: Next.js Server Actions.
    *   **Service Layer**: Contains business logic (`src/services/*.ts`).
    *   **Repository Layer**: Handles data access via Prisma Client (`src/repositories/*.ts`).
*   **AI**: Genkit (for AI flows).
*   **Database**: Designed for MySQL via Prisma.

## Development Summary (Based on Interactions)

### Key Features & Functionalities Implemented/Worked On:

1.  **Consolidação das Regras de Negócio:** Todas as regras, especificações e diretrizes de design foram unificadas no arquivo `REGRAS_NEGOCIO_CONSOLIDADO.md` para servir como a única fonte da verdade, eliminando conflitos entre vários documentos de contexto.
2.  **Criação do Backlog de Gaps**: Com base na análise do arquivo consolidado, foi criado um backlog de tarefas no `PROJECT_PROGRESS.MD` para implementar as funcionalidades e correções necessárias para atingir 100% de conformidade com as regras definidas.
3.  **Refatoração do Seeding**: O script de seed de dados (`seed-data-extended.ts`) foi extensivamente refatorado para usar os serviços da aplicação em vez de inserções diretas no banco, garantindo a execução de toda a lógica de negócio e validações durante a criação dos dados de exemplo. Foram corrigidos múltiplos erros de chave estrangeira, criação de `PlatformSettings`, e associação de `Roles` a usuários.
4.  **Refatoração do Login**: O formulário de login foi atualizado para usar `react-hook-form` e `zod`, e a `Server Action` de login foi ajustada para receber os dados de forma estruturada, resolvendo o erro `Invalid Server Actions request`.

### Errors Encountered & Resolved (Summary):
*   **Erro de Constraint de Chave Estrangeira no Seed**: O script de limpeza tentava deletar `Tenants` antes de deletar registros em tabelas dependentes (como `PlatformSettings`). Resolvido corrigindo a ordem de exclusão na função `cleanupPreviousData`.
*   **Erro de "Registro Não Encontrado" no Seed**: O script tentava usar `update` em `PlatformSettings` antes de garantir sua criação. Resolvido mudando a lógica para `create` na primeira execução.
*   **Erro de ID de Role Indefinido no Seed**: Falha ao criar usuários de teste porque o ID do perfil (role) não era encontrado de forma confiável. Resolvido pré-carregando todos os perfis em um mapa para consulta rápida e segura durante a criação do usuário.
*   **`Invalid Server Actions request` no Login**: Causado por uma incompatibilidade na forma como o formulário enviava os dados para a Server Action. Resolvido refatorando o formulário para usar `react-hook-form` e ajustando a action para receber dados tipados.
*   **Erros de `ReferenceError`**: Corrigidos múltiplos erros de `FormMessage is not defined` em vários arquivos por simplesmente adicionar a importação do componente que estava faltando.

### Key Decisions & Patterns:
*   **Fonte Única da Verdade**: O arquivo `REGRAS_NEGOCIO_CONSOLIDADO.md` é agora o documento oficial para todas as regras de negócio e design, substituindo múltiplos arquivos de contexto.
*   **Seeding via Camada de Serviço**: A criação de dados de exemplo (seeding) deve ser feita exclusivamente através das classes de Serviço para garantir que a lógica de negócio seja aplicada.

This summary will be updated as we progress.
