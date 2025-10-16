// src/components/BidExpertListItem.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings, DirectSaleOffer, SellerProfileInfo, AuctioneerProfileInfo, UserProfileWithPermissions, Asset } from '@/types';
import AuctionListItem from '@/components/cards/auction-list-item';
import LotListItem from '@/components/cards/lot-list-item';
import DirectSaleOfferListItem from '@/components/cards/direct-sale-offer-list-item';
import SellerListItem from './cards/seller-list-item';
import AuctioneerListItem from './cards/auctioneer-list-item';
import UserListItem from './cards/user-list-item';
import AssetListItem from './cards/asset-list-item';


type Item = Partial<Auction & Lot & DirectSaleOffer & SellerProfileInfo & AuctioneerProfileInfo & UserProfileWithPermissions & Asset>;

interface BidExpertListItemProps {
  item: Item;
  type: 'auction' | 'lot' | 'direct_sale' | 'seller' | 'auctioneer' | 'user' | 'asset';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
}

export default function BidExpertListItem({ item, type, platformSettings, parentAuction, onUpdate }: BidExpertListItemProps) {
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
  
  if (type === 'user') {
      return <UserListItem user={item as UserProfileWithPermissions} onUpdate={onUpdate} />;
  }
  
  if (type === 'asset') {
    return <AssetListItem asset={item as Asset} onUpdate={onUpdate} />;
  }

  return null;
}
