// src/components/universal-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings, DirectSaleOffer } from '@/types';
import AuctionListItem from '@/components/cards/auction-list-item';
import LotListItem from '@/components/cards/lot-list-item';


type Item = Partial<Auction & Lot & DirectSaleOffer>;

interface UniversalListItemProps {
  item: Item;
  type: 'auction' | 'lot' | 'direct_sale';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
}

export default function UniversalListItem({ item, type, platformSettings, parentAuction, onUpdate }: UniversalListItemProps) {
  if (!item) return null;

  if (type === 'auction') {
    return <AuctionListItem auction={item as Auction} onUpdate={onUpdate} />;
  }
  
  if (type === 'lot' || type === 'direct_sale') {
    return (
      <LotListItem 
        lot={item as Lot} 
        auction={parentAuction} 
        platformSettings={platformSettings}
        onUpdate={onUpdate}
      />
    );
  }

  return null;
}
