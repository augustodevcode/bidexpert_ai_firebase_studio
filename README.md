# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## Database Setup

This project uses **Prisma ORM** with a **PostgreSQL** database as its default configuration.

### 1. Environment Setup

- Create a `.env` file in the root of your project.
- Add your database connection string to this file:
    ```env
    # Example for PostgreSQL
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```

### 2. Database Migration

With your `.env` file configured, run the migration command to create all the necessary tables in your database based on the schema defined in `prisma/schema.prisma`.

```bash
npx prisma migrate dev
```
This command will also apply any pending migrations and ensure your database schema is up to date.

### 3. Seeding the Database (Optional but Recommended)

After migrating the database, you can populate it with essential data (like roles and settings) and comprehensive sample data (users, auctions, lots) using the seed script.

- **`npm run db:init`**: This script populates **essential data** only (Roles, Platform Settings). It's safe to run multiple times and will not duplicate data. It's recommended to run this once after the initial migration.

- **`npm run db:seed`**: This script populates the database with a **full set of sample data**. It checks if an admin user already exists to prevent duplication on subsequent runs. Use this to get a fully populated environment for development and demonstration.

```bash
# First, run the migration if you haven't already
npx prisma migrate dev

# Then, run the seed script to populate with sample data
npm run db:seed
```

Your database is now ready to use with the application.
