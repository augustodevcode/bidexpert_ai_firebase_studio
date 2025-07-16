# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## 🚀 Quick Start: Database Setup

This project uses a flexible data layer that can work with **Firestore** or **MySQL**. Follow these steps to get your database ready.

### 1. Configure your Environment

First, create a `.env` file in the root of your project by copying the example:
```bash
cp .env.example .env
```

Now, edit the `.env` file to select your database system.

-   **For Firestore (Recommended):**
    ```
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=FIRESTORE
    ```
    Ensure your Firebase project credentials are set up correctly. This is typically handled automatically in the Firebase Studio environment.

-   **For MySQL (Local Development):**
    ```
    NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM=MYSQL
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```
    Replace the placeholder values with your actual MySQL connection string.

### 2. Run the Development Server

The first time you start the server, it will automatically initialize the database with **essential data only** (like user roles, settings, and categories). This is required for the app to start correctly.

```bash
npm run dev
```

### 3. Seed Full Demo Data (Important!)

After the server has started successfully, you must run the seeding script in a **new, separate terminal** to populate the database with a full set of sample data (auctions, lots, users, etc.).

```bash
# (In a new terminal, while the server is running)
npm run db:seed
```

This two-step process is designed to prevent hitting Firestore's free-tier limits on initial setup. Your selected database is now fully populated and ready to use with the application.
