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
*   AI-Powered Auction Guidance: Recommendations for listing details, optimal opening values, and similar listing suggestions.
*   Multi-Tenant Architecture: Support for isolated auctioneer environments with subdomain routing.

**Technology Stack & Architecture:**
*   **Architecture**: MVC (Model-View-Controller) with a Service Layer and Repository Layer.
    *   **Model**: Prisma ORM (`prisma/schema.prisma`).
    *   **View**: Next.js, React, ShadCN UI components, Tailwind CSS.
    *   **Controller**: Next.js Server Actions.
    *   **Service Layer**: Contains business logic (`src/services/*.ts`).
    *   **Repository Layer**: Handles data access via Prisma Client (`src/repositories/*.ts`).
*   **AI**: Genkit (for AI flows).
*   **Database**: Designed for MySQL via Prisma.

**Style Guidelines (from PRD):**
*   Icons: Clean, line-based (`lucide-react`).
*   Animations: Subtle transitions and hover effects.
*   Color Scheme (Theme in `globals.css` should reflect this):
    *   Backgrounds: White (#FFFFFF), Light Gray (#F2F2F2).
    *   Primary Interactive: Orange (hsl(25 95% 53%)).
*   Font: 'Open Sans' (sans-serif) for headings and body.
*   Layout: Card-based, rounded corners (8px), subtle shadows, ample white space.

## Development Summary (Based on Interactions)

### Key Features & Functionalities Implemented/Worked On:

1.  **Multi-Tenant Architecture:** This was a major refactoring effort.
    *   Added a `Tenant` model to the Prisma schema, with fields for `subdomain` and `domain`.
    *   Linked all tenant-specific models (auctions, lots, etc.) to the `Tenant` model via a mandatory `tenantId`.
    *   Implemented a Prisma middleware to automatically filter database queries based on the `tenantId` from the request context, ensuring data isolation.
    *   Created a Next.js middleware (`src/middleware.ts`) to rewrite URLs based on subdomains (e.g., `leiloeiro-x.domain.com` maps to `/_tenants/leiloeiro-x`).
    *   Established the concept of a "Landlord" tenant (ID '1') for the main domain (`www.domain.com` or `domain.com`).
    *   Refactored the authentication flow (`AuthContext`, login page, session logic) to be tenant-aware.

2.  **Architectural Refactoring (MVC + Service + Repository):** The entire application was refactored to a layered architecture. This major undertaking replaced direct-to-database calls with a more robust pattern: `Controller (Action) -> Service -> Repository -> Prisma ORM`.

3.  **Prisma ORM Integration:** Migrated the project fully to Prisma for all data access.

4.  **Full Admin Panel & Dashboards:** Implemented comprehensive CRUD functionality for all major entities and built functional dashboards for Admins, Users, and Consignors.

5.  **Advanced Features:**
    *   **Auction Creation Wizard (`/admin/wizard`):** A multi-step guided flow for creating complex auctions.
    *   **Document Data Extraction:** Added functionality for users to upload documents and use Genkit AI to extract judicial process information.
    *   **PDF Generation:** Implemented server-side logic using Puppeteer for generating documents.

### Errors Encountered & Resolved (Summary):
*   **Multi-Tenant Implementation Errors:**
    *   **`Unknown argument 'tenantId'`:** This recurring error was the primary challenge. It was caused by the Prisma middleware incorrectly attempting to apply the `tenantId` filter to global models (like `User`, `Role`, `LotCategory`).
    *   **Resolution:**
        1.  Created a definitive list of `tenantAgnosticModels` in `src/lib/prisma.ts` to exclude them from the middleware's filtering logic.
        2.  Refactored all server actions to use a centralized, reliable method for retrieving the `tenantId` from the session via `AsyncLocalStorage`, rather than ad-hoc implementations.
        3.  Corrected queries in repositories (like `UserRepository`) that had erroneously included manual `tenantId` filters.
*   **Prisma Initialization Errors:** Resolved `P1012` schema validation errors by correcting scripts and removing incorrect `prisma db push` commands from startup.
*   **Obsolete Adapter Errors:** Fixed multiple `Method not implemented` and `MODULE_NOT_FOUND` errors by completing the migration to Prisma and removing all legacy database adapter files.

### Key Decisions & Patterns:
*   **Prisma as Single Source of Truth:** All data access is funneled through the Prisma Client, providing type safety and a consistent query interface.
*   **Server Actions as Primary API**: All data mutations and queries are handled through Server Actions.
*   **Centralized Tenant Logic:** The combination of a Next.js middleware for routing and a Prisma middleware for data access provides a robust and centralized enforcement of the multi-tenant architecture.

This summary will be updated as we progress.
