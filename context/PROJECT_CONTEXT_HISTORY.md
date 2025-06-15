
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
*   Database: Firestore (initial), with ongoing work to support SQL (MySQL, PostgreSQL) via an adapter pattern.
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

## Development Summary (Current & Recent Interactions)

### Key Features & Functionalities Implemented/Worked On:

1.  **Admin Panel Foundation:**
    *   CRUD operations for core entities (Lot Categories, States, Cities, Auctioneers, Sellers, Auctions, Lots, Roles, Users, Media Items) were established, initially with Firestore and then with ongoing SQL adapter implementation.
    *   Server Actions are used for data mutations.

2.  **Database System:**
    *   The project started with Firestore.
    *   Work has been done to implement a database adapter system to support MySQL and PostgreSQL.
    *   Scripts for SQL schema initialization (`initialize-db.ts`) and admin user setup (`setup-admin-user.ts`) have been created and refined.
    *   Focus on ensuring `getDatabaseAdapter` correctly returns instances for MySQL and PostgreSQL.

3.  **Header & Navigation:**
    *   Dynamic display of site title and tagline from platform settings.
    *   Implementation of a multi-level **MegaMenu** for:
        *   **Categorias de Lotes:** Dynamically populated from the database. Features a two-column layout (categories list on left, selected category details/sub-items on right).
        *   **Modalidades de Leilão:** Static links (Judicial, Extrajudicial, Venda Direta).
        *   **Comitentes:** Dynamically populated, categorized (Financeiras, Seguradoras, etc. - *initial structure was static, now dynamic*), with a "Ver Todos" link.
        *   **Nossos Leiloeiros:** Dynamically populated, showing leiloeiro name, photo (placeholder), and basic info.
    *   Mobile-responsive navigation using a Sheet component.
    *   Search functionality within the header with category filtering and a dropdown for results.
    *   Recently Viewed and Favorite Lots dropdowns (using localStorage).

4.  **Platform Customization (Admin Settings):**
    *   Admin page (`/admin/settings`) to manage:
        *   Site Title and Tagline.
        *   Gallery Image Base Path.
        *   (Placeholders for Logo, Favicon, Theme Management).
        *   Platform Public ID Masks.
    *   Settings are persisted in the `platform_settings` table (SQL) or a 'global' document (Firestore).

5.  **Data Seeding & Management:**
    *   Scripts for seeding sample data (`seed-firestore.ts`, `seed-lotes-data.ts`, `seed-lotes-with-images.ts`).
    *   Script for copying sample images to the `public` directory.

6.  **User Authentication & Authorization:**
    *   User registration form updated to include fields for Pessoa Jurídica and Comitente Venda Direta.
    *   Basic Admin/Consignor dashboard layouts and access control using `hasPermission` / `hasAnyPermission`.
    *   SQL authentication flow implemented for non-Firestore setups.
    *   `AuthContext` manages user state for both Firebase Auth and SQL-based auth.

7.  **Public Facing Pages:**
    *   Initial setup for various public pages (Home, About, Contact, FAQ, Terms, Privacy, Auction/Lot details, Seller/Auctioneer profiles, Search, Direct Sales).
    *   **Crucial Decision:** For testing purposes, auction detail and lot detail pages were recently switched back to using `sample-data.ts` instead of fetching live from the database. This is temporary.

### Errors Encountered & Resolved (Recent):

*   **Module Not Found Errors (Megamenu):**
    *   `Can't resolve '@/components/ui/navigation-menu'`: Resolved by creating/adding the `navigation-menu.tsx` file.
    *   `Can't resolve '@radix-ui/react-navigation-menu'`: Resolved by adding the package to `package.json`.
*   **Runtime Errors (Megamenu & Header):**
    *   `React is not defined` in `main-nav.tsx`: Resolved by adding `import * as React from 'react';`.
    *   `DialogContent requires a DialogTitle` (accessibility error from Radix/ShadCN `Sheet`): Resolved by adding `SheetHeader` and `SheetTitle` to the mobile menu sheet in `Header.tsx`.
    *   `ShoppingCart is not defined` in `main-nav.tsx`: Resolved by importing the `ShoppingCart` icon.
*   **Data Fetching/Display Errors:**
    *   `getLotCategoryByName is not a function` on lot detail page: Corrected to use `getCategoryNameFromSlug` from `sample-data.ts` as intended when using sample data.
    *   "Comitente com slug 'banco-xyz' não encontrado": Addressed by ensuring 'Banco XYZ' was present in `sampleAuctions` to generate the correct slug for `sample-data` fetching.
    *   "Leilão Não Encontrado" on `/auctions/[auctionId]`: Clarified that this page was (temporarily) reverted to use `sample-data.ts`, and adjusted param access.

### Key Decisions & Patterns:

*   **Database Abstraction:** Use of `getDatabaseAdapter()` to switch between Firestore, MySQL, and PostgreSQL. Adapters implement `IDatabaseAdapter`.
*   **Server Actions:** Primary mechanism for data mutations.
*   **Client vs. Server Components:** Strategic use based on interactivity and data fetching needs.
*   **Context API (`AuthContext`):** For managing global authentication state.
*   **Sample Data:** `sample-data.ts` used extensively for UI development and testing, especially for public-facing pages during initial phases.
*   **Slugification:** Using `slugify` function for creating user-friendly URLs.
*   **Public IDs:** Generation of `publicId` for entities to allow for more stable and potentially SEO-friendly URLs than numeric IDs.
*   **Megamenus:** Implemented for "Categorias", "Modalidades", "Comitentes", "Leiloeiros" in the main navigation, with dynamic data fetching for categories, comitentes, and leiloeiros.
*   **Permissions System:** `hasPermission` and `hasAnyPermission` helpers for role-based access control.

## Future Work & Next Steps (Consolidated):

*   **Revert to Database Data:** Switch auction and lot detail pages back to fetching data from the live database (MySQL/PostgreSQL/Firestore) instead of `sample-data.ts`.
*   **Complete SQL Adapter Functionality:** Ensure all methods in `IDatabaseAdapter` are fully and correctly implemented for MySQL and PostgreSQL, particularly for entities not yet thoroughly tested with SQL (e.g., User Bids, Wins, Reviews, Questions, advanced Platform Settings).
*   **Full Filter & Search Implementation:** Make filters on admin and public search pages fully functional with database queries.
*   **Media Library:** Implement file uploads (Firebase Storage), metadata editing, and linking to lots.
*   **User Authentication & Authorization:**
    *   Robust role-based access control for all actions.
    *   Complete `habilitationStatus` logic.
*   **AI Flows:** Integrate AI suggestions more deeply into the auction/lot creation process.
*   **Dashboard Functionality:** Implement backend logic for "My Bids", "My Wins", etc.
*   **Subcategories for Megamenu:** Implement actual subcategory data model and display in the "Categorias" megamenu.
*   **Refine UI/UX:** Continue polishing based on the PRD and user experience best practices.
*   **Testing:** Comprehensive testing across all features and database systems.
*   **Address PRD Core Features:** Systematically implement all remaining core features outlined in the PRD.
*   **Debugging/Hot-Reload Process:** (User request) Consider adding more console logs or simple UI indicators during development to understand component re-renders or data re-fetches, if persistent issues arise.
```
    
    