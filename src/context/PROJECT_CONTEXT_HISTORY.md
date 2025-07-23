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

**Technology Stack & Architecture:**
*   **Architecture**: MVC (Model-View-Controller) with a Service Layer and Repository Layer.
    *   **Model**: Prisma ORM (`prisma/schema.prisma`).
    *   **View**: Next.js, React, ShadCN UI components, Tailwind CSS.
    *   **Controller**: Next.js Server Actions.
    *   **Service Layer**: Contains business logic (`src/services/*.ts`).
    *   **Repository Layer**: Handles data access via Prisma Client (`src/repositories/*.ts`).
*   **AI**: Genkit (for AI flows).
*   **Database**: Designed for PostgreSQL and MySQL via Prisma.

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

1.  **Architectural Refactoring (MVC + Service + Repository):** The entire application was refactored to a layered architecture. This major undertaking replaced direct-to-database calls with a more robust pattern: `Controller (Action) -> Service -> Repository -> Prisma ORM`. This enhances scalability, maintainability, and testability.

2.  **Prisma ORM Integration:** The project was migrated to use Prisma as the primary ORM for data access, replacing the previous multi-adapter system. A comprehensive `schema.prisma` was created to support PostgreSQL and MySQL.

3.  **Full Admin Panel:** Comprehensive CRUD (Create, Read, Update, Delete) functionality for all major entities, including auctions, lots, users, roles, sellers, auctioneers, categories, judicial entities, media, and more.

4.  **Auction Creation Wizard (`/admin/wizard`):** A multi-step guided flow for creating complex auctions, featuring a real-time flowchart visualization (`ReactFlow`) and on-the-fly entity creation.

5.  **Consignor Dashboard (`/consignor-dashboard`):** A dedicated, fully functional dashboard for "consignor" users to manage their auctions, lots, and view financial data.

6.  **User Authentication & Authorization:** Robust login/logout system using Next.js Server Actions and encrypted session cookies (`jose`), with permission-based access control (`hasPermission` helpers).

7.  **Public-Facing Pages:** Dynamic pages for the Homepage, Advanced Search, and detailed views for Auctions, Lots, Sellers, and Auctioneers, along with standard static pages.

8.  **Advanced Features:**
    *   **Consulta CEP:** Implemented automatic address lookup from CEP in seller and auctioneer forms.
    *   **Document Data Extraction:** Added functionality for users to upload documents and use Genkit AI to extract and pre-fill judicial process information.

### Errors Encountered & Resolved (Summary):
*   **Prisma Initialization Errors:** Resolved `P1012` schema validation errors by correcting the `dev` script in `package.json` to not require a `DATABASE_URL` when a Firestore environment is intended, and by removing the incorrect `prisma db push` command from the startup sequence.
*   **Obsolete Adapter Errors:** Fixed multiple `Method not implemented` and `MODULE_NOT_FOUND` errors by completing the full migration to Prisma and removing all legacy database adapter files and references.
*   **Module Not Found (`@prisma/client`):** Resolved by ensuring the `postinstall` script correctly runs `prisma generate` with access to environment variables.
*   **Data Loss Warning on `db push`:** Resolved by adding the `--accept-data-loss` flag to the `db:push` script, appropriate for a development environment where data can be re-seeded.
*   **Invalid Directory Structure:** Corrected a critical structural issue where `app` directories were nested or outside the `src` folder, preventing Next.js from building correctly.

### Key Decisions & Patterns:
*   **MVC + Service + Repository Architecture:** The entire application now adheres to a strict separation of concerns. This is the mandated architecture for all new development.
*   **Prisma as Single Source of Truth for Data Access:** All database interactions are now funneled through the Prisma Client, providing type safety and simplifying queries across different SQL databases.
*   **Server Actions as Primary API**: All data mutations and queries are handled through Server Actions for clear, secure server-client interaction.

This summary will be updated as we progress.
