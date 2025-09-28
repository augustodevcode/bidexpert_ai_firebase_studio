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