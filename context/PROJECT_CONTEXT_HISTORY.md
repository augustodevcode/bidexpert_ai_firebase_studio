
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
*   Database: Firestore (initial phase for some admin CRUDs), with a primary focus on SQL (MySQL/PostgreSQL) via an adapter pattern for core auction and lot data. The current `ACTIVE_DATABASE_SYSTEM` environment variable dictates which system is used.
*   Language: TypeScript

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

1.  **Admin Panel Foundation:**
    *   CRUD operations for Lot Categories, States, Cities, Auctioneers, Sellers, Auctions, Lots, Roles, Users, Media Items.
    *   These CRUDs are designed to work with an abstracted database layer, supporting Firestore, MySQL, and PostgreSQL.
    *   Server Actions are the primary mechanism for data mutations.

2.  **Database System:**
    *   Implemented a database adapter system (`getDatabaseAdapter` in `src/lib/database/index.ts`) to switch between Firestore, MySQL, and PostgreSQL based on `ACTIVE_DATABASE_SYSTEM` env variable.
    *   SQL schema initialization scripts (`initialize-db.ts`) created and refined for various tables.
    *   Admin user setup script (`setup-admin-user.ts`) to ensure an administrator role and user exist.

3.  **Header & Navigation:**
    *   Dynamic display of site title and tagline (from platform settings, `samplePlatformSettings` as fallback).
    *   Implementation of a multi-level **MegaMenu** for:
        *   **Categorias de Oportunidades:** Dynamically populated from categories data, features a two-column layout with subcategories.
        *   **Modalidades de Leilão:** Static links initially, then moved to a two-column layout.
        *   **Comitentes:** Dynamically populated from sellers data, two-column layout.
        *   **Nossos Leiloeiros:** Dynamically populated from auctioneers data, profile previews.
    *   Mobile-responsive navigation using a Sheet component.
    *   Search functionality within the header with category filtering and a dropdown for results.
    *   Recently Viewed and Favorite Lots dropdowns (using localStorage).
    *   Historical navigation icon (`History`) added.

4.  **Platform Customization (Admin Settings):**
    *   Admin page (`/admin/settings`) to manage: Site Title, Tagline, Gallery Image Base Path, Public ID Masks, Map Provider, Search Pagination, Countdown Timers, Related Lots.
    *   Settings persisted via the active database adapter.
    *   **Mental Triggers/Badges for Lots:**
        *   Implemented `BadgeVisibilitySettings` and `SectionBadgeConfig` in `PlatformSettings` (`src/types/index.ts`).
        *   `samplePlatformSettings` updated with configurations for these badges for various sections (featured, search grid, search list, lot detail).
        *   `LotCard`, `LotListItem`, and `LotDetailClientContent` updated to display: Discount percentage, Urgency timer, "MAIS VISITADO", "LANCE QUENTE", "EXCLUSIVO" badges based on these settings.

5.  **Homepage Enhancements:**
    *   Hero Carousel updated with dynamic slides and autoplay.
    *   Filter Link Cards for quick navigation to different auction types/categories.
    *   "Lotes em Destaque" section displays lots marked as featured and open for bids (status derived from auction).

6.  **Lot Detail Page Enhancements:**
    *   **Item 13 (Partial - Dates Derived from Auction):** Countdown timer (`DetailTimeRemaining`) logic significantly updated to prioritize auction stages, then auction end/start dates, before falling back to lot-specific dates. This ensures consistent timing.
    *   Responsiveness of `TabsList` for lot details (Description, Specs, etc.) corrected.
    *   **Item 15 (Conditional Legal Tab):** "Documentos e Processo" tab implemented: appears if auction is judicial AND lot has specific legal info. Otherwise, shows as "Documentos".
    *   Display of "Permite Lance Parcelado" and "Incremento Mínimo de Lance" added.

7.  **User Authentication & Authorization:**
    *   User registration form (`/auth/register`) updated to include fields for Pessoa Jurídica and Comitente Venda Direta.
    *   `AuthContext` for managing user state (Firebase Auth and SQL-based).
    *   `hasPermission` / `hasAnyPermission` helpers for role-based access control.
    *   Admin layout protected by `manage_all` permission.
    *   Consignor dashboard layout protected by consignor-specific permissions.

8.  **Subcategory Management (Item 16, 17, 18 - In Progress):**
    *   Defined `Subcategory` type in `src/types/index.ts`.
    *   Updated `LotCategory` type to include `hasSubcategories?: boolean;`.
    *   Updated `IDatabaseAdapter` with CRUD methods for subcategories.
    *   Implemented subcategory CRUD methods in `MySqlAdapter` and `PostgresAdapter`.
    *   Created Server Actions for subcategories (`src/app/admin/subcategories/actions.ts`).
    *   Developed UI (form, list, edit pages) for subcategory management under `/admin/subcategories`.
    *   Added "Subcategorias" link to admin sidebar.
    *   **Item 17 (Done):** Added examples of subcategories to `sample-data.ts` and linked to main categories.
    *   **Item 18 (DONE):** Integrated subcategory selection into the Lot CRUD form. Updated display components (`LotListItem`, `LotDetailClientContent`, `LotCard`, lot list in auction edit) to show subcategory name.

9.  **Data Display & UI Components:**
    *   `SearchResultsFrame` component created for consistent display of search results/listings with sorting, view mode, and pagination.
    *   `SearchResultsFrame` integrated into:
        *   Auction edit page (`/admin/auctions/[auctionId]/edit/page.tsx`) for displaying lots.
        *   Seller detail page (`/app/sellers/[sellerId]/page.tsx`) for displaying lots.
        *   Auctioneer detail page (`/app/auctioneers/[auctioneerSlug]/page.tsx`) for displaying auctions.
        *   Main search page (`/app/search/page.tsx`).

10. **AI Flows (Genkit):**
    *   Initial Genkit flows for `suggestListingDetails`, `predictOpeningValue`, `suggestSimilarListings` created in `src/ai/flows/`.

### Errors Encountered & Resolved (Summary):
*   **Module Not Found / Build Errors (SWC):** Frequent issues, often resolved by re-emitting full corrected files. Examples: `navigation-menu`, issues in `admin/auctions/[auctionId]/edit/page.tsx` (inline server actions, params access), `page.tsx` (syntax), `search/page.tsx` (syntax).
*   **Runtime Errors (JSX/React):** `React is not defined`, `DialogContent requires a DialogTitle`, `ShoppingCart is not defined`, `useMemo not defined`, `Tabs is not defined`.
*   **Data Fetching/Logic Errors:** `getLotCategoryByName` (sample data), "Comitente não encontrado" (sample data), `getCategoryAssets` logging.
*   **SQL Errors:** `ER_WRONG_VALUE_COUNT_ON_ROW` (MySQL inserts), syntax for `platform_settings` (JSON DEFAULT), `createLot` (undefined as null).
*   **Firebase:** Firestore permission error display.
*   **Token Limit Error (AI):** Advised on reducing input token count for Genkit flows.

### Key Decisions & Patterns:
*   **Database Abstraction:** `getDatabaseAdapter()` for Firestore, MySQL, PostgreSQL.
*   **Server Actions:** Primary for data mutations.
*   **Client vs. Server Components:** Standard Next.js patterns, explicit `'use client'` where needed.
*   **`sample-data.ts`:** Heavily used for UI development and rapid prototyping.
*   **Megamenus:** For core navigation categories, with dynamic data where feasible.
*   **Permissions System:** `hasPermission`, `hasAnyPermission` for role-based access control.
*   **Context Persistence System:** Setup in progress.

### Current Session (This interaction):
*   **Context Persistence System Setup:** Created initial versions of `PROJECT_CONTEXT_HISTORY.md`, `PROJECT_PROGRESS.MD`, `PROJECT_INSTRUCTIONS.md`, `1st.md`.
*   **Item 18 (LotCard):** Adjusted LotCard title spacing, completed subcategory display across various components.
*   **Item 13 (Lot Dates/Status):** Finalized logic in `sample-data.ts` to ensure lot dates and status are derived from the parent auction, considering auction stages. Reviewed display components.

This summary will be updated as we progress.
