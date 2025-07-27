// src/app/auctions/page.tsx
import SearchPage from '@/app/search/page';

/**
 * This page now acts as a server-side alias for the main search page,
 * ensuring that the /auctions route defaults to showing all auctions
 * in the search interface.
 */
export default function AuctionsPage() {
  return <SearchPage />;
}
