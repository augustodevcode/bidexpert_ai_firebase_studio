# AI Prototyper Rules

This document contains specific rules and guidelines for the AI prototyper to follow during development.

## 1. Human Authorization and Non-Regression Principle

**Rule:** Any deletion of functionality, components, or significant project alteration **must be explicitly authorized by a human user**. To prevent accidental removal of perfectly functional items while implementing fixes or improvements, the AI must:
1.  Clearly state its intention to delete or refactor a component/file/feature.
2.  Provide a brief justification for why this change is necessary.
3.  Ask for explicit confirmation from the user before proceeding with a destructive change.

**Rationale:** This principle ensures that the development process is always moving forward and prevents regressions. It maintains a safeguard where the human developer has the final say on any destructive or large-scale changes, preserving the stability and integrity of the project.

## 2. Multi-Tenant Architecture and Data Isolation

**Rule:** The application operates under a strict multi-tenant architecture. All data access must be isolated by a `tenantId`.
- **Schema:** All relevant data models (e.g., `Auction`, `Lot`, `Seller`, etc., but **not** global models like `Role` or `User`) must include a mandatory `tenantId` field to associate the record with a specific tenant.
- **Data Access:** Every database query (read, write, update, delete) executed through the Service and Repository layers **must** be filtered by the `tenantId` from the current user's session or the request's context. This is enforced by a Prisma middleware.
- **Development Context:** During development, scripts or unauthenticated contexts (like public pages) will use a default `tenantId` (typically '1', for the "Landlord") specified in the `.env` file for testing and seeding purposes.
- **Subdomain Routing:** The application must be able to identify the active tenant based on the request's subdomain (e.g., `leiloeiro-x.bidexpert.com` must resolve to the `tenantId` of "leiloeiro-x"). This is handled by a middleware.
- **Security:** Under no circumstances should a user from one tenant be able to access, view, or modify data belonging to another tenant.

**Rationale:** This rule is the cornerstone of the platform's security and data integrity, ensuring that each client's (leiloeiro's) data is completely isolated within their own operational scope.

## 3. Database and Data Source Architecture

**Rule:** The application uses **Prisma ORM** as its exclusive data access layer. All data access logic must be encapsulated within `Repository` classes (e.g., `src/repositories/seller.repository.ts`).

**Rationale:** Using Prisma as the single source of truth for database interactions provides type safety, simplifies queries, and allows the application to seamlessly switch between different SQL databases.

## 4. Modular Prisma Schema Architecture

**Rule:** To maintain organization and readability, the Prisma schema is modularized.
- **Models Directory:** All Prisma models (`model`) and enumerations (`enum`) **must** be defined in individual `.prisma` files within the `prisma/models/` directory.
- **Header File:** The `prisma/header.prisma` file contains the `generator` and `datasource` blocks.
- **Build Process:** The script `scripts/build-prisma-schema.ts` is responsible for reading the header and all files in `prisma/models/`, concatenating them, and generating the final `prisma/schema.prisma` file. This script is executed automatically.
- **Editing:** Schema changes **must** be made in the individual files within `prisma/models/`. The main `prisma/schema.prisma` file **MUST NOT BE EDITED DIRECTLY**, as it is an auto-generated file and any manual changes will be overwritten.

**Rationale:** This approach prevents a monolithic `schema.prisma` file, making it easier to maintain and locate specific data models, and ensures that the single source of truth for models is their individual files.

## 5. MVC with Service Layer Architecture

**Rule:** The application's architecture is strictly defined as **Model-View-Controller (MVC) with an intermediate Service Layer and a Repository Layer**. This structure is the standard for all new development.
- **Controllers** (Server Actions in `actions.ts` files) handle user input and API requests.
- **Services** (`/services/*.ts`) contain the core business logic.
- **Repositories** (`/repositories/*.ts`) encapsulate all database queries using the **Prisma Client**.
- **Data Access:** Direct use of `PrismaClient` in services or controllers is forbidden.

**Rationale:** Maintaining a consistent, layered architecture is crucial for the long-term scalability, maintainability, and testability of the project.

## 6. Directory Structure

**Rule:** The Next.js application structure must follow the `src` directory convention. The main application routes must reside within `src/app`. **Under no circumstances should a nested `app` directory (e.g., `src/app/app`) or a root-level `app` directory be created.**

**Rationale:** A misplaced `app` directory breaks Next.js's file-based routing system.

## 7. Code Quality and Naming Conventions

### 7.1. Form Component Standardization
**Rule:** For all CRUD forms, any field representing a foreign key relationship (e.g., selecting a `seller` for an `auction`) **must** use the custom `EntitySelector` component.

**Rationale:** This ensures a consistent, powerful, and user-friendly interface across the entire admin panel.

### 7.2. JavaScript/TypeScript Naming
**Rule:** All new or modified functions, variables, and components must have names that are descriptive, human-readable, and contextually relevant, preferably in Portuguese.

**Rationale:** Clear and consistent naming is fundamental for code quality.

### 7.3. HTML Element Identification
**Rule:** All new HTML elements created must have a `data-ai-id` attribute with a unique, human-readable, and contextually relevant name.

**Rationale:** This convention is essential for the AI to reliably identify and manipulate specific UI elements.

## 8. Next.js & React Best Practices

-   **Default to Server Components:** Use `'use client'` only when client-side interactivity is absolutely necessary.
-   **Server Actions for Mutations:** All data mutations must be handled through Next.js Server Actions.
-   **Image Optimization:** Always use the built-in `next/image` component.
-   **Valid Link Hrefs:** Never allow the `href` prop of a Next.js `<Link>` component to be `undefined`.

## 9. Gerenciamento de Dependências

**Rule:** To keep the project optimized, dependencies used only for development or testing (e.g., `@playwright/test`, `puppeteer`) **must** be placed in `devDependencies` in `package.json`, not in `dependencies`.


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

### 5.1. JavaScript/TypeScript Naming

**Rule:** All new or modified functions, variables, and components must have names that are descriptive, human-readable, and contextually relevant, preferably in Portuguese (e.g., `buscarLeiloes`, `SalvarComitenteButton`). This practice applies to all parts of the codebase, from front-end components to back-end services.

**Rationale:** Clear and consistent naming is fundamental for code quality, making the application easier to read, debug, and maintain for all developers involved, including AI assistants.

### 5.2. HTML Element Identification

**Rule:** All new HTML elements created must have a `data-ai-id` attribute with a unique, human-readable, and contextually relevant name. This name should reflect the element's purpose or content. For example, a button to submit a login form should be `<Button data-ai-id="login-submit-button">`, and a container for a user's profile card should be `<div data-ai-id="user-profile-card">`.

**Rationale:** This convention is essential for the AI to reliably identify and manipulate specific UI elements, ensuring that future requests are executed precisely. It also aids in end-to-end testing and debugging.

## 6. Development Environment Information

**Rule:** During development (`NODE_ENV === 'development'`), the application footer must display key environment information. This includes the currently active database system (e.g., MySQL, PostgreSQL), the logged-in user's email, and the active Firebase Project ID.

**Rationale:** This provides immediate, persistent context about the development environment, preventing confusion and aiding in debugging database or user-specific issues.

- **Fluxo de Dados Obrigatório**: `Frontend → Controller (Server Action) → Service → Repository → Prisma → Database`. Nunca pule camadas.
- **Evolução, Não Substituição**: Nunca delete ou reescreva funcionalidades existentes sem um bom motivo. A prioridade é evoluir e melhorar o código atual.
- **Consistência**: Mantenha a consistência do código, seguindo os padrões já estabelecidos no projeto.