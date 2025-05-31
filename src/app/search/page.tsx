import AuctionCard from '@/components/auction-card';
import AuctionFilters from '@/components/auction-filters'; // Re-use filters component
import { sampleAuctions } from '@/lib/sample-data'; // Using sample data for now
import type { Auction } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// In a real app, this page would take search/filter params from URL and fetch data
export default function SearchPage() {
  const searchResults: Auction[] = sampleAuctions.slice(0, 3); // Simulate some search results

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-center font-headline">Browse Auctions</h1>
      <p className="text-muted-foreground text-center mb-8">Find exactly what you&apos;re looking for.</p>
      
      <AuctionFilters />

      {searchResults.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Search Results ({searchResults.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-secondary/30 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
          <p className="text-muted-foreground mb-4">Try adjusting your search terms or filters.</p>
          <Button asChild>
            <Link href="/">View All Auctions</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
