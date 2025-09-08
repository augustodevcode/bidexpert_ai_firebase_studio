// packages/ui/src/components/direct-sale-offer-list-item.tsx
'use client';

// Placeholder for the DirectSaleOfferListItem component.
// This component will display a direct sale offer in a list format,
// similar to AuctionListItem and LotListItem.

import type { DirectSaleOffer } from '@bidexpert/core';
import { Card, CardContent } from './ui/card';
import { Tag } from 'lucide-react';
import Link from 'next/link';

interface DirectSaleOfferListItemProps {
  offer: DirectSaleOffer;
}

export function DirectSaleOfferListItem({ offer }: DirectSaleOfferListItemProps) {
  return (
     <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <CardContent className="p-4">
             <Link href={`/direct-sales/${offer.id}`}>
                <h3 className="font-semibold hover:text-primary">{offer.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground gap-2 mt-1">
                    <Tag className="h-4 w-4"/>
                    <span>{offer.category}</span>
                    <span>-</span>
                    <span>{offer.sellerName}</span>
                </div>
             </Link>
        </CardContent>
     </Card>
  );
}
