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
*   Database: Firestore (previously MySQL)

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

1.  **Database & ORM Setup:**
    *   Initially a multi-adapter system (Firestore, MySQL, PostgreSQL), now centralized on **Firestore** to align with the Firebase Studio ecosystem and resolve persistent CRUD issues.
    *   Implemented a robust seeding mechanism (`db:init` for essentials, `db:seed` for demo data).

2.  **Admin Panel Foundation:**
    *   Full CRUD (Create, Read, Update, Delete) functionality for all major entities.
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
    *   Initial Genkit flows for AI-powered suggestions created.
    *   Document generation structure using Puppeteer and Handlebars templates is in place for creating PDFs.

### Errors Encountered & Resolved (Summary):
*   **MySQL Mismatch Errors:** Repeatedly encountered `Unknown column` and `TypeError: db.someFunction is not a function` errors due to inconsistencies between the application code, the `DatabaseAdapter` interface, and the actual MySQL schema. This prompted the migration to Firestore.
*   **Next.js Dynamic Route Errors:** Fixed `params should be awaited` error in Next.js 15 by updating the component signature to correctly handle async params.
*   **Prisma Schema Validation & Query Engine:** Resolved numerous schema validation errors and runtime query engine issues (during the Prisma phase).
*   **Next.js & Server Errors:**
    *   Fixed `package.json` script errors causing server startup failures.
    *   Corrected `TypeError: db.createUser is not a function` by properly defining and implementing the function across the database adapter interface.
    *   Resolved `Unknown column 'full_name' in 'group statement'` by correcting the SQL `GROUP BY` clause in the MySQL adapter.
    *   Addressed various TypeScript type mismatch errors between form data, actions, and database schemas.

### Key Decisions & Patterns:
*   **Migration to Firestore:** Made the strategic decision to migrate the entire data layer from a multi-adapter system (focused on MySQL) to **Firestore**. This resolves persistent data layer bugs, simplifies the architecture, and leverages the native Firebase ecosystem.
*   **Single Source of Truth (Adapter):** The `FirestoreAdapter` is now the single point of entry for all database interactions.
*   **Server Actions as Primary API**: All data mutations and many queries are handled through Server Actions for clear, secure server-client interaction.
*   **Context Persistence System:** This system was established to maintain project context. The `DATABASE_SCHEMA.md` file has been updated to reflect the new Firestore collection structure.

### Current Session (This interaction):
*   **Migration to Firestore:** Executed the full migration from MySQL to Firestore, including refactoring the database adapter, all data actions, and related type definitions.
*   **Context Persistence System Update:** Updated `context/DATABASE_SCHEMA.md` to reflect the new Firestore data model, replacing the previous MySQL schema.

This summary will be updated as we progress.
