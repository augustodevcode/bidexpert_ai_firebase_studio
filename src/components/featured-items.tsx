// src/components/featured-items.tsx
import type { Auction, Lot, PlatformSettings } from '@/types';
import { Button } from './ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BidExpertCard from './universal-card'; // Importar o novo componente

interface FeaturedItemsProps {
  items: (Auction | Lot)[];
  type: 'auction' | 'lot';
  title: string;
  viewAllLink: string;
  platformSettings: PlatformSettings;
  allAuctions?: Auction[]; // Optional: Pass all auctions to LotCard if needed
}

export default function FeaturedItems({ items, type, title, viewAllLink, platformSettings, allAuctions = [] }: FeaturedItemsProps) {
  if (!items || items.length === 0) {
    return null;
  }
  
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
          const parentAuction = type === 'lot' ? allAuctions.find(a => a.id === (item as Lot).auctionId) : undefined;
          return (
            <BidExpertCard 
                key={item.id} 
                item={item}
                type={type} 
                platformSettings={platformSettings}
                parentAuction={parentAuction}
            />
          );
        })}
      </div>
    </section>
  );
}
