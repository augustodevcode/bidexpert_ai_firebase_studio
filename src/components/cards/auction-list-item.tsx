// src/components/cards/auction-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction } from '@/types';
import AuctionCard from './auction-card';

interface AuctionListItemProps {
  auction: Auction;
  onUpdate?: () => void;
}

/**
 * Este componente agora atua como um invólucro (wrapper) para o AuctionCard, 
 * garantindo consistência na forma como os leilões são exibidos em listas.
 * Toda a lógica de exibição está encapsulada no AuctionCard.
 */
export default function AuctionListItem({ auction, onUpdate }: AuctionListItemProps) {
  return (
    <AuctionCard auction={auction} onUpdate={onUpdate} />
  );
}
