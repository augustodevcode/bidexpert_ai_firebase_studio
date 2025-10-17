// src/components/lot-list-item.tsx
/**
 * @fileoverview Componente de item de lista para Lotes.
 * Este componente foi refatorado para ser um invólucro para o novo
 * componente universal, BidExpertListItem, garantindo a compatibilidade
 * enquanto a transição para o novo sistema é concluída.
 */
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings } from '@/types';
import BidExpertListItem from './BidExpertListItem';

interface LotListItemProps {
  lot: Lot;
  auction?: Auction;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

export default function LotListItem({ lot, auction, platformSettings, onUpdate }: LotListItemProps) {
  // Este componente agora delega a renderização para o componente universal.
  return (
    <BidExpertListItem 
        item={lot}
        type="lot"
        platformSettings={platformSettings}
        parentAuction={auction}
        onUpdate={onUpdate}
    />
  );
}
