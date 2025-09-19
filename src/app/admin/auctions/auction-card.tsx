// This component is now obsolete and has been replaced by UniversalCard.
// It will be deleted in a future step.
'use client';
import type { Auction, PlatformSettings } from '@/types';
import UniversalCard from '@/components/universal-card';
import * as React from 'react';

interface AuctionCardProps {
  auction: Auction;
  onUpdate?: () => void;
  platformSettings: PlatformSettings;
}

export default function AuctionCard(props: AuctionCardProps) {
  return <UniversalCard item={props.auction} type="auction" {...props} />;
}
