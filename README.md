# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## Database Setup (Sample Data, Firestore, SQL)

This project is configured with a flexible data layer that can connect to multiple database systems, managed by environment variables. By default, it uses **Sample Data** for a quick start.

### Using Sample Data (Default)

No setup is required. Simply run the development server, and the application will use the mock data located in `src/lib/sample-data.ts`.

```bash
npm run dev
```

### Using a Database

To connect to a real database (Firestore, PostgreSQL, or MySQL), you need to:

1.  **Create a `.env.local` file** in the root of your project.
2.  **Add the appropriate environment variables** to this file.

#### For Firestore:

1.  Place your Firebase service account key JSON file in the root of the project (e.g., `bidexpert-service-account.json`).
2.  Add the following to `.env.local`:
    ```
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=FIRESTORE
    GOOGLE_APPLICATION_CREDENTIALS=./bidexpert-service-account.json
    ```

#### For PostgreSQL or MySQL:

1.  Add your database connection string to `.env.local`:
    ```
    # For PostgreSQL
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=POSTGRES
    POSTGRES_DATABASE_URL="postgresql://user:password@host:port/database"
    
    # For MySQL
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=MYSQL
    DATABASE_URL="mysql://user:password@host:port/database"
    ```
2.  Run the database initialization script to create tables and seed essential data (like roles and default settings):
    ```bash
    npm run db:init
    ```
    This command reads your `.env.local` file and populates the specified database. **This is a required step when setting up a new SQL database.**

### Seeding Sample Data (Firestore)

If you're using Firestore and want to populate it with more comprehensive sample data, run the seed script:
```bash
npm run seed:firestore
```
This will populate your Firestore collections with the data from `src/lib/sample-data.ts`.
