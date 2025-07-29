# AI Prototyper Rules

This document contains specific rules and guidelines for the AI prototyper to follow during development.

## 1. Database and Data Source Architecture

**Rule:** The application uses **Prisma ORM** as its exclusive data access layer. Direct use of database drivers is forbidden. All data access logic must be encapsulated within `Repository` classes (e.g., `src/repositories/seller.repository.ts`).

**Rationale:** Using Prisma as the single source of truth for database interactions provides type safety, simplifies queries, and allows the application to seamlessly switch between different SQL databases (MySQL, PostgreSQL) by only changing the `provider` in the `schema.prisma` file and the `DATABASE_URL` in the `.env` file. This eliminates the need for manual database adapters.

## 2. Schema and Migrations

**Rule:** The single source of truth for the database schema is `prisma/schema.prisma`. Any necessary schema changes must be made in this file. During development, the schema should be synchronized with the database by running `npm run db:push`, which is part of the `npm run dev` script.

**Rationale:** Using Prisma as the schema definition tool ensures type safety and provides a consistent way to manage the database structure across different SQL environments.

## 3. MVC with Service Layer Architecture

**Rule:** The application's architecture is strictly defined as **Model-View-Controller (MVC) with an intermediate Service Layer and a Repository Layer**. This structure is the standard for all new development.
- **Controllers** (Server Actions in `actions.ts` files) handle user input and API requests. They are responsible for orchestrating calls to the service layer.
- **Services** (`/services/*.ts`) contain the core business logic, orchestrating calls to one or more repositories and other services. They are decoupled from both the database and the controllers.
- **Repositories** (`/repositories/*.ts`) encapsulate all database queries using the **Prisma Client**. They are the only layer allowed to directly interact with the database.
- **Data Access:** Direct use of `PrismaClient` in services or controllers is forbidden. All database interactions must go through a `Repository`.

**Rationale:** Maintaining a consistent, layered architecture is crucial for the long-term scalability, maintainability, and testability of the project. This separation of concerns (Presentation, Business Logic, Data Access) makes the codebase cleaner and easier to manage.

## 4. Directory Structure

**Rule:** The Next.js application structure must follow the `src` directory convention. The main application routes must reside within `src/app`. **Under no circumstances should a nested `app` directory (e.g., `src/app/app`) or a root-level `app` directory be created.** Any such occurrence must be identified and corrected immediately by merging the files into `src/app` and removing the incorrect directory.

**Rationale:** A nested or misplaced `app` directory breaks Next.js's file-based routing system, leading to build failures and runtime errors. Maintaining the correct structure is critical for the application's stability.

## 5. Code Quality and Naming Conventions

### 5.1. Form Component Standardization

**Rule:** For all CRUD forms, any field representing a foreign key relationship (e.g., selecting a `seller` for an `auction`) **must** use the custom `EntitySelector` component. This component provides a standardized and enhanced user experience including search, on-the-fly creation, editing, and list refreshing. Direct use of a standard `<Select>` component for entity relationships is disallowed.

**Rationale:** This ensures a consistent, powerful, and user-friendly interface across the entire admin panel, reducing development time for new forms and improving the end-user workflow by preventing the need to navigate away to create prerequisite entities.

### 5.2. JavaScript/TypeScript Naming

**Rule:** All new or modified functions, variables, and components must have names that are descriptive, human-readable, and contextually relevant, preferably in Portuguese (e.g., `buscarLeiloes`, `SalvarComitenteButton`). This practice applies to all parts of the codebase, from front-end components to back-end services.

**Rationale:** Clear and consistent naming is fundamental for code quality, making the application easier to read, debug, and maintain for all developers involved, including AI assistants.

### 5.3. HTML Element Identification

**Rule:** All new HTML elements created must have a `data-ai-id` attribute with a unique, human-readable, and contextually relevant name. This name should reflect the element's purpose or content. For example, a button to submit a login form should be `<Button data-ai-id="login-submit-button">`, and a container for a user's profile card should be `<div data-ai-id="user-profile-card">`.

**Rationale:** This convention is essential for the AI to reliably identify and manipulate specific UI elements, ensuring that future requests are executed precisely. It also aids in end-to-end testing and debugging.

## 6. Next.js & React Best Practices

-   **Default to Server Components:** Components should be Server Components by default. Only use the `'use client'` directive when client-side interactivity (hooks like `useState`, `useEffect`, event listeners) is absolutely necessary. This reduces the amount of JavaScript sent to the client, improving performance.
-   **Server Actions for Mutations:** All data mutations (create, update, delete) must be handled through Next.js Server Actions. This simplifies the architecture by eliminating the need for separate API routes and provides a secure, built-in mechanism for form submissions and data handling.
-   **Image Optimization:** Always use the built-in `next/image` component for displaying images. It provides automatic optimization, resizing, and lazy loading, which are crucial for performance.
-   **Memoization:** In client components, use `useMemo` to memoize the results of expensive calculations and `useCallback` to memoize functions passed to child components. This prevents unnecessary re-renders and improves UI responsiveness.
-   **Error Handling:** Implement `error.js` files at appropriate route segments to handle runtime errors gracefully and prevent the entire application from crashing.
-   **Type Safety:** Utilize TypeScript's `import type` for type-only imports to improve build performance and maintain clear separation between type information and runtime code.

## 7. Development Environment Information

**Rule:** During development (`NODE_ENV === 'development'`), the application footer must display key environment information. This includes the currently active database system (e.g., MySQL, PostgreSQL), the logged-in user's email, and the active Firebase Project ID.

**Rationale:** This provides immediate, persistent context about the development environment, preventing confusion and aiding in debugging database or user-specific issues.

## 8. BidExpertOkrs: Análise Estratégica, KPIs e Insights

**Rule:** All entity management sections (CRUDs) must evolve into comprehensive management and analysis modules, providing strategic insights beyond simple data display. This includes:

-   **Dashboards de Análise Agregada:** Cada menu de entidade principal (e.g., "Leilões", "Comitentes", "Cidades") deve conter um sub-menu de "Análise" (e.g., `/admin/auctions/analysis`) que apresenta KPIs agregados, gráficos comparativos e métricas de performance para o grupo de entidades.
-   **Dashboards de Análise Individual:** A página de detalhe/edição de cada registro (`/admin/[entity]/{id}/edit`) deve incluir uma seção de dashboard exibindo KPIs históricos e métricas de desempenho específicas para aquele registro.
-   **Análise de Dados Aprofundada:** As análises devem, sempre que possível, ir além das contagens básicas. O objetivo é cruzar dados para identificar tendências, padrões e oportunidades (leading indicators). Isso inclui:
    -   **Análise Geográfica:** Mapear performance por cidade, estado e, futuramente, por região (Norte, Sudeste, etc.). A longo prazo, planejar a integração com dados demográficos e econômicos externos (ex: IBGE) para enriquecer os insights.
    -   **Análise Comportamental:** Cruzar dados de leilões com perfis de usuários para entender padrões de lances e preferências.
-   **Fonte de Dados Dinâmica:** Todos os dados dos dashboards devem ser derivados de queries diretas ao banco de dados da aplicação (via Prisma). O uso de dados estáticos ou de exemplo é estritamente proibido para estes componentes.
-   **Insights com IA (Genkit):** Os dashboards devem progressivamente incorporar uma seção para análises e recomendações inteligentes geradas pelo Genkit. A IA deve interpretar os dados apresentados (KPIs, gráficos) e fornecer insights textuais, apontando oportunidades, gargalos e recomendações estratégicas para a diretoria.

**Rationale:** Esta estratégia transforma o painel de administração de uma ferramenta de entrada de dados em um poderoso centro de Business Intelligence (BI) e suporte à decisão. Ela habilita a gestão baseada em dados, o monitoramento de OKRs, a identificação de oportunidades estratégicas e o alinhamento de toda a empresa em torno de objetivos mensuráveis.
