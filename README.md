# BidExpert - Powered by Firebase Studio

This is a Next.js starter application built with Firebase Studio. It's designed to provide a robust foundation for an online auction platform, complete with an admin panel, user authentication, and a flexible data layer.

To get started, take a look at `src/app/page.tsx`.

---

## Database Setup

This project uses a database adapter system and is configured to use **Firestore** by default.

### 1. Environment Setup

- Create a `.env` file in the root of your project.
- Ensure your Firebase project credentials are set up correctly in `bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json`.

### 2. Database Initialization & Seeding

When using a fresh Firestore database, you need to create the necessary collections and populate essential data.

- **`npm run dev`**: The first time you run the development server, it will automatically execute `db:init`, which populates **essential data only** (Roles, Platform Settings). This is required for the application to start correctly.

- **`npm run db:seed`**: After the server has started once, run this script manually in your terminal to populate the database with a **full set of sample data** (auctions, lots, users, etc.). Use this to get a fully populated environment for development and demonstration. It will check if data already exists to prevent duplication.

```bash
# First, run the development server. This will initialize the database.
npm run dev

# (In a new terminal, while the server is running)
# Then, populate with sample data.
npm run db:seed
```

Your database is now ready to use with the application.
