
# Project Context History

This file contains a summary of the project's context, including its purpose, key features, and any important decisions made during development.

## Session: SQL Database Adapters & Context Persistence (June 2024) - Continued

**Continuation of Previous Session Objectives:**
*   Resolve persistent foreign key constraint issues in MySQL schema initialization.
*   Complete the implementation of CRUD (Create, Read, Update, Delete) operations for all major entities (`lot_categories`, `states`, `cities`, `auctioneers`, `sellers`, `auctions`, `lots`, `roles`, `users`, `mediaItems`) in both `PostgresAdapter.ts` and `MySqlAdapter.ts`.
*   Refine server actions to correctly interact with the database adapters, particularly concerning the resolution of entity names to IDs.
*   Establish a system for context persistence between development sessions using markdown files in a `context/` directory.

**Key Developments & Decisions During This Phase (Continued from previous PROJECT_CONTEXT_HISTORY.md content):**

*   **MySQL Schema Initialization Resolved:**
    *   Successfully implemented `DROP TABLE IF EXISTS ... ;` with `SET FOREIGN_KEY_CHECKS` for all tables in reverse dependency order in the MySQL adapter's `initializeSchema` method.
    *   **Outcome:** The `initialize-db.ts --db=mysql` script now completes successfully, creating all tables without foreign key warnings.

*   **Incremental CRUD Implementation in SQL Adapters (`PostgresAdapter.ts`, `MySqlAdapter.ts`):**
    *   Completed and verified CRUD for `lot_categories`, `states`, `cities`, `auctioneers`, `sellers`, `auctions`, `lots`, `roles`, `users`, and `mediaItems`.
    *   Ensured adapters handle name-to-ID resolution where necessary (e.g., for `auctions` linking to `categories`, `auctioneers`, `sellers`, and `lots` linking to `category`).
    *   Implemented default roles and protection for system roles in SQL adapters.
    *   Server actions were refactored to align with the principle of resolving names to IDs before calling adapter methods.

*   **Error Resolution - Admin Pages (Build & Runtime):**
    *   **Auctioneers Page (`/admin/auctioneers/page.tsx`):**
        *   Addressed a build-time error: `Error: Event handlers cannot be passed to Client Component props.` This error occurred because the page was a Server Component trying to pass event handlers (like `onDelete`) to a Client Component (the delete button/dialog).
        *   **Solution Path:**
            1.  Converted `/admin/auctioneers/page.tsx` to a Client Component (`'use client'`).
            2.  Data fetching (`getAuctioneers`) moved to `useEffect` and managed with `useState`.
            3.  The `DeleteAuctioneerButton` was refactored into a `DeleteAuctioneerButtonClient` (Client Component) which:
                *   Takes an `onDeleteSuccess` callback.
                *   Directly calls the `deleteAuctioneer` Server Action.
                *   Invokes `onDeleteSuccess` (which re-fetches the list) upon successful deletion.
        *   Addressed a runtime error: `Error: Link is not defined.` by adding `import Link from 'next/link';` to `/admin/auctioneers/page.tsx` after converting it to a client component.
        *   Addressed a runtime error: `ReferenceError: handleDeleteAuctioneer is not defined` by ensuring the `DeleteAuctioneerButtonClient` was correctly called with the `onDeleteSuccess` prop and that no old references to `handleDeleteAuctioneer` remained in the JSX.
        *   Addressed a runtime error: `Error: React.Children.only expected to receive a single React element child` by simplifying the nesting of `TooltipTrigger` and `AlertDialogTrigger` within `DeleteAuctioneerButtonClient`, ensuring `asChild` props had a single, valid React child element.

*   **Database Operations & Error Handling:**
    *   **MySQL `createSeller` and `createAuctioneer` errors:**
        *   Diagnosed and fixed `ER_WRONG_VALUE_COUNT_ON_ROW` errors in `src/lib/database/mysql.adapter.ts`.
        *   **Solution:** Ensured the `INSERT INTO` column list and the `VALUES (...)` clause (including placeholders `?` and direct values like `NOW()` or `0`) perfectly matched in count and order. Columns with `DEFAULT CURRENT_TIMESTAMP` in the table definition (`created_at`, `updated_at`) were removed from explicit `INSERT` statements to let MySQL handle them. Values for `member_since` were changed to `NOW()` (or new Date() passed as parameter) and numeric defaults were passed explicitly.

*   **Context Persistence System Established:**
    *   The current interaction focuses on creating/updating the context files (`PROJECT_CONTEXT_HISTORY.md`, `PROJECT_PROGRESS.md`, `PROJECT_INSTRUCTIONS.md`, `1st.md`) to facilitate context persistence across sessions.

**Next Immediate Step (Post-Context System Setup):**
*   Implement CRUD for the final entity, `platformSettings`, in `PostgresAdapter.ts` and `MySqlAdapter.ts`.
*   Thoroughly test all admin CRUD functionalities with the SQL database options.

---
**Note:** This file is a living document and will be updated as the project evolves.
(Previous history from the initial `PROJECT_CONTEXT_HISTORY.md` should be prepended here if this is a continuation)
