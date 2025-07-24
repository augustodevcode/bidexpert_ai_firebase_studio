// src/components/featured-items.tsx
import type { Auction, Lot, PlatformSettings } from '@/types';
import AuctionCard from './auction-card';
import LotCard from './lot-card';
import { Button } from './ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface FeaturedItemsProps {
  items: (Auction | Lot)[];
  type: 'auction' | 'lot';
  title: string;
  viewAllLink: string;
  platformSettings: PlatformSettings; // Add this prop
}

export default function FeaturedItems({ items, type, title, viewAllLink, platformSettings }: FeaturedItemsProps) {
  if (!items || items.length === 0) {
    // Optionally return null or a placeholder if there are no items to display
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
        {items.map((item) => (
          type === 'auction'
            ? <AuctionCard key={item.id} auction={item as Auction} />
            : <LotCard key={item.id} lot={item as Lot} platformSettings={platformSettings} />
        ))}
      </div>
    </section>
  );
}
