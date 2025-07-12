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
*   Database: PostgreSQL, Mysql via adapters.

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
    *   The project is  multi-adapter system (Firestore, MySQL, PostgreSQL).
    *   Implemented a seeding mechanism (`prisma/seed.ts`) to populate the database with initial data, including users, roles, categories, and sample auctions/lots.

2.  **Admin Panel Foundation:**
    *   Full CRUD (Create, Read, Update, Delete) functionality for all major entities:
        *   `Auctions` (/admin/auctions)
        *   `Lots` (/admin/lots)
        *   `Users` (/admin/users)
        *   `Roles` (/admin/roles) with permission management
        *   `Sellers` (/admin/sellers)
        *   `Auctioneers` (/admin/auctioneers)
        *   `Lot Categories` & `Subcategories`
        *   Judicial entities: `Courts`, `Districts`, `Branches`, `Processes`
        *   `Bens` (Assets)
        *   `Media Items` (/admin/media)
        *   `Direct Sale Offers`
        *   `Document Templates`

3.  **Auction Creation Wizard (`/admin/wizard`):**
    *   A multi-step guided flow for creating complex auctions.
    *   Features dynamic steps based on auction type (e.g., Judicial vs. Extrajudicial).
    *   Includes a real-time flowchart visualization (`ReactFlow`) of the creation process.
    *   Allows for on-the-fly creation of related entities like `JudicialProcess` and `Bem`.

4.  **Consignor Dashboard (`/consignor-dashboard`):**
    *   A dedicated dashboard for users with a "consignor" role.
    *   **Functional Sections:** Overview, My Auctions, My Lots, Direct Sales, Financial Reports, and Settings.
    *   All sections now fetch and display real data relevant to the logged-in consignor.

5.  **User Authentication & Authorization:**
    *   Robust login/logout system using Next.js Server Actions and encrypted session cookies (`jose`).
    *   `AuthContext` provides user profile and permission data across the client-side of the application.
    *   Permission-based access control (`hasPermission`, `hasAnyPermission` helpers) protects admin and consignor routes.
    *   User registration form (`/auth/register`) captures detailed information for different account types.

6.  **Public-Facing Pages:**
    *   Homepage with Hero Carousel and dynamic featured content.
    *   Search page with multi-tab navigation (Auctions, Lots, Venda Direta) and advanced filtering.
    *   Detail pages for Auctions, Lots, Sellers, and Auctioneers, fetching data from the database.
    *   Static pages like "About", "Contact", "FAQ", "Terms", and "Privacy".

7.  **AI Flows (Genkit):**
    *   Initial Genkit flows for `suggestListingDetails`, `predictOpeningValue`, `suggestSimilarListings` created in `src/ai/flows/`.

### Errors Encountered & Resolved (Summary):
*   **Prisma Schema Validation:** Numerous `P1012` errors were encountered and resolved. These were primarily due to:
    *   File corruption where code from other files was accidentally inserted into `schema.prisma`.
    *   Missing bi-directional relations between models.
    *   Invalid enum values (e.g., using "Fêmea" instead of "FEMEA").
    *   Invalid referential actions (`NoAction`).
*   **Prisma Query Engine:** Resolved a runtime error where the client was generated for a different OpenSSL version than the execution environment by adding the correct `binaryTargets` to the schema.
*   **NPM "Missing script: dev":** Corrected a corrupted `package.json` to restore the standard Next.js scripts.
*   **Next.js Deprecations:** Fixed the use of `legacyBehavior` in `<Link>` components to align with modern Next.js practices.

### Key Decisions & Patterns:
*   **Single Source of Truth:** Centralized on PostgreSQL with Prisma as the ORM, eliminating the complexity of the previous database adapter system.
*   **Server Actions:** Primary method for all data mutations, providing a clear and secure way to interact with the database from the client.
*   **Context Persistence System:** This system was established to maintain project context across development sessions.

### Current Session (This interaction):
*   **Context Persistence System Setup:** Created initial versions of `PROJECT_CONTEXT_HISTORY.md`, `PROJECT_PROGRESS.md`, `PROJECT_INSTRUCTIONS.md`, `1st.md`.

This summary will be updated as we progress.
