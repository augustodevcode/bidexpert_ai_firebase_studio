import AuctionCard from '@/components/auction-card';
import AuctionFilters from '@/components/auction-filters';
import { sampleAuctions } from '@/lib/sample-data';
import type { Auction } from '@/types';

export default function HomePage() {
  const auctions: Auction[] = sampleAuctions; // In a real app, fetch this data

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-center font-headline">Active Auctions</h1>
      <p className="text-muted-foreground text-center mb-8">Discover unique items and place your bids.</p>
      
      <AuctionFilters />

      {auctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No auctions found</h2>
          <p className="text-muted-foreground">Please check back later or adjust your filters.</p>
        </div>
      )}
    </div>
  );
}
