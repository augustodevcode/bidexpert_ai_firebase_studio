
# Project Context History

This file contains a summary of the project's context, including its purpose, key features, and any important decisions made during development.

**Initial Prompt:**

*   User initiated a session to continue working on the BidExpert Next.js application.

**Key Features Discussed/Implemented Recently:**

*   **Error Resolution (sampleLotBids):**
    *   Addressed a persistent "Export sampleLotBids doesn't exist in target module" error.
    *   Multiple attempts were made to fix by ensuring `sampleLotBids` was correctly defined and exported in `src/lib/sample-data.ts`.
    *   The final proposed solution involved providing the complete and correct content for `src/lib/sample-data.ts`, suggesting a possible caching issue on the user's end if the error continued.
*   **UI Enhancements for Icon-Only Buttons:**
    *   Request to change "Compartilhar", "Imprimir", and "Voltar" buttons to display only icons across the application.
    *   Implemented this change for `lot-detail-client.tsx` and `auctioneerSlug/page.tsx`.
    *   Follow-up request to add tooltips (hints) to all icon-only buttons for better UX.
    *   Implemented tooltips using ShadCN `Tooltip` components across multiple files, including admin pages, auction cards, and the live auditorium.
*   **Media Management Strategy (Imagens de Lotes):**
    *   User inquired about using actual images for lots from a local zip file (`CadastrosExemplo.zip`).
    *   Explained limitations in accessing local file systems and the need for images to be uploaded to a publicly accessible URL (e.g., Firebase Storage or `/public` folder).
    *   Clarified that placeholder images (`placehold.co`) are not stored locally but generated via URL.
*   **Media Library CRUD Feature (WordPress Style):**
    *   User requested a comprehensive media gallery feature with upload, organization, metadata editing, and linking to lots.
    *   Acknowledged the large scope and AI limitations for full backend/upload implementation.
    *   **Implemented Initial Scaffolding:**
        *   Defined `MediaItem` type in `src/types/index.ts`.
        *   Created `/admin/media/page.tsx` as a client component.
        *   Created placeholder server actions in `/admin/media/actions.ts` (`getMediaItems`, `handleImageUpload`, `updateMediaItemMetadata`, `deleteMediaItem`, `linkMediaItemsToLot`, `unlinkMediaItemFromLot`).
        *   Added a "Biblioteca de Mídia" link to the admin sidebar.
        *   Added a "Adicionar da Biblioteca" button (placeholder) and image gallery display section in `src/app/admin/lots/lot-form.tsx`.
*   **Error Resolution (Firestore Permissions - Media Library):**
    *   User encountered `FirebaseError: Missing or insufficient permissions` when `/admin/media/page.tsx` tried to fetch items.
    *   Modified `getMediaItems` in `src/app/admin/media/actions.ts` to use `console.warn` instead of `console.error` for Firestore permission errors. This was to prevent the Next.js error overlay and allow the page to fall back to sample data, while still logging the permission issue on the server for the user to address.
    *   User confirmed Firestore rules for `mediaItems` were updated to `allow read: if true; allow write: if true;`, but the error persisted. Discussed other potential causes (higher-level rules, propagation delay, Admin SDK issues).
*   **Media Library UI Transformation (Table View):**
    *   User requested to change the `/admin/media/page.tsx` view from a grid to a detailed table layout.
    *   Implemented the table view with columns for selection (checkbox), file (thumbnail/name), author, attachments, comments (icon), date, and actions.
    *   Added a toolbar above the table with placeholders for view toggle, filters (media type, date), bulk actions, search, and pagination.

**Design Decisions:**

*   Tooltips will be used for all icon-only buttons to improve user understanding.
*   Media library development will be iterative, starting with UI scaffolding and placeholder actions.
*   Server-side errors related to expected development configurations (like Firestore permissions) will use `console.warn` to provide feedback without breaking the page rendering with Next.js error overlays, allowing fallback to sample data where implemented.

---
## Session: SQL Database Adapters & Context Persistence (June 2024)

**Objective:**
*   Resolve persistent foreign key constraint issues in MySQL schema initialization.
*   Complete the implementation of CRUD (Create, Read, Update, Delete) operations for all major entities (`lot_categories`, `states`, `cities`, `auctioneers`, `sellers`, `auctions`, `lots`, `roles`, `users`, `mediaItems`) in both `PostgresAdapter.ts` and `MySqlAdapter.ts`.
*   Refine server actions to correctly interact with the database adapters, particularly concerning the resolution of entity names to IDs.
*   Establish a system for context persistence between development sessions using markdown files in a `context/` directory.

**Key Developments & Decisions During This Phase:**

*   **MySQL Schema Initialization Resolved:**
    *   Identified that lingering schema inconsistencies from previous script runs were causing foreign key constraint errors, even with correct column types and DDL order.
    *   **Solution:** Implemented `DROP TABLE IF EXISTS ... CASCADE;` (Postgres) and `DROP TABLE IF EXISTS ... ;` (MySQL, with appropriate `SET FOREIGN_KEY_CHECKS`) for all tables in reverse dependency order *before* the `CREATE TABLE` statements in the SQL adapters' `initializeSchema` methods.
    *   **Outcome:** The `initialize-db.ts --db=mysql` script now completes successfully, creating all tables without foreign key warnings.

*   **Incremental CRUD Implementation in SQL Adapters (`PostgresAdapter.ts`, `MySqlAdapter.ts`):**
    *   **`lot_categories`**: Implemented and confirmed.
    *   **`states`**: Implemented and confirmed.
    *   **`cities`**: Implemented, including logic to fetch `stateUf` from the parent `states` table.
    *   **`auctioneers`**: Implemented.
    *   **`sellers`**: Implemented.
    *   **`auctions`**: Implemented.
        *   Adapters now handle resolving `categoryName`, `auctioneerName`, and `sellerName` (from `AuctionDbData`) to their respective IDs (`categoryId`, `auctioneerId`, `sellerId`) before database operations.
        *   Date/timestamp conversions and JSON serialization/deserialization for `auctionStages` were handled.
    *   **`lots`**: Implemented.
        *   Adapters now expect `categoryId`, `stateId`, `cityId`, `auctionId`, `sellerId`, `auctioneerId` as IDs.
        *   Server actions (`src/app/admin/lots/actions.ts`) were refactored to perform the name-to-ID resolution for `category` before calling the adapter.
        *   Implemented `getBidsForLot` and `placeBidOnLot` (with transaction handling for SQL).
    *   **`roles`**: Implemented.
        *   Includes `ensureDefaultRolesExist` in SQL adapters.
        *   Protection for default system roles (`ADMINISTRATOR`, `USER`) against deletion/renaming of `name_normalized`.
    *   **`users`**: Implemented.
        *   `ensureUserRole` in adapters handles creating/updating user profiles in the database and associating them with roles and permissions.
        *   Server actions (`src/app/admin/users/actions.ts`) were refactored to correctly call `ensureUserRole` after Firebase Auth user creation and for role updates.
    *   **`mediaItems`**: Implemented.
        *   Handles `linkedLotIds` as JSON arrays in SQL.
        *   `deleteMediaItemFromDb` only handles DB record; file deletion from storage is in the server action.

*   **Server Action Refinements:**
    *   The principle that server actions resolve human-readable names/slugs (from forms) into IDs before calling database adapter methods was reinforced and applied, especially for `lots` and `users`. Database adapters now consistently expect IDs for foreign key relationships.
    *   `FirestoreAdapter.ts` was also updated to align with this principle for `auctions` and `lots`, ensuring it resolves names to IDs similarly to how server actions prepare data for SQL adapters.

*   **Context Persistence System Established:**
    *   This current interaction focuses on creating/updating the context files (`PROJECT_CONTEXT_HISTORY.md`, `PROJECT_PROGRESS.md`, `PROJECT_INSTRUCTIONS.md`, `1st.md`) to facilitate context persistence across sessions.

**Next Immediate Step (Post-Context System Setup):**
*   Implement CRUD for the final entity, `platformSettings`, in `PostgresAdapter.ts` and `MySqlAdapter.ts`.
*   Thoroughly test all admin CRUD functionalities with the SQL database options.

---
**Note:** This file is a living document and will be updated as the project evolves.
