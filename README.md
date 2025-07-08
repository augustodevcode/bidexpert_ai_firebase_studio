# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer powered by Prisma.

To get started, take a look at `src/app/page.tsx`.

---

## Database Setup with Prisma

This project uses **Prisma** as its Object-Relational Mapper (ORM) to manage database interactions. It's configured to work with PostgreSQL, but can be adapted for other SQL databases like MySQL.

### 1. Create a `.env.local` File

In the root of your project, create a file named `.env.local`. This file will securely store your database connection string and should not be committed to version control.

### 2. Add Your Database Connection String

Add the `DATABASE_URL` environment variable to your `.env.local` file. You can get the connection string from your database provider's dashboard (e.g., Neon, Supabase, PlanetScale, AWS RDS) or construct it if you're running the database locally.

**Format for PostgreSQL:**
`postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE_NAME]`

**Example for a local PostgreSQL database:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/bidexpert_db"
```

### 3. Initialize and Seed the Database

Once your connection string is set up, run the following commands in your terminal to prepare your database.

1.  **Apply Migrations:** This command reads your `prisma/schema.prisma` file and creates all the necessary tables in your database.
    ```bash
    npx prisma migrate dev --name init
    ```
    This will also automatically run `prisma generate` to create the Prisma Client based on your schema.

2.  **Seed the Database (Optional):** This command executes the `prisma/seed.ts` script to populate your database with essential data like default user roles, an admin account, and sample data to make development easier.
    ```bash
    npx prisma db seed
    ```

### 4. Start the Development Server

You're all set! Start the Next.js development server.
```bash
npm run dev
```

### Useful Prisma Commands

-   **`npx prisma studio`**: Opens a visual editor for your database in the browser.
-   **`npx prisma generate`**: Manually regenerates the Prisma Client after changes to `schema.prisma`.
-   **`npx prisma migrate dev --name <migration-name>`**: Creates a new migration file after you modify `schema.prisma`.
