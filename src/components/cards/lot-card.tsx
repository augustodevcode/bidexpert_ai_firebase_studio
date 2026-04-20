/**
 * @fileoverview Wrapper de compatibilidade para o card universal de lotes.
 */
'use client';

import * as React from 'react';
import type { Auction, BadgeVisibilitySettings, Lot, PlatformSettings } from '@/types';
import AuctionLotCardV2 from './auction-lot-card-v2';
import { buildAuctionLotCardV2Item } from './auction-lot-card-v2.presenter';

interface LotCardProps {
  lot: Lot;
  auction?: Auction;
  platformSettings?: PlatformSettings | null;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  onUpdate?: () => void;
  showCountdown?: boolean;
}

export default function LotCard({
  lot,
  auction,
  platformSettings,
  badgeVisibilityConfig,
  onUpdate,
  showCountdown = false,
}: LotCardProps) {
  const item = React.useMemo(
    () => ({
      ...buildAuctionLotCardV2Item({
        lot,
        auction,
        platformSettings,
        badgeVisibilityConfig,
        showCountdown,
      }),
      onUpdate,
    }),
    [auction, badgeVisibilityConfig, lot, onUpdate, platformSettings, showCountdown],
  );

  return <AuctionLotCardV2 item={item} />;
}
