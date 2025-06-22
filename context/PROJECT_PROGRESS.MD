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
    *   **Item 1 (Badges Review - DONE):** Implemented `BadgeVisibilitySettings` and `SectionBadgeConfig` in `PlatformSettings`. Display logic for Discount, Urgency Timer, "MAIS VISITADO", "LANCE QUENTE", "EXCLUSIVO" badges on `LotCard`, `LotListItem`, and `LotDetailClientContent` verified.
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
- **`SearchResultsFrame` Component (Item 5 - DONE):**
    *   Created for consistent display of search results/listings.
    *   Integrated into: Auction edit page (for lots), Seller detail page (for lots), Auctioneer detail page (for auctions), Main search page (`/search`), Category page. Confirmed as standard component.
- **Subcategory Management (Items 16, 17, 18):**
    *   **Item 16 (DONE):** Defined `Subcategory` type, updated `LotCategory`, updated `IDatabaseAdapter`, implemented subcategory CRUD in SQL adapters, created Server Actions, developed UI (form, list, edit pages), added admin sidebar link.
    *   **Item 17 (DONE):** Added examples of subcategories to `sample-data.ts` and connected to main categories. `hasSubcategories` flag correctly set.
    *   **Item 18 (DONE):** Integrated subcategory selection into Lot CRUD form. Updated display components (`LotListItem`, `LotDetailClientContent`, `LotCard`, lot list in auction edit) to show subcategory name.
- **Lot Dates & Status Derivation (Item 13 - DONE):**
    *   `sample-data.ts` logic updated to derive lot `endDate` and `status` from parent auction, considering `auctionStages`.
    *   `LotDetailClientContent` (and its `DetailTimeRemaining` component) uses derived effective start/end dates.
    *   `LotCard` and `LotListItem` reflect these derived dates/status via the updated `sampleLots`.
    *   Reviewed all display components to ensure consistency.
- **Admin User Permissions & Login (`admin@bidexpert.com.br` - DONE)**: Restored database adapter logic for user/role management, resolving login issues by removing hardcoded sample-data access in actions. The system now respects the `ACTIVE_DATABASE_SYSTEM` environment variable.
- **Search Page Hero (Item 2 - DONE):** Removed smaller icon from the center of the main hero banner on the search page.
- **CRUD Actions Refactoring (Item 6):**
  - **Sub-task 1 (DONE):** Refactored server actions for States, Cities, Auctioneers, and Sellers to use the `getDatabaseAdapter()`, ensuring they work with the configured data source (sample-data, MySQL, or PostgreSQL).
- **Media Library Integration (Items 3, 4, 7):**
  - **Sub-task 1 (DONE):** Replaced URL text inputs with a media selection button and preview in the Category CRUD form.
  - **Sub-task 2 (DONE):** Replaced URL inputs in Auctioneer, Seller, and Auction forms.

## DOING
- **Media Library Integration (Items 3, 4, 7):**
  - **Sub-task 3 (DOING):** Perform data migration in `sample-data.local.json` to move all image URLs into `mediaItems` and link them to their respective entities. This will be a larger refactor.

## NEXT
- **Item 19:** Implement visual timeline for auction stages in the auction CRUD form (`/admin/auctions/[auctionId]/edit`).
- **Item 20:** Develop Virtual Auditorium (`/auctions/[auctionId]/live`) with current lot display, bidding panel, upcoming lots, and chat.
- **Item 21:** Gantt chart for auctions on the auction dashboard (`/admin/auctions/page.tsx`).
- **Complete SQL Adapter Implementation:**
    *   Thoroughly test and complete all `IDatabaseAdapter` methods for MySQL and PostgreSQL for all entities.
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
