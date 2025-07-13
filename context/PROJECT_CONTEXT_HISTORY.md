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
*   Database: MySQL with Prisma ORM

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
    *   Initially a multi-adapter system (Firestore, MySQL, PostgreSQL), now centralized on **MySQL** with **Prisma ORM**.
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
*   **Prisma Schema Validation & Query Engine:** Resolved numerous schema validation errors and runtime query engine issues.
*   **Next.js & Server Errors:**
    *   Fixed `package.json` script errors causing server startup failures.
    *   Corrected `TypeError: db.createUser is not a function` by properly defining and implementing the function across the database adapter interface.
    *   Resolved `Unknown column 'full_name' in 'group statement'` by correcting the SQL `GROUP BY` clause in the MySQL adapter.
    *   Addressed various TypeScript type mismatch errors between form data, actions, and database schemas.

### Key Decisions & Patterns:
*   **Single Source of Truth:** Centralized on a single database system (MySQL) managed via Prisma ORM, deprecating the multi-adapter pattern for simplicity and stability.
*   **Server Actions as Primary API**: All data mutations and many queries are handled through Server Actions for clear, secure server-client interaction.
*   **Context Persistence System:** This system was established to maintain project context across development sessions. A `DATABASE_SCHEMA.md` file was added to this system to document the definitive database structure.

### Current Session (This interaction):
*   **Context Persistence System Update:** Added the full MySQL database schema to a new file, `context/DATABASE_SCHEMA.md`, to serve as a permanent reference.

This summary will be updated as we progress.
