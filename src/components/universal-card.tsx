// src/components/universal-card.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings, DirectSaleOffer } from '@/types';
import AuctionCard from '@/components/cards/auction-card';
import LotCard from '@/components/cards/lot-card';
import DirectSaleOfferCard from '@/components/cards/direct-sale-offer-card';

type Item = Partial<Auction & Lot & DirectSaleOffer>;

interface UniversalCardProps {
  item: Item;
  type: 'auction' | 'lot' | 'direct_sale';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
  showCountdown?: boolean;
}

export default function UniversalCard({ item, type, platformSettings, parentAuction, onUpdate, showCountdown }: UniversalCardProps) {
  if (type === 'auction') {
    return <AuctionCard auction={item as Auction} onUpdate={onUpdate} />;
  }
  
  if (type === 'lot') {
    return (
      <LotCard 
        lot={item as Lot} 
        auction={parentAuction} 
        platformSettings={platformSettings}
        onUpdate={onUpdate}
        showCountdown={showCountdown}
      />
    );
  }
  
  if (type === 'direct_sale') {
    return <DirectSaleOfferCard offer={item as DirectSaleOffer} platformSettings={platformSettings} onUpdate={onUpdate} />;
  }

  return null;
}
