# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## Database Setup

This project uses a database adapter system and is configured to use **MySQL** by default.

### 1. Environment Setup

- Create a `.env` file in the root of your project.
- Add your database connection string to this file:
    ```env
    # Example for MySQL
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
- Ensure the `NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM` is set to `MYSQL` in your `.env` file if you are not using the default.

### 2. Database Initialization (For SQL Databases)

When using a fresh SQL database (MySQL or PostgreSQL), you need to create the necessary tables and populate essential data.

- **`npm run db:init`**: This script populates **essential data** only (Roles, Platform Settings). It should be run once after setting up a new database schema. It's safe to run multiple times.

- **`npm run db:seed`**: This script populates the database with a **full set of sample data**. Use this to get a fully populated environment for development and demonstration. It will check if data already exists to prevent duplication.

```bash
# First, ensure your database schema is created (e.g., using a SQL script or a tool like DBeaver).
# Then, run the initialization script for essential data.
npm run db:init

# After initialization, populate with sample data.
npm run db:seed
```

Your database is now ready to use with the application.
