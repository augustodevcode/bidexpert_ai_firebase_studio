
# Project Progress - BidExpert

## DONE
- **Admin Panel Foundation:** CRUDs for Lot Categories, States, Cities, Auctioneers, Sellers, Auctions, Lots, Roles, Users, Media Items (initial scaffolding, some with sample data).
- **Database System:**
    - Adapter pattern for Firestore, MySQL, PostgreSQL.
    - SQL schema initialization (`initialize-db.ts`) and admin user setup (`setup-admin-user.ts`) scripts created/refined.
- **Header & Navigation:**
    - Dynamic site title/tagline (via `samplePlatformSettings`).
    - **Megamenus Implemented:** "Categorias de Oportunidades", "Modalidades de Leilão", "Comitentes", "Nossos Leiloeiros".
    - Mobile responsive navigation (Sheet component).
    - Header search bar with category filter and results dropdown.
    - Recently Viewed & Favorite Lots dropdowns (localStorage).
    - History icon added to "Histórico" menu item.
- **Platform Customization (Admin Settings):**
    - Management of Site Title, Tagline, Gallery Image Base Path, Public ID Masks, Map Provider, Search Pagination, Countdown Timers, Related Lots via `/admin/settings`.
    - Settings persisted via active database adapter.
- **Lot Card & Detail Enhancements (Mental Triggers & Info):**
    *   Implemented `BadgeVisibilitySettings` and `SectionBadgeConfig` in `PlatformSettings`.
    *   Display logic for Discount, Urgency Timer, "MAIS VISITADO", "LANCE QUENTE", "EXCLUSIVO" badges on `LotCard`, `LotListItem`, and `LotDetailClientContent`.
    *   Homepage "Lotes em Destaque" shows only `ABERTO_PARA_LANCES` lots.
    *   `LotDetailClientContent` displays "Permite Lance Parcelado" and "Incremento Mínimo".
    *   Countdown timer styling on lot detail page improved.
    *   **Item 15:** Conditional tab "Documentos e Processo" on lot detail page implemented.
- **User Authentication & Authorization:**
    - Updated registration form for Pessoa Jurídica & Comitente Venda Direta.
    - `AuthContext` for SQL/Firebase user state.
    - `hasPermission` / `hasAnyPermission` helpers implemented.
    - Admin and Consignor dashboard layouts protected.
- **Public Facing Pages:**
    *   Initial setup for various informational and detail pages.
    *   Responsiveness of `TabsList` on lot detail page fixed.
- **AI Flows:**
    *   Initial Genkit flows for `suggestListingDetails`, `predictOpeningValue`, `suggestSimilarListings`.
- **`SearchResultsFrame` Component:**
    *   Created for consistent display of search results/listings.
    *   Integrated into:
        *   Auction edit page (for lots).
        *   Seller detail page (for lots).
        *   Auctioneer detail page (for auctions).
        *   Main search page (`/search`).
- **Subcategory Management (Items 16, 17, 18):**
    *   **Item 16 (DONE):** Defined `Subcategory` type, updated `LotCategory`, updated `IDatabaseAdapter`, implemented subcategory CRUD in SQL adapters, created Server Actions, developed UI (form, list, edit pages), added admin sidebar link.
    *   **Item 17 (DONE):** Added examples of subcategories to `sample-data.ts` and connected to main categories. `hasSubcategories` flag correctly set.
    *   **Item 18 (DONE):** Integrated subcategory selection into Lot CRUD form. Updated display components (`LotListItem`, `LotDetailClientContent`, `LotCard`, lot list in auction edit) to show subcategory name.
- **Context Persistence System (User Request - Setup DONE):**
    *   Created `context/PROJECT_CONTEXT_HISTORY.md`.
    *   Created `context/PROJECT_PROGRESS.MD` (this file).
    *   Created `context/PROJECT_INSTRUCTIONS.md`.
    *   Created `context/1st.md`.
- **Item 1 (LotCard Title Spacing - DONE):** Fixed spacing issue between image and title in LotCard.
- **Lot Dates & Status Derivation (Item 13 - DONE):**
    *   `sample-data.ts` logic updated to derive lot `endDate` and `status` from parent auction, considering `auctionStages`.
    *   `LotDetailClientContent` (and its `DetailTimeRemaining` component) uses derived effective start/end dates.
    *   `LotCard` and `LotListItem` reflect these derived dates/status via the updated `sampleLots`.
    *   Reviewed all display components to ensure consistency.

## WORKING
- **Fixing Startup Crash (DOING):** Implementing all placeholder methods in `MySqlAdapter` and `PostgresAdapter` to satisfy the `IDatabaseAdapter` interface and fix critical "FAILED to create a VALID dbInstance" startup errors. This ensures the app can initialize correctly with the SQL database adapters.
- **Admin User Permissions (`admin@bidexpert.com.br`)**: Ensure `admin@bidexpert.com.br` has 'manage_all' permission and sees admin menu items.
    - **Sub-task 1 (DONE):** Updated `scripts/setup-admin-user.ts` to use `admin@bidexpert.com.br`.
    - **Sub-task 2 (DONE):** Updated `src/app/admin/users/actions.ts` (`ensureUserProfileInDb`) to prioritize 'ADMINISTRATOR' role for `admin@bidexpert.com.br`.
    - **Sub-task 3 (DONE):** Transitioned user/role management to `sample-data.ts` for testing.
    - **Sub-task 4 (DONE):** Reverted user/role management back to DB adapters after `sample-data` testing. Finalized adapter implementations for `ensureUserRole` and `getUserByEmail`.

## NEXT
- **Item 19:** Implement visual timeline for auction stages in the auction CRUD form (`/admin/auctions/[auctionId]/edit`).
- **Item 20:** Develop Virtual Auditorium (`/auctions/[auctionId]/live`) with current lot display, bidding panel, upcoming lots, and chat.
- **Item 21:** Gantt chart for auctions on the auction dashboard (`/admin/auctions/page.tsx`).
- **Complete SQL Adapter Implementation:**
    *   Thoroughly test and complete all `IDatabaseAdapter` methods for MySQL and PostgreSQL for all entities (beyond just placeholder stubs).
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
- **AI Flow Integration (Deepen):**
    *   Improve UI for AI interaction (e.g., applying suggestions in forms).
- **Dashboard Pages (User & Consignor):**
    *   Implement backend logic and data display for "My Bids", "My Wins", "My Lots" (Consignor), Financials (Consignor).
- **Implement Remaining PRD Core Features:**
    *   Full Auction Catalog functionality on Home Page (with live DB filters, sorting).
    *   Bidding system (beyond current simulation, consider real-time updates).
    *   User Profile management (public view, full editing).
- **Refine UI/UX & Mobile Responsiveness.**
- **Comprehensive Testing & Performance Optimization.**
- **Error Handling & Logging (User-friendly messages, server-side logging).**
