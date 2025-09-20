// src/components/universal-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings } from '@/types';
import AuctionListItem from '@/components/auction-list-item';
import LotListItem from '@/components/lot-list-item';


type Item = Partial<Auction & Lot>;

interface UniversalListItemProps {
  item: Item;
  type: 'auction' | 'lot';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
}

export default function UniversalListItem({ item, type, platformSettings, parentAuction, onUpdate }: UniversalListItemProps) {
  if (!item) return null;

  if (type === 'auction') {
    return <AuctionListItem auction={item as Auction} onUpdate={onUpdate} />;
  }
  
  if (type === 'lot') {
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
