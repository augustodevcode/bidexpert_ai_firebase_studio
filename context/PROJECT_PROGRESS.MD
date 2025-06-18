
# Project Progress - BidExpert

## DONE
- **Admin Panel Foundation:** CRUDs for Categories, States, Cities, Auctioneers, Sellers, Auctions, Lots, Roles, Users, Media Items (initial scaffolding, some with sample data).
- **Database System:**
    - Adapter pattern for Firestore, MySQL, PostgreSQL.
    - SQL schema initialization (`initialize-db.ts`) and admin user setup (`setup-admin-user.ts`) scripts created/refined.
- **Header & Navigation:**
    - Dynamic site title/tagline (via `samplePlatformSettings` for now).
    - **Megamenus Implemented:**
        - "Categorias de Oportunidades" (dynamic data, 2-column layout).
        - "Modalidades de Leilão" (static links, two-column layout).
        - "Comitentes" (dynamic data, two-column layout).
        - "Nossos Leiloeiros" (dynamic data, profile previews).
    - Mobile responsive navigation (Sheet component).
    - Header search bar with category filter and results dropdown.
    - Recently Viewed & Favorite Lots dropdowns (localStorage).
- **Platform Customization (Admin Settings):**
    - Management of Site Title, Tagline, Gallery Image Base Path, Public ID Masks via `/admin/settings`.
    - Settings persisted via `platform_settings` (SQL) or 'global' doc (Firestore), read via `getPlatformSettings`.
- **Lot Card Enhancements (Mental Triggers):**
    - Implemented `BadgeVisibilitySettings` and `SectionBadgeConfig` in `PlatformSettings`.
    - Display logic for Discount, Urgency Timer, "MAIS VISITADO", "LANCE QUENTE", "EXCLUSIVO" badges on `LotCard` and `LotListItem`.
    - Homepage "Lotes em Destaque" now shows only `ABERTO_PARA_LANCES` lots and hides the main status badge.
- **Homepage Updates:**
    - Hero Carousel updated with new slides (sports car, general auction) and autoplay.
    - Promotional text and general filter section removed.
- **Data Seeding & Management:**
    - Scripts for sample image copying and basic Firestore data seeding.
- **User Authentication & Authorization:**
    - Updated registration form for Pessoa Jurídica & Comitente Venda Direta.
    - Basic Admin/Consignor dashboard layouts.
    *   SQL authentication flow and `AuthContext` for SQL/Firebase user state.
    *   `hasPermission` / `hasAnyPermission` helpers implemented.
- **Public Facing Pages:**
    *   Initial setup for various informational and detail pages.
    *   **Decision:** Temporarily using `sample-data.ts` for auction/lot detail pages.
- **AI Flows:**
    *   Initial Genkit flows for `suggestListingDetails`, `predictOpeningValue`, `suggestSimilarListings`.
- **Error Fixes (Recent):**
    *   Resolved various `Module not found`, `React is not defined`, `DialogTitle required`, `useMemo not defined`, `Tabs not defined` errors.
    *   Corrected `getCategoryAssets` to handle descriptive titles gracefully.
    *   Fixed multiple "Unexpected eof" and "Unexpected token" syntax errors in `.tsx` and `.ts` files by re-emitting corrected content.
    *   Diagnosed and provided guidance for "input token count exceeds maximum" for AI flows (user-side data optimization).

## WORKING
- **Refining data display based on `sample-data.ts` for public pages.** (Current phase focus)
- **Ensuring stability of recently implemented badge logic and platform settings.**
- **Monitoring for any new build or runtime errors post-corrections.**

## NEXT
- **Revert to Database Data:** Switch auction and lot detail pages to fetch data from the live database (MySQL/PostgreSQL/Firestore) after the current `sample-data` testing phase.
- **Subcategories (Megamenu):**
    - Define data model for subcategories.
    - Implement fetching and display of actual subcategories in the "Categorias" megamenu.
- **Search/Filter Page Functionality:**
    - Ensure search pages (`/search`) correctly interpret and apply filter parameters passed from megamenu links and sidebar filters for all database types.
- **Complete SQL Adapter Implementation:**
    - Thoroughly test and complete all `IDatabaseAdapter` methods for MySQL and PostgreSQL for all entities (especially User Bids, Wins, Reviews, Questions, advanced Platform Settings like Themes).
- **Media Library (Core Functionality):**
    *   Implement file upload (Firebase Storage).
    *   Modal for metadata editing for `MediaItem`.
    *   Deletion functionality (DB & Storage).
- **Lot Form Media Integration:**
    *   Modal to select from Media Library for lot images.
    *   Display/manage linked media in lot form.
- **User Authentication & Authorization (Enhancements):**
    *   Implement robust, granular permission checks in all Server Actions.
    *   Complete `habilitationStatus` workflow for users.
- **AI Flow Integration:**
    *   Deepen integration of AI suggestions in auction/lot creation.
    *   Consider UI for AI interaction (e.g., applying suggestions).
- **Dashboard Pages (User & Consignor):**
    *   Implement backend logic and data display for "My Bids", "My Wins", "My Lots" (Consignor), Financials (Consignor).
- **Implement Remaining PRD Core Features:**
    *   Full Auction Catalog functionality on Home Page (with live DB filters, sorting).
    *   Bidding system (real-time updates, bid history - beyond current simulation).
    *   User Profile management (public view, editing beyond current `/profile/edit`).
    *   Complete static pages (About, Contact, etc.) with final content if different from placeholders.
- **Refine UI/UX:**
    *   Address any UI inconsistencies or areas needing polish based on the PRD.
    *   Ensure mobile responsiveness across all new features.
- **Testing:**
    *   End-to-end testing of all user flows (public, user, admin, consignor).
    *   Performance optimization.
- **Error Handling & Logging:**
    *   Implement more user-friendly error messages for server action failures.
    *   Review server-side logging for clarity and usefulness in debugging.

  