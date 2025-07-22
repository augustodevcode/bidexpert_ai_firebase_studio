# AI Prototyper Rules

This document contains specific rules and guidelines for the AI prototyper to follow during development.

## 1. Database Propagation and Schema

**Rule:** Any new functionality or bug fix must automatically propagate necessary changes to the database schema or data. For new tables/collections, auto-incrementing IDs should be used, leveraging the features of the underlying database technology.

**Rationale:** The developer should not be required to run external scripts (e.g., manual SQL migrations, external seeding scripts) to make a new or corrected feature functional.

**Implementation:**
-   If a new feature requires a new field, the AI must update the corresponding data creation/update actions to include that field.
-   If a data migration is needed, the AI should, if possible, create a one-time server action or an admin panel utility to perform this migration.
-   The goal is to ensure a "it just works" experience.
-   Use `prefetch` where applicable.
-   After each file update that requires an app restart, clear the Output terminal. Check the "Previews" server log and proceed with an Auto Repair. If there isn't enough information, add more logs (client and server).
-   Remember the application context, improvements made, and that we have multiple potential datasources (MySQL, PostgreSQL, Firestore). Changes for one should be compatible with the others.
-   **The `.env` file contains critical keys and connection strings and must never be deleted or have its existing content removed.** It can be augmented, but not overwritten.

## 2. Architectural Pattern: MVC com Camada de Serviço

**Rule:** The application's architecture is defined as **MVC (Model-View-Controller) with an intermediate Service Layer**, using Prisma ORM for data access. This structure is now the standard for all future development. **Do not alter this fundamental architecture** without explicit permission from the user. All new functionality must adhere to this pattern.

**Rationale:** Maintaining a consistent architecture is crucial for the long-term scalability, maintainability, and testability of the project. This separation of concerns (Presentation, Business Logic, Data Access) makes the codebase cleaner and easier to manage.

## 3. HTML/CSS Naming Conventions

**Rule:** All new HTML elements created must have a `data-ai-id` attribute with a unique, human-readable, and contextually relevant name. This name should reflect the element's purpose or content. For example, a button to submit a login form should be `<Button data-ai-id="login-submit-button">`, and a container for a user's profile card should be `<div data-ai-id="user-profile-card">`.

**Rationale:** This convention is essential for the AI to reliably identify and manipulate specific UI elements, ensuring that future requests to "change the color of the login button" are executed precisely and without ambiguity. It also aids in end-to-end testing and debugging.

## 4. Development Environment Information

**Rule:** During development (`NODE_ENV === 'development'`), the application footer must display key environment information. This includes the currently active database system (e.g., Firestore, MySQL), the logged-in user's email, and the active Firebase Project ID.

**Rationale:** This provides immediate, persistent context about the development environment, preventing confusion and aiding in debugging database or user-specific issues.
