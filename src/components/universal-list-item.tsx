// src/components/universal-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings, DirectSaleOffer, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import AuctionListItem from '@/components/cards/auction-list-item';
import LotListItem from '@/components/cards/lot-list-item';
import DirectSaleOfferListItem from '@/components/cards/direct-sale-offer-list-item';
import SellerListItem from './cards/seller-list-item';
import AuctioneerListItem from './cards/auctioneer-list-item';


type Item = Partial<Auction & Lot & DirectSaleOffer & SellerProfileInfo & AuctioneerProfileInfo>;

interface UniversalListItemProps {
  item: Item;
  type: 'auction' | 'lot' | 'direct_sale' | 'seller' | 'auctioneer';
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
  
  if (type === 'direct_sale') {
      return <DirectSaleOfferListItem offer={item as DirectSaleOffer} />;
  }

  if (type === 'seller') {
    return <SellerListItem seller={item as SellerProfileInfo} onUpdate={onUpdate} />;
  }

  if (type === 'auctioneer') {
      return <AuctioneerListItem auctioneer={item as AuctioneerProfileInfo} onUpdate={onUpdate} />;
  }


  return null;
}
