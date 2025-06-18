
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
*   Database: Firestore (initial phase for some admin CRUDs), with a primary focus on SQL (MySQL/PostgreSQL) via an adapter pattern for core auction and lot data.
*   Language: TypeScript

**Style Guidelines (from PRD):**
*   Icons: Clean, line-based.
*   Animations: Subtle transitions and hover effects.
*   Color Scheme:
    *   Backgrounds: White (#FFFFFF), Light Gray (#F2F2F2).
    *   Primary Interactive: Blue (#3498db).
    *   Secondary Accent: Soft Green (#2ecc71).
*   Font: 'Open Sans' (sans-serif) for headings and body.
*   Layout: Card-based, rounded corners (8px), subtle shadows, ample white space.

## Development Summary (Based on Interactions)

### Key Features & Functionalities Implemented/Worked On:

1.  **Admin Panel Foundation:**
    *   CRUD operations for Lot Categories, States, Cities, Auctioneers, Sellers, Auctions, Lots, Roles, Users, Media Items established. Initially using sample data/Firestore for scaffolding, with a strong push towards SQL adapter implementation.
    *   Server Actions are the primary mechanism for data mutations.

2.  **Database System:**
    *   Initial focus on using `sample-data.ts` for UI development and rapid prototyping.
    *   Implemented a database adapter system (`getDatabaseAdapter`) to support MySQL and PostgreSQL.
    *   SQL schema initialization scripts (`initialize-db.ts`) created and refined for various tables.
    *   Admin user setup script (`setup-admin-user.ts`) to ensure an administrator role and user exist.

3.  **Header & Navigation:**
    *   Dynamic display of site title and tagline (intended to be from platform settings).
    *   Implementation of a multi-level **MegaMenu** for:
        *   **Categorias de Lotes:** Title updated to "Categorias de Oportunidades". Dynamically populated from categories data. Features a two-column layout.
        *   **Modalidades de Leilão:** Static links (Judicial, Extrajudicial, Venda Direta).
        *   **Comitentes:** Dynamically populated from sellers data.
        *   **Nossos Leiloeiros:** Dynamically populated from auctioneers data.
    *   Mobile-responsive navigation using a Sheet component.
    *   Search functionality within the header with category filtering and a dropdown for results.
    *   Recently Viewed and Favorite Lots dropdowns (using localStorage).

4.  **Platform Customization (Admin Settings):**
    *   Admin page (`/admin/settings`) to manage: Site Title, Tagline, Gallery Image Base Path, Public ID Masks.
    *   **Mental Triggers/Badges for Lots:**
        *   Implemented `BadgeVisibilitySettings` and `SectionBadgeConfig` in `PlatformSettings` (`src/types/index.ts`).
        *   `samplePlatformSettings` updated with configurations for these badges.
        *   `LotCard` and `LotListItem` updated to display:
            *   Discount percentage badge (e.g., "% OFF").
            *   Urgency timer badge.
            *   Badges for "MAIS VISITADO", "LANCE QUENTE", "EXCLUSIVO".
        *   Visibility of the main status badge is now configurable per section (e.g., hidden for "Lotes em Destaque").

5.  **Homepage Enhancements:**
    *   Promotional text ("Até 50% de Desconto...") removed.
    *   General filter section removed from the homepage.
    *   Hero Carousel updated:
        *   Slide 1: Theme changed to "Velocidade e Estilo em Leilão" (sports car).
        *   Slide 2: New slide added with theme "Oportunidades Únicas em Leilão" (general auction items).
        *   Carousel is now dynamic, auto-plays, and has functional navigation.
    *   "Lotes em Destaque" section now only shows lots with status `ABERTO_PARA_LANCES`.

6.  **Data Seeding & Management:**
    *   Scripts for copying sample images to the `public` directory (`copy-sample-images-to-public.ts`).
    *   Scripts for seeding Firestore with basic lot data and then updating with image URLs (`seed-lotes-data.ts`, `seed-lotes-with-images.ts`).

7.  **User Authentication & Authorization:**
    *   User registration form (`/auth/register`) updated to include fields for Pessoa Jurídica and Comitente Venda Direta.
    *   Basic Admin/Consignor dashboard layouts.
    *   `AuthContext` for managing user state (Firebase Auth and SQL-based).
    *   `hasPermission` / `hasAnyPermission` helpers for role-based access.

8.  **Public Facing Pages:**
    *   Initial setup and some content for: About, Contact, FAQ, Terms, Privacy, Seller Detail, Auctioneer Detail, Auction Detail, Lot Detail, Search, Direct Sales.
    *   **Key Decision:** Public auction/lot detail pages are (still, as of last confirmation) using `sample-data.ts` for data display to facilitate rapid UI development.

### Errors Encountered & Resolved (Recent Summary):

*   **Module Not Found Errors:**
    *   `navigation-menu` and `@radix-ui/react-navigation-menu`: Resolved by adding file/package.
*   **Runtime Errors (JSX/React):**
    *   `React is not defined`: Added import.
    *   `DialogContent requires a DialogTitle`: Added `SheetHeader`/`SheetTitle`.
    *   `ShoppingCart is not defined`: Added import.
    *   `useMemo is not defined` in `lot-card.tsx`: Added `import { useMemo } from 'react';`.
    *   `Tabs is not defined` in `search/page.tsx`: Added imports for `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
*   **Data Fetching/Logic Errors:**
    *   `getLotCategoryByName` for sample data: Corrected usage.
    *   "Comitente não encontrado": Updated sample data.
    *   `getCategoryAssets` logging "Nenhum nome de categoria encontrado": Modified `getCategoryAssets` to be more tolerant and return generic placeholders for descriptive titles used in `FilterLinkCard`s on the homepage, thus suppressing these specific error logs.
*   **Build/Syntax Errors:**
    *   "Unexpected eof" in `header.tsx`, `lot-list-item.tsx`, and `sample-data.tsx`: Resolved by re-emitting full, corrected file content, removing extraneous characters or malformed XML from previous AI responses.
    *   "Unexpected token div" in `page.tsx`: Resolved by correcting syntax before the `return` statement.
    *   "Expected ']', got 'Mode'" in `search/page.tsx`: Resolved by removing a duplicated/erroneous `getAuctionData` function from this file.
*   **Server Errors:**
    *   "An unexpected response was received from the server." (Generic client-side): Diagnosed by adding `try...catch` to `src/app/page.tsx` server-side rendering. The root cause was often a downstream compilation error (like the `search/page.tsx` syntax error).
*   **Token Limit Error (AI):**
    *   Advised on reducing input token count for Genkit flows (e.g., `recentAuctionData`, `pastAuctionData`) when "input token count exceeds the maximum" error occurs. This is not a code fix for the app itself but a usage guideline for the AI.

### Key Decisions & Patterns:

*   **Database Abstraction:** `getDatabaseAdapter()` for Firestore, MySQL, PostgreSQL.
*   **Server Actions:** Primary for data mutations.
*   **Client vs. Server Components:** Standard Next.js patterns.
*   **`sample-data.ts`:** Heavily used for UI, with a plan to switch to DB for public pages.
*   **Megamenus:** For core navigation categories, with dynamic data for some.
*   **Permissions System:** `hasPermission`, `hasAnyPermission` for access control.
*   **Context Persistence System:** This current task of creating context files.

This summary will be updated as we progress.

  