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

-   **Tenant Identification:**
    -   **Subdomínio:** O tenant ativo é primariamente identificado pelo subdomínio da requisição (ex: `leiloeiro-x.bidexpert.com` resolve para o `tenantId` de "leiloeiro-x"). Isso é gerenciado por um middleware do Next.js.
    -   **Domínio Principal (Landlord):** Requisições ao domínio principal (ex: `bidexpert.com.br` ou `www.bidexpert.com.br`) que não possuem subdomínio devem sempre resolver para o tenant "Landlord", que tem `id = '1'`.
    -   **Sessão:** Para usuários autenticados, o `tenantId` é armazenado no cookie de sessão e tem precedência, garantindo que o usuário permaneça em seu espaço de trabalho selecionado.

-   **Schema:** All relevant data models (e.g., `Auction`, `Lot`, `Seller`, etc., but **not** global models like `Role` or `User`) must include a mandatory `tenantId` field to associate the record with a specific tenant.

-   **Data Access:**
    -   Every database query (read, write, update, delete) executed through the Service and Repository layers **must** be filtered by the `tenantId` from the current request's context.
    -   This is enforced by a Prisma middleware (`src/lib/prisma.ts`) that automatically injects the `tenantId` into `WHERE` clauses for all tenant-specific models.

-   **Security:** Under no circumstances should a user from one tenant be able to access, view, or modify data belonging to another tenant.

**Rationale:** This rule is the cornerstone of the platform's security and data integrity, ensuring that each client's (leiloeiro's) data is completely isolated within their own operational scope.

## 3. Database and Data Source Architecture

**Rule:** The application uses **Prisma ORM** as its exclusive data access layer. All data access logic must be encapsulated within `Repository` classes (e.g., `src/repositories/seller.repository.ts`).

**Rationale:** Using Prisma as the single source of truth for database interactions provides type safety, simplifies queries, and allows the application to seamlessly switch between different SQL databases.

## 4. Modular Prisma Schema Architecture

**Rule:** To maintain organization and readability, the Prisma schema is modularized.
- **Models Directory:** All Prisma models (`model`) and enumerations (`enum`) **must** be defined in individual `.prisma` files within the `prisma/models/` directory. Each file should ideally contain only one model.
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

### 7.1. File Header Comments (New Rule)
**Rule:** Every code file (e.g., `.ts`, `.tsx`, `.js`) **must** begin with a block comment that clearly and concisely explains the file's purpose and its primary responsibilities within the application architecture.

**Example (`src/services/auction.service.ts`):**
```typescript
// src/services/auction.service.ts
/**
 * @fileoverview This file contains the AuctionService class, which encapsulates
 * the core business logic for managing auctions. It acts as an intermediary
 * between the server actions (controllers) and the auction repository (data access layer).
 * Responsibilities include creating, updating, validating, and fetching auction data.
 */
```

**Rationale:** This ensures that any developer (or AI) can quickly understand the role of each file, reducing ambiguity and improving maintainability. It also provides crucial context for AI-assisted development and analysis.

### 7.2. Form Component Standardization
**Rule:** For all CRUD forms, any field representing a foreign key relationship (e.g., selecting a `seller` for an `auction`) **must** use the custom `EntitySelector` component.

**Rationale:** This ensures a consistent, powerful, and user-friendly interface across the entire admin panel.

### 7.3. JavaScript/TypeScript Naming
**Rule:** All new or modified functions, variables, and components must have names that are descriptive, human-readable, and contextually relevant, preferably in Portuguese.

**Rationale:** Clear and consistent naming is fundamental for code quality.

### 7.4. HTML Element Identification
**Rule:** All new HTML elements created must have a `data-ai-id` attribute with a unique, human-readable, e contextually relevant name.

**Rationale:** This convention is essential for the AI to reliably identify and manipulate specific UI elements.

## 8. Next.js & React Best Practices

-   **Default to Server Components:** Use `'use client'` only when client-side interactivity is absolutely necessary.
-   **Server Actions for Mutations:** All data mutations must be handled through Next.js Server Actions.
-   **Image Optimization:** Always use the built-in `next/image` component.
-   **Valid Link Hrefs:** Never allow the `href` prop of a Next.js `<Link>` component to be `undefined`.

## 9. Gerenciamento de Dependências

**Rule:** To keep the project optimized, dependencies used only for development or testing (e.g., `@playwright/test`, `puppeteer`) **must** be placed in `devDependencies` in `package.json`, not in `dependencies`.
