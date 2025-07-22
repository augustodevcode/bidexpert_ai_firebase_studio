# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## Architectural Overview

This application follows a robust **MVC (Model-View-Controller) with a Service Layer** architecture to ensure scalability and maintainability.

-   **Model:** Managed by **Prisma ORM**, with the schema defined in `prisma/schema.prisma`.
-   **Views:** Implemented using **Next.js with React Server Components**.
-   **Controllers:** Handled by **Next.js Server Actions** (`/actions.ts` files), which orchestrate calls to the service layer.
-   **Services:** Contain the core business logic, decoupled from both the database and the controllers.
-   **Repositories:** Encapsulate all database queries using the Prisma Client, providing a clean data access layer.

This layered approach ensures a clear separation of concerns, making the codebase easier to understand, test, and extend.

---

## Database Setup

This project uses **Prisma ORM** as its data access layer, allowing for flexible interaction with **PostgreSQL**, **MySQL**, or **Firestore**. The active database is determined by the `DATABASE_URL` and `NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM` environment variables.

### 1. Environment Setup

-   For **Firestore (Default for this project)**: Ensure your Firebase project credentials are set up correctly. No `DATABASE_URL` is needed. Set the following in your `.env` file:
    ```
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=FIRESTORE
    ```
-   For **PostgreSQL or MySQL**: Set up your database and provide the connection string in your `.env` file. Change the `provider` in `prisma/schema.prisma` accordingly.
    ```
    # Example for PostgreSQL
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=POSTGRES
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```

### 2. Database Initialization & Seeding

When using a fresh database, you need to create the necessary tables/collections and populate essential data.

-   **`npm run db:push` (For SQL Databases):** If using PostgreSQL or MySQL, run this command **once** to sync your Prisma schema with the database.
    ```bash
    npm run db:push
    ```
-   **`npm run dev`**: The first time you run the development server, it will automatically execute an initialization script (`init-db.ts`). This script populates **essential data only** (like Roles, Categories, States, etc.). This step is required for the application to start correctly.

-   **`npm run db:seed`**: After the server has started at least uma vez, you can run this script manually in your terminal to populate the database with a **full set of sample data** (auctions, lots, users, etc.). Use this to get a fully populated environment for development and demonstration. The script checks for existing data to prevent duplication.

```bash
# First, run the development server. This will initialize the database with essential data.
npm run dev

# (In a new terminal, while the server is running)
# Then, populate with the full sample data set.
npm run db:seed
```

Your selected database is now ready to use with the application.
