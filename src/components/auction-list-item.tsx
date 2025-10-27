// src/components/auction-list-item.tsx
/**
 * @fileoverview Componente de item de lista para Leilões.
 * Este componente foi refatorado para ser um invólucro para o novo
 * componente universal, BidExpertListItem, garantindo a compatibilidade
 * enquanto a transição para o novo sistema é concluída.
 */
'use client';

import * as React from 'react';
import type { Auction, PlatformSettings } from '@/types';
import BidExpertListItem from './BidExpertListItem';

interface AuctionListItemProps {
  auction: Auction;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

export default function AuctionListItem({ auction, platformSettings, onUpdate }: AuctionListItemProps) {
  // Este componente agora delega a renderização para o componente universal.
  return (
    <BidExpertListItem 
        item={auction}
        type="auction"
        platformSettings={platformSettings}
        onUpdate={onUpdate}
    />
  );
}
