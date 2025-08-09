# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## Architectural Overview

This application follows a robust **MVC (Model-View-Controller) with a Service Layer** architecture to ensure scalability and maintainability. This layered approach ensures a clear separation of concerns, making the codebase easier to understand, test, and extend.

-   **Model:** Managed by **Prisma ORM**, with the schema defined in `prisma/schema.prisma`. This defines the shape of our data.
-   **Views:** Implemented using **Next.js with React Server Components** (`.tsx` files). This is the UI the user interacts with.
-   **Controllers:** Handled by **Next.js Server Actions** (`/actions.ts` files). These orchestrate calls to the service layer in response to user interactions.
-   **Services:** Contain the core business logic (`/services/*.ts` files), decoupled from both the database and the controllers.
-   **Repositories:** Encapsulate all database queries using the Prisma Client, providing a clean data access layer.

---

## Database Setup

This project uses **Prisma ORM** as its data access layer, allowing for flexible interaction with **PostgreSQL**, **MySQL**, or **Firestore**. The active database is determined by the `DATABASE_URL` and `NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM` environment variables.

### 1. Environment Setup

-   For **MySQL (Default for this project)**: Ensure your MySQL server is running. Set the following in your `.env` file with your database credentials.
    ```
    # Example for MySQL
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=MYSQL
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
-   For **PostgreSQL**: Set up your database and provide the connection string in your `.env` file. Change the `provider` in `prisma/schema.prisma` to `postgresql`.
    ```
    # Example for PostgreSQL
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=POSTGRES
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```

### 2. Database Initialization & Seeding

When using a fresh database, you need to create the necessary tables/collections and populate essential data.

-   **`npx prisma db push` (For SQL Databases):** If using MySQL or PostgreSQL, run this command **once** to sync your Prisma schema with the database. This command is included in the `npm run dev` script, so it will run automatically on startup.
    ```bash
    npx prisma db push
    ```
-   **`npm run dev`**: The first time you run the development server, it will automatically execute an initialization script (`init-db.ts`). This script populates **essential data only** (like Roles, Categories, States, etc.). This step is required for the application to start correctly.

-   **`npm run db:seed`**: After the server has started at least once, you can run this script manually in your terminal to populate the database with a **full set of sample data** (auctions, lots, users, etc.). Use this to get a fully populated environment for development and demonstration. The script checks for existing data to prevent duplication.

```bash
# First, run the development server. This will initialize the database with essential data.
npm run dev

# (In a new terminal, while the server is running)
# Then, populate with the full sample data set.
npm run db:seed
```

Your selected database is now ready to use with the application.
