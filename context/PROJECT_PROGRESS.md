
# Project Progress

## DONE
- Created the `context` directory and initial context files.
- Implemented CRUD for Lot Categories (`/admin/categories`) - Firestore and SQL adapters.
- Implemented CRUD for States (`/admin/states`) - Firestore and SQL adapters.
- Implemented CRUD for Cities (`/admin/cities`), including filtering cities by state in the form - Firestore and SQL adapters.
- Implemented CRUD for Auctioneers (`/admin/auctioneers`) - Firestore and SQL adapters.
  - Resolved build-time and runtime errors related to Client/Server component interactions and event handlers on `/admin/auctioneers/page.tsx`.
  - Corrected SQL `INSERT` query issues (`ER_WRONG_VALUE_COUNT_ON_ROW`) in `MySqlAdapter` for `createAuctioneer`.
  - Added `getAuctioneerByName` to auctioneer actions and adapter.
- Implemented CRUD for Sellers (`/admin/sellers`) - Firestore and SQL adapters.
  - Corrected SQL `INSERT` query issues (`ER_WRONG_VALUE_COUNT_ON_ROW`) in `MySqlAdapter` for `createSeller`.
- Implemented CRUD for Auctions (`/admin/auctions`), linking to categories, auctioneers, and sellers - Firestore and SQL adapters. Server actions for auctions refactored for ID resolution.
- Implemented CRUD for Lots (`/admin/lots`), linking to auctions, categories, states, and cities - Firestore and SQL adapters. Server actions for lots refactored for ID resolution.
- Implemented CRUD for Roles (`/admin/roles`) - Firestore and SQL adapters, including default roles and protection.
- Implemented CRUD for Users (`/admin/users`) - Firestore and SQL adapters. Server actions for users refactored for role assignment.
- Implemented CRUD for Media Items (`/admin/media`) - Firestore and SQL adapters.
- Added a "Lots" section to the "Edit Auction" page, allowing viewing and adding lots to a specific auction.
- Implemented basic AI flows for: `suggestListingDetails`, `predictOpeningValue`, `suggestSimilarListings`.
- Created an `/auctions/create` page to input auction data and get AI suggestions.
- Created public-facing pages for: Seller detail, Auctioneer detail, Static pages (About, Contact, FAQ, Terms, Privacy).
- Implemented basic Dashboard pages (Overview, Bids, Wins, Documents, History, Reports, Notifications).
- Implemented Live Dashboard and Virtual Auditorium pages with initial structure.
- UI Enhancements: Icon-only buttons with tooltips.
- Media Library: Initial scaffolding (type, admin page, placeholder actions, admin link).
- Resolved Firestore permission error display for Media Library (using `console.warn`).
- Transformed Media Library page to a table view with toolbar placeholders.
- **MySQL schema initialization fixed with `DROP TABLE IF EXISTS`.**
- **Context persistence file system setup (`PROJECT_CONTEXT_HISTORY.md`, `PROJECT_PROGRESS.md`, `PROJECT_INSTRUCTIONS.md`, `1st.md`) - This task.**
- **Fixed `HomeIcon is not defined` and `getFavoriteLotIdsFromStorage is not defined` in header.**
- **Fixed mobile search icon visibility in header.**
- **Converted `/admin/categories/page.tsx` to Client Component to resolve event handler error.**
- **Corrected MySQL syntax for `platform_settings` table creation (JSON DEFAULT).**
- **Corrected MySQL `createLot` by ensuring `undefined` values are passed as `null` where appropriate.**
- **Updated `/auth/register` page UI for Pessoa Jurídica and Comitente Venda Direta.**

## WORKING
- **Finalizing SQL adapter implementations (next: `platformSettings` CRUD, if not fully covered).**
- Ensuring robustness of fallback mechanisms when server actions encounter expected configuration issues (like permissions).
- User-side investigation of Firestore permissions for the `mediaItems` collection (ongoing if not fully resolved by schema changes).
- **Backend processing for new fields from the updated registration form in `createUser` action and DB adapters.**

## NEXT
- **Data Model Refinement: Remove status and date fields from `Lot` entity; these should be derived from the parent `Auction`.**
    - Update `Lot` type in `src/types/index.ts`.
    - Update `lot-form.tsx` and `lot-form-schema.ts` to remove these fields.
    - Update `LotCard.tsx`, `LotListItem.tsx`, and other components displaying lot status/dates to fetch/derive this info from the auction.
    - Update SQL adapters (schema and CRUD for `lots` table) to remove these columns.
    - Update Firestore adapter (if still relevant for lots) for these fields.
- **Implement CRUD for `platformSettings` in SQL adapters (if not fully covered by schema init).**
- **Media Library - Core Functionality (Post SQL Adapter Completion):**
    - Implement actual file upload functionality (client-side and server-side handling, likely using Firebase Storage) for the "Fazer Upload" button on the Media Library page.
    - Develop a modal component for editing `MediaItem` metadata (title, alt text, caption, description).
    *   Implement the "Editar" button functionality on the Media Library page to open this modal.
    *   Implement the "Excluir" button functionality fully (delete from DB and Firebase Storage).
- **Media Library - Lot Integration (Post SQL Adapter Completion):**
    *   Create a modal component to display the Media Library (`/admin/media/page.tsx` or a dedicated selection component) when "Adicionar da Biblioteca" is clicked in `lot-form.tsx`.
    *   Implement logic to select images from this modal and link their IDs (`mediaItemIds`) to the lot being edited/created.
    *   Update `lot-form.tsx` to display thumbnails of linked `MediaItem`s and manage `mediaItemIds`.
- **SQL Database Seeding (Post Adapter Completion):**
    *   Potentially update `scripts/seed-firestore.ts` or create new seed scripts for SQL databases if needed for sample data.
    *   Seed images using `copy-sample-images-to-public.ts` and then update sample data with correct public URLs.
- **Thorough Testing:**
    *   Test all admin CRUD functionalities with both PostgreSQL and MySQL (by switching `ACTIVE_DATABASE_SYSTEM`).
- **Full Functionality for Filters & Search on Admin Pages:**
    *   Implement working filters, search, and pagination for all admin list pages (Categories, Auctions, Lots, Media, etc.) for SQL backends.
- **Refine AI Flow Integration:**
    *   Improve how AI suggestions are presented and applied on the `/auctions/create` page.
- **User Authentication & Authorization:**
    *   Solidify role-based access control, moving beyond email string matching for admin/consignor roles.
    *   Ensure `habilitationStatus` logic is fully integrated.
    *   **Critical:** Review and implement permission checks within individual Server Actions for robust security (defense in depth).
- **Frontend Polish:**
    *   Continue improving UI consistency and responsiveness.
- **Dashboard Pages - Functionality:**
    *   Implement backend logic for My Bids, My Wins, Notifications, etc., connecting to the database.
- **Public Facing Pages - Data Integration:**
    *   Ensure all public-facing pages (category, auction detail, lot detail, seller detail, auctioneer detail) correctly fetch and display data from the active database, using `publicId` for routing where appropriate.
    *   Update links in admin list pages (e.g., edit auctioneer) to use `publicId` instead of numeric ID for routes.
```