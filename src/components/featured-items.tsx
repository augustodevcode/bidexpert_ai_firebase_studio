// src/components/featured-items.tsx
import type { Auction, Lot, PlatformSettings } from '@/types';
import AuctionCard from './auction-card';
import LotCard from './lot-card';
import { Button } from './ui/button';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getAuctions } from '@/app/admin/auctions/actions'; // Import getAuctions

interface FeaturedItemsProps {
  items: (Auction | Lot)[];
  type: 'auction' | 'lot';
  title: string;
  viewAllLink: string;
}

export default async function FeaturedItems({ items, type, title, viewAllLink }: FeaturedItemsProps) {
  // Fetch settings and all auctions to pass down to LotCard
  const [platformSettings, allAuctions] = await Promise.all([
    getPlatformSettings(),
    type === 'lot' ? getAuctions() : Promise.resolve([]), // Only fetch auctions if we're displaying lots
  ]);

  if (!platformSettings) {
    // Handle case where settings are not available
    return <div>Erro ao carregar configurações da plataforma.</div>;
  }
  
  // Create a map for quick auction lookup for lots
  const auctionsMap = new Map(allAuctions.map(a => [a.id, a]));

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">{title}</h2>
        <Button variant="outline" asChild>
          <Link href={viewAllLink}>
            Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => {
          if (type === 'auction') {
            return <AuctionCard key={item.id} auction={item as Auction} />;
          } else {
            const lot = item as Lot;
            const parentAuction = auctionsMap.get(lot.auctionId);
            return <LotCard key={lot.id} lot={lot} auction={parentAuction} platformSettings={platformSettings} />;
          }
        })}
      </div>
    </section>
  );
}
