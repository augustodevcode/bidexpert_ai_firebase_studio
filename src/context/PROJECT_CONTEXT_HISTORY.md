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
*   Color Scheme:
    *   **Primary Action**: A vibrant blue (`#3b82f6` / `hsl(217 91% 60%)`).
    *   **Sidebar**: A very dark, near-black background (`#09090b` / `hsl(222.2 84% 4.9%)`) with white text and blue accents for active items.
    *   **Main Background**: A light gray (`#f1f5f9` / `hsl(210 40% 96.1%)`).
*   Font: 'Open Sans' (sans-serif) for headings and body.
*   Layout: Card-based, rounded corners (8px), subtle shadows, ample white space.

## Development Summary (Based on Interactions)

### Key Features & Functionalities Implemented/Worked On:

1.  **Dashboard Redesign:** Initiated a major redesign of the admin panel, starting with the main dashboard.
    *   Updated the global color palette (`globals.css`) to a new theme featuring a dark sidebar and a blue primary color.
    *   Refactored the Admin Sidebar (`admin-sidebar.tsx`) to use the new dark theme.
    *   Redesigned the main dashboard page (`/admin/dashboard/page.tsx`) to include new KPI stat cards, matching the new design aesthetic.
2.  **Multi-Tenant Architecture:** This was a major refactoring effort.
    *   Added a `Tenant` model to the Prisma schema, with fields for `subdomain` and `domain`.
    *   Linked all tenant-specific models (auctions, lots, etc.) to the `Tenant` model via a mandatory `tenantId`.
    *   Implemented a Prisma middleware to automatically filter database queries based on the `tenantId` from the request context, ensuring data isolation.
    *   Created a Next.js middleware (`src/middleware.ts`) to rewrite URLs based on subdomains (e.g., `leiloeiro-x.domain.com` maps to `/_tenants/leiloeiro-x`).
    *   Established the concept of a "Landlord" tenant (ID '1') for the main domain (`www.domain.com` or `domain.com`).
    *   Refactored the authentication flow (`AuthContext`, login page, session logic) to be tenant-aware.
3.  **Architectural Refactoring (MVC + Service + Repository):** The entire application was refactored to a layered architecture: `Controller (Action) -> Service -> Repository -> Prisma ORM`.
4.  **Prisma ORM Integration:** Migrated the project fully to Prisma for all data access, including a modular schema structure.

### Errors Encountered & Resolved (Summary):
*   **Prisma Schema Validation Errors:** Encountered and resolved numerous `P1012` schema validation errors due to duplicate model/enum definitions and missing back-relations after a large-scale refactoring of the `schema.prisma` file. This was fixed by consolidating enums, deleting duplicate files with incorrect casing, and adding the missing relation fields.
*   **Unsupported Prisma Types on MySQL:** Fixed errors related to using `type` (composite types) and lists of primitive types, which are not supported by the MySQL provider. This was resolved by converting the composite type into a proper relational model (`LotStagePrice`).
*   **CSS Syntax Error:** Corrected a `Syntax error: @apply should not be used with the 'group' utility` in `globals.css` by moving the `group` class directly to the JSX components, which is the correct usage pattern.
*   **Layout Breakage**: Fixed a completely broken home page layout caused by incorrect CSS `@apply` directives. The solution involved removing the faulty custom classes and applying standard Tailwind utility classes directly to the components.

### Key Decisions & Patterns:
*   **Standardized Admin Panel Design**: A new, modern design inspired by the MartFury dashboard was adopted as the standard for all administrative and analytical pages.
*   **Prisma as Single Source of Truth:** All data access is funneled through the Prisma Client.
*   **Server Actions as Primary API**: All data mutations and queries are handled through Server Actions.
*   **Centralized Tenant Logic:** The combination of a Next.js middleware for routing and a Prisma middleware for data access provides a robust and centralized enforcement of the multi-tenant architecture.

This summary will be updated as we progress.
