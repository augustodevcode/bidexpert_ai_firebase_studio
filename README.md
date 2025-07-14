# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## Database Setup

This project uses a flexible data layer that can work with **Firestore** or **MySQL**.

### 1. Environment Setup

- For **Firestore**: Ensure your Firebase project credentials are set up correctly in `bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json`. Set the following in your `.env` file:
  ```
  NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=FIRESTORE
  ```

- For **MySQL**: Set up your database and provide the connection string in your `.env` file:
  ```
  NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=MYSQL
  DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
  ```

### 2. Database Initialization & Seeding

When using a fresh database, you need to create the necessary collections/tables and populate essential data.

- **`npm run dev`**: The first time you run the development server, it will automatically execute an initialization script (`init-db.ts`). This script populates **essential data only** (like Roles, Categories, States, etc.). This step is required for the application to start correctly.

- **`npm run db:seed`**: After the server has started at least once, you can run this script manually in your terminal to populate the database with a **full set of sample data** (auctions, lots, users, etc.). Use this to get a fully populated environment for development and demonstration. The script checks for existing data to prevent duplication.

```bash
# First, run the development server. This will initialize the database with essential data.
npm run dev

# (In a new terminal, while the server is running)
# Then, populate with the full sample data set.
npm run db:seed
```

Your selected database is now ready to use with the application.

