// src/components/cards/lot-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings } from '@/types';
import UniversalListItem from '../universal-list-item';

interface LotListItemProps {
  lot: Lot;
  auction?: Auction;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

/**
 * @deprecated Este componente tornou-se um invólucro para UniversalListItem e deve ser removido.
 * Use UniversalListItem diretamente com `type="lot"` em vez disso.
 */
export default function LotListItem({ lot, auction, platformSettings, onUpdate }: LotListItemProps) {
  // O UniversalListItem agora lida com a renderização. Este componente é apenas um wrapper para manter a compatibilidade.
  return (
    <UniversalListItem 
        item={lot}
        type="lot"
        platformSettings={platformSettings}
        onUpdate={onUpdate}
    />
  );
}
