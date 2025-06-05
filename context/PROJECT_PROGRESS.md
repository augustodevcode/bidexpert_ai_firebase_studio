
# Project Progress

## DONE
- Created the `context` directory and initial context files.
- Implemented CRUD for Lot Categories (`/admin/categories`).
- Implemented CRUD for States (`/admin/states`).
- Implemented CRUD for Cities (`/admin/cities`), including filtering cities by state in the form.
- Implemented CRUD for Auctioneers (`/admin/auctioneers`).
- Implemented CRUD for Sellers (`/admin/sellers`).
- Implemented CRUD for Auctions (`/admin/auctions`), linking to categories, auctioneers, and sellers.
- Implemented CRUD for Lots (`/admin/lots`), linking to auctions, categories, states, and cities.
- Added a "Lots" section to the "Edit Auction" page, allowing viewing and adding lots to a specific auction.
- Implemented basic AI flows for:
    - `suggestListingDetails`
    - `predictOpeningValue`
    - `suggestSimilarListings`
- Created an `/auctions/create` page to input auction data and get AI suggestions.
- Created public-facing pages for:
    - Seller detail (`/sellers/[sellerId]`)
    - Auctioneer detail (`/auctioneers/[auctioneerSlug]`)
    - Static pages: About, Contact, FAQ, Terms, Privacy.
- Implemented basic Dashboard pages: Overview, Bids, Wins, Documents, History, Reports, Notifications.
- Implemented a Live Dashboard (`/live-dashboard`) page showing active lots.
- Implemented a Virtual Auditorium page (`/auctions/[auctionId]/live`) with:
    - Current Lot Display
    - Bidding Panel (UI only)
    - Upcoming Lots Panel
    - Auction Chat Panel (UI only)
    - Auction Info Panel
- Implemented "Voltar" buttons on auctioneer and lot detail pages to navigate to their respective list/parent pages.
- Adjusted icon-only buttons (Share, Print, Back) to display only icons and added `aria-label`.
- Added tooltips to all icon-only buttons across multiple pages for improved UX.
- Initial scaffolding for Media Library feature:
    - Defined `MediaItem` type in `src/types/index.ts`.
    - Created `/admin/media/page.tsx` as a client component.
    - Implemented placeholder server actions in `/admin/media/actions.ts`.
    - Added "Biblioteca de Mídia" link to admin sidebar.
    - Added placeholder for media gallery selection in `lot-form.tsx`.
- Changed `console.error` to `console.warn` in `getMediaItems` action to prevent Next.js error overlay for Firestore permission issues, allowing fallback to sample data.
- Transformed `/admin/media/page.tsx` to display media items in a detailed table layout with a toolbar (filters and actions are placeholders).

## WORKING
- Refining Media Library UI and placeholder actions on `/admin/media/page.tsx`.
- User-side investigation of Firestore permissions for the `mediaItems` collection.
- Ensuring robustness of fallback mechanisms when server actions encounter expected configuration issues (like permissions).

## NEXT
- **Media Library - Core Functionality:**
    - Implement actual file upload functionality (client-side and server-side handling, likely using Firebase Storage) for the "Fazer Upload" button on the Media Library page.
    - Develop a modal component for editing `MediaItem` metadata (title, alt text, caption, description).
    - Implement the "Editar" button functionality on the Media Library page to open this modal.
    - Implement the "Excluir" button functionality fully (delete from Firestore and Firebase Storage).
- **Media Library - Lot Integration:**
    - Create a modal component to display the Media Library (`/admin/media/page.tsx` or a dedicated selection component) when "Adicionar da Biblioteca" is clicked in `lot-form.tsx`.
    - Implement logic to select images from this modal and link their IDs (`mediaItemIds`) to the lot being edited/created.
    - Update `lot-form.tsx` to display thumbnails of linked `MediaItem`s and manage `mediaItemIds`.
- **Firestore Seeding for Images:**
    - Discuss and potentially implement updates to `scripts/seed-firestore.ts` to include `sampleAuctions` and `sampleLots` with the new image URLs (once user provides them in `/public` or Storage).
- **Full Functionality for Filters & Search on Admin Pages:**
    - Implement working filters, search, and pagination for all admin list pages (Categories, Auctions, Lots, Media, etc.).
- **Refine AI Flow Integration:**
    - Improve how AI suggestions are presented and applied on the `/auctions/create` page.
- **User Authentication & Authorization:**
    - Solidify role-based access control, moving beyond email string matching for admin/consignor roles.
- **Frontend Polish:**
    - Continue improving UI consistency and responsiveness.
- **Dashboard Pages - Functionality:**
    - Implement backend logic for My Bids, My Wins, Notifications, etc.


    