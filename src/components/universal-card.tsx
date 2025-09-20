// src/components/universal-card.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings } from '@/types';
import AuctionCard from '@/components/auction-card'; // Corrigido para o caminho com alias correto
import LotCard from './lot-card'; // Corrigido para caminho relativo

type Item = Partial<Auction & Lot>;

interface UniversalCardProps {
  item: Item;
  type: 'auction' | 'lot';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
}

export default function UniversalCard({ item, type, platformSettings, parentAuction, onUpdate }: UniversalCardProps) {
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
      />
    );
  }

  return null;
}
