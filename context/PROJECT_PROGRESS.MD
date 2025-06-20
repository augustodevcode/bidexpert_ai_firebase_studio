
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
    *   Conditional tab "Documentos e Processo" on lot detail page.
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
- **Subcategory Management (Item 16):**
    *   Defined `Subcategory` type in `src/types/index.ts`.
    *   Updated `LotCategory` type.
    *   Updated `IDatabaseAdapter` with subcategory CRUD methods.
    *   Implemented subcategory CRUD methods in `MySqlAdapter` and `PostgresAdapter`.
    *   Created Server Actions for subcategories.
    *   Developed UI (form, list, edit pages) for subcategory management.
    *   Added "Subcategorias" link to admin sidebar.
- **Error Fixes (General):**
    *   Resolved various `Module not found`, `React is not defined`, `DialogTitle required`, `useMemo not defined`, `Tabs not defined` errors.
    *   Corrected `getCategoryAssets` to handle descriptive titles gracefully.
    *   Fixed multiple "Unexpected eof" and "Unexpected token" syntax errors.
    *   Diagnosed and provided guidance for "input token count exceeds maximum" for AI flows.
    *   Addressed "Internal Server Error" related to SWC build issues by re-emitting files and ensuring correct component types/hook usage.
- **Context Persistence System (This Task - Item User Request):**
    *   Created `context/PROJECT_CONTEXT_HISTORY.md`.
    *   Created `context/PROJECT_PROGRESS.MD` (this file).
    *   Created `context/PROJECT_INSTRUCTIONS.md`.
    *   Created `context/1st.md`.

## WORKING
- **Finalizing Subcategory Feature (Item 17 & 18):**
    *   **Item 17:** Add examples of subcategories to `sample-data.ts` and connect to main categories.
    *   **Item 18:** Integrate subcategory selection into the Lot CRUD form and display on lot pages/cards.

## NEXT
- **Item 13 (Partially Done - needs full review):** Ensure all lot dates (endDate, stages) are consistently derived from the parent Auction across all displays (cards, lists, detail pages).
- **Item 19:** Implement Live Dashboard (`/live-dashboard`) with real-time updates for open lots.
- **Item 20:** Develop Virtual Auditorium (`/auctions/[auctionId]/live`) with current lot display, bidding panel, upcoming lots, and chat.
- **Complete SQL Adapter Implementation:**
    *   Thoroughly test and complete all `IDatabaseAdapter` methods for MySQL and PostgreSQL for all entities.
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
  