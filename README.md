# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## Database Setup

This project uses **Firestore** as its database.

### 1. Environment Setup

- Ensure your Firebase project credentials are set up correctly in `bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json`. No further `.env` configuration is required for the database connection.

### 2. Database Initialization & Seeding

When using a fresh Firestore database, you need to create the necessary collections and populate essential data.

- **`npm run dev`**: The first time you run the development server, it will automatically execute an initialization script (`init-db.ts`). This script populates **essential data only** (like Roles and default Platform Settings). This step is required for the application to start correctly.

- **`npm run db:seed`**: After the server has started at least once, you can run this script manually in your terminal to populate the database with a **full set of sample data** (auctions, lots, users, etc.). Use this to get a fully populated environment for development and demonstration. The script checks for existing data to prevent duplication.

```bash
# First, run the development server. This will initialize the database with essential data.
npm run dev

# (In a new terminal, while the server is running)
# Then, populate with the full sample data set.
npm run db:seed
```

Your Firestore database is now ready to use with the application.
