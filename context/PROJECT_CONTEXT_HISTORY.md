# Project Context History - BidExpert

This document summarizes the BidExpert project, including its purpose, core features, technological stack, style guidelines, key development milestones, decisions, and errors encountered and resolved.

## Project Overview

**App Name**: BidExpert

**Core Purpose**: To create a comprehensive online auction platform enabling users to participate in and manage auctions efficiently.

**Core Features (from PRD):**
*   Auction Catalog: Filterable, sortable catalog on the home page.
*   Lot Detail Presentation: User-friendly lot details page.
*   User Authentication: Account creation, login, profile management.
*   Auction Search: Browse and search auctions by various criteria.
*   Site Navigation: Clear menu structures and a comprehensive footer.
*   Static Content Delivery: Efficient serving of marketing/informational pages.
*   AI-Powered Auction Guidance: Recommendations for listing details, optimal opening values, and similar listing suggestions.

**Technology Stack:**
*   Frontend: NextJS, React, ShadCN UI components, Tailwind CSS
*   Backend/API: NextJS API Routes / Server Actions
*   AI: Genkit (for AI flows)
*   Database: Firestore (primary), MySQL (development alternative)

**Style Guidelines (from PRD):**
*   Icons: Clean, line-based (`lucide-react`).
*   Animations: Subtle transitions and hover effects.
*   Color Scheme (Theme in `globals.css` should reflect this):
    *   Backgrounds: White (#FFFFFF), Light Gray (#F2F2F2).
    *   Primary Interactive: Orange (hsl(25 95% 53%)).
    *   Secondary Accent: Potentially a soft green or similar, TBD by theme adjustments.
*   Font: 'Open Sans' (sans-serif) for headings and body.
*   Layout: Card-based, rounded corners (8px), subtle shadows, ample white space.

## Development Summary (Based on Interactions)

### Key Features & Functionalities Implemented/Worked On:

1.  **Database & Data Layer:**
    *   **Dual Database Strategy (Firestore/MySQL):** Implemented a flexible data layer that can switch between a primary Firestore database and a secondary MySQL database for development. This was done to overcome Firestore's free-tier write limits during heavy data seeding. The switch is controlled by the `NEXT_PUBLIC_ACTIVE_DATABASE_SYSTEM` environment variable.
    *   **Robust Firestore Adapter:** The `FirestoreAdapter` (`src/lib/database/firestore.adapter.ts`) has been fully implemented to handle all necessary CRUD operations, replacing the previous MySQL and PostgreSQL adapters.
    *   **Full MySQL Adapter:** A complete `MySqlAdapter` was implemented using the `mysql2` driver to provide a fully functional alternative for local development, mirroring the interface of the `FirestoreAdapter`.
    *   **Optimized Seeding Mechanism:** The database seeding process was split into two parts: `db:init` for essential data required for app startup (roles, settings), and `db:seed` for a full set of demonstration data. This resolves Firestore quota issues on initial startup and works with both database systems.

2.  **Admin Panel Foundation:**
    *   Full CRUD (Create, Read, Update, Delete) functionality for all major entities, now powered by the selected database adapter.
    *   Comprehensive management panels for auctions, lots, users, roles, sellers, auctioneers, categories, judicial entities, media, and more.

3.  **Auction Creation Wizard (`/admin/wizard`):**
    *   A multi-step guided flow for creating complex auctions.
    *   Features dynamic steps based on auction type (e.g., Judicial vs. Extrajudicial).
    *   Includes a real-time flowchart visualization (`ReactFlow`) of the creation process.
    *   Allows for on-the-fly creation of related entities like `JudicialProcess` and `Bem`.

4.  **Consignor Dashboard (`/consignor-dashboard`):**
    *   A dedicated dashboard for users with a "consignor" role, with all sections now functional and displaying real data.

5.  **User Authentication & Authorization:**
    *   Robust login/logout system using Next.js Server Actions and encrypted session cookies (`jose`).
    *   `AuthContext` provides user profile and permission data across the client-side, including an auto-login feature for the admin user in development environments.
    *   Permission-based access control (`hasPermission` helpers) protects admin and consignor routes.
    *   Detailed user registration form (`/auth/register`) with document upload capabilities.
    *   Support for multiple user profiles (roles) per user.

6.  **Public-Facing Pages:**
    *   Homepage with Hero Carousel and dynamic featured content.
    *   Advanced Search page with multi-tab navigation and filtering.
    *   Detail pages for Auctions, Lots, Sellers, and Auctioneers.
    *   Static pages like "About", "Contact", "FAQ", "Terms", and "Privacy".

7.  **AI & Document Generation:**
    *   Initial Genkit flows for AI-powered suggestions created (currently unused pending package resolution).
    *   Document generation structure using Puppeteer and Handlebars templates is in place for creating PDFs.

### Errors Encountered & Resolved (Summary):
*   **Firestore Quota Errors (`RESOURCE_EXHAUSTED`):** Fixed fatal startup errors caused by the database seeding script making too many individual writes. The solution was to split the seeding into an essential `init` script and a manual `seed` script, and to use batched writes.
*   **Incomplete Firestore Adapter:** Addressed multiple `Method not implemented` errors by fully implementing all required CRUD operations in the `FirestoreAdapter`, making the admin panel functional after the database migration.
*   **Data-Fetching Mismatches:** Corrected 404 errors on the homepage by updating the primary data-fetching functions (`src/lib/data-queries.ts`) to use the database adapter instead of the obsolete Prisma client.
*   **Obsolete Database File Errors:** Resolved server startup failures (`Cannot find module`) by removing obsolete adapter files (`mysql.adapter.ts`, `postgres.adapter.ts`) that were causing incorrect module resolution.
*   **Missing `mysql2` Dependency**: Fixed a `MODULE_NOT_FOUND` error by adding the `mysql2` package to `package.json` after re-introducing the MySQL adapter.

### Key Decisions & Patterns:
*   **Dual Database Strategy (Firestore/MySQL):** The primary production database is **Firestore**. However, to facilitate development and overcome free-tier quota limits during seeding, a fully functional **MySQL adapter** has been implemented. The application can switch between them using an environment variable.
*   **Single Source of Truth (Adapter):** The `getDatabaseAdapter()` function is the single point of entry for all database interactions, abstracting the specific database technology being used.
*   **Server Actions as Primary API**: All data mutations and many queries are handled through Server Actions for clear, secure server-client interaction.
*   **Context Persistence System:** This system was established to maintain project context. The `DATABASE_SCHEMA.md` file has been updated to reflect the new Firestore collection structure.

This summary will be updated as we progress.
