
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

**Current State:**

*   The application has a foundational structure for most admin CRUD operations (Categories, States, Cities, Auctioneers, Sellers, Lots, Auctions).
*   A basic media library page (`/admin/media`) has been created with a table layout and placeholder actions.
*   UI refinements for icon buttons (icon-only + tooltips) have been applied to several pages.
*   Work is ongoing to integrate real images and fully functional media management.
*   User is currently troubleshooting Firestore permission issues for the `mediaItems` collection.
---

**Note:** This file is a living document and will be updated as the project evolves.

    