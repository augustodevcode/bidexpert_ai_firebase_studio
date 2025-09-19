// This component is now obsolete and has been replaced by UniversalListItem.
// It will be deleted in a future step.
'use client';
import type { Auction, PlatformSettings } from '@/types';
import UniversalListItem from '@/components/universal-list-item';
import * as React from 'react';

interface AuctionListItemProps {
  auction: Auction;
  onUpdate?: () => void;
  platformSettings: PlatformSettings;
}

export default function AuctionListItem(props: AuctionListItemProps) {
  return <UniversalListItem item={props.auction} type="auction" {...props} />;
}
