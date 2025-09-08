# AI Prototyper Rules

This document contains specific rules and guidelines for the AI prototyper to follow during development.

## 1. Human Authorization and Non-Regression Principle

**Rule:** Any deletion of functionality, components, or significant project alteration **must be explicitly authorized by a human user**. To prevent accidental removal of perfectly functional items while implementing fixes or improvements, the AI must:
1.  Clearly state its intention to delete or refactor a component/file/feature.
2.  Provide a brief justification for why this change is necessary.
3.  Ask for explicit confirmation from the user before proceeding with generating the changes.

**Rationale:** This principle ensures that the development process is always moving forward and prevents regressions. It maintains a safeguard where the human developer has the final say on any destructive or large-scale changes, preserving the stability and integrity of the project.

## 2. Monorepo and Separation of Concerns Architecture

**Rule:** The project follows a **monorepo architecture** managed by `pnpm` and `Turborepo`. All new features and refactoring must adhere to this structure to ensure code reuse and maintainability.

-   **`packages/core`**: This is the central package for business logic, types, services, and data access.
    -   **Contains**: `PrismaClient`, `schema.prisma`, all `services` (e.g., `AuctionService`), all `repositories` (e.g., `AuctionRepository`), and all shared Zod schemas and TypeScript types.
    -   **Guideline**: All database interaction and core business logic **must** be implemented here. It is strictly forbidden to create duplicate services or repositories within the `apps` directories.

-   **`packages/ui`**: This is the shared React component library, based on ShadCN.
    -   **Contains**: All reusable UI components, from basic `<Button>` to complex domain components like `<AuctionCard>`.
    -   **Guideline**: Visual components that can be used across the platform must be created or moved here. The `web` app should import them from `@bidexpert/ui`.

-   **`apps/web`**: This is the main Next.js application, which serves as the **presentation layer**.
    -   **Guideline**: `Server Actions` within this app should be lightweight, orchestrating calls to services in `@bidexpert/core`. Heavy business logic is not allowed here. The app re-exports components from `@bidexpert/ui` in its local `src/components` directory for backward compatibility; this pattern should be maintained.

-   **`apps/microservice`**: This is an independent Fastify backend service.
    -   **Guideline**: Business logic that requires extra security or can be scaled independently (like commission calculations) is implemented here. The `web` app interacts with it via its API, using a BFF pattern where needed (e.g., `apps/web/src/services/checkout.service.ts`).

**Rationale**: This architecture promotes code reuse, simplifies dependencies, improves security by isolating critical logic, and organizes the project for scalability and maintainability.

## 3. Schema and Migrations

**Rule:** The single source of truth for the database schema is `packages/core/prisma/schema.prisma`. Any necessary schema changes must be made in this file. During development, the schema should be synchronized with the database by running `pnpm db:push`.

**Rationale:** Using a centralized Prisma schema ensures type safety and a consistent database structure.

## 4. Code Quality and Naming Conventions

### 4.1. Language and Naming

**Rule:** All code, including function names, variables, and internal comments, **must be written in English**. Portuguese should only be used for UI text visible to the end-user and in documentation files like `README.md` or `GEMINI.md`.

**Rationale:** Using English as the standard for code promotes consistency, readability, and aligns with global software development best practices.

### 4.2. Form Component Standardization

**Rule:** For all CRUD forms, any field representing a foreign key relationship (e.g., selecting a `seller` for an `auction`) **must** use the custom `EntitySelector` component from `@bidexpert/ui`. Direct use of a standard `<Select>` component for entity relationships is disallowed.

**Rationale:** This ensures a consistent, powerful, and user-friendly interface across the entire admin panel.

### 4.3. HTML Element Identification

**Rule:** All new HTML elements created must have a `data-ai-id` attribute with a unique, human-readable, and contextually relevant name. This name should reflect the element's purpose or content (e.g., `<Button data-ai-id="login-submit-button">`).

**Rationale:** This convention is essential for the AI to reliably identify and manipulate specific UI elements.

## 5. Next.js & React Best Practices

-   **Default to Server Components:** Components should be Server Components by default. Only use `'use client'` when client-side interactivity is absolutely necessary.
-   **Server Actions for Mutations:** All data mutations (create, update, delete) must be handled through Next.js Server Actions.
-   **Image Optimization:** Always use the built-in `next/image` component.
-   **Memoization:** Use `useMemo` and `useCallback` appropriately in client components to prevent unnecessary re-renders.
-   **Error Handling:** Implement `error.js` files at appropriate route segments.
-   **Valid Link Hrefs:** Never allow the `href` prop of a Next.js `<Link>` component to be `undefined`.

## 6. Dependency Management

**Rule:** To keep the project optimized, follow these guidelines:
-   **`devDependencies`:** Packages used only for development or testing (e.g., `@playwright/test`, `puppeteer`) must be placed in `devDependencies`.
-   **Analyze Heavy Packages:** Before adding a new dependency, evaluate its size and impact.
-   **Periodic Review:** Periodically review `package.json` files to remove unused dependencies.

**Rationale:** A large `node_modules` directory and bloated production bundles lead to slower installation, builds, and higher hosting costs.

## 7. BidExpertOkrs: Strategic Analysis and KPIs

**Rule:** All entity management sections (CRUDs) must evolve into comprehensive analysis modules.
-   **Aggregate Dashboards:** Each main entity menu (e.g., "Leilões") must have an "Análise" sub-menu with KPIs and charts.
-   **Individual Dashboards:** The detail/edit page for each record must include a dashboard with historical KPIs for that specific record.
-   **AI-Powered Insights (Genkit):** Dashboards should incorporate a section for intelligent analysis and recommendations generated by Genkit, interpreting the presented data.

**Rationale:** This transforms the admin panel from a data entry tool into a powerful Business Intelligence (BI) and decision support center, enabling data-driven management and strategic planning.

## 8. Testes (Resumo da Estratégia)

A estratégia de testes completa está documentada no arquivo `GEMINI.md`. Os pontos chave são:
-   **Tipos de Teste:** Unitários, Integração e E2E (End-to-End).
-   **Consistência de Schemas:** Usar `Prisma Migrate` e geradores automáticos para sincronizar schemas do banco, Prisma e Zod.
-   **Cobertura:** Testar todos os fluxos críticos (cadastro, lances, encerramento de leilão, etc.).
-   **Ambiente de Teste:** Banco de dados isolado (Docker) e scripts de setup/reset.
-   **Ferramentas:** `Vitest` para testes unitários/integração, `Playwright` para E2E, e `Supertest` para simulação de API.
-   **Princípio da Cobertura Contínua:** Toda nova funcionalidade ou correção deve ser acompanhada de testes correspondentes.
