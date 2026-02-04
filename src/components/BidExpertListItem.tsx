// src/components/BidExpertListItem.tsx
/**
 * @fileoverview Componente de item de lista unificado e reutilizável.
 * Atua como um "dispatcher" que renderiza o template de item de lista apropriado
 * (leilão, lote, comitente, etc.) com base na prop `type`.
 */
'use client';

import * as React from 'react';
import type { Auction, Lot, SellerProfileInfo, AuctioneerProfileInfo, Asset, UserProfileWithPermissions, DirectSaleOffer, PlatformSettings } from '@/types';
import AuctionListItem from './cards/auction-list-item';
import LotListItem from './cards/lot-list-item';
import SellerListItem from './cards/seller-list-item';
import AuctioneerListItem from './cards/auctioneer-list-item';
import AssetListItem from './cards/asset-list-item';
import UserListItem from './cards/user-list-item';
import DirectSaleOfferListItem from './cards/direct-sale-offer-list-item';

type AnyItem = Auction | Lot | SellerProfileInfo | AuctioneerProfileInfo | Asset | UserProfileWithPermissions | DirectSaleOffer;

interface BidExpertListItemProps {
  item: AnyItem;
  type: 'auction' | 'lot' | 'seller' | 'auctioneer' | 'asset' | 'user' | 'direct_sale';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
  density?: 'default' | 'compact' | 'map';
}

export default function BidExpertListItem({ item, type, platformSettings, parentAuction, onUpdate, density = 'default' }: BidExpertListItemProps) {
  switch (type) {
    case 'auction':
      return <AuctionListItem auction={item as Auction} onUpdate={onUpdate} density={density} />;
    case 'lot':
      return (
        <LotListItem
          lot={item as Lot}
          auction={parentAuction}
          platformSettings={platformSettings}
          onUpdate={onUpdate}
          density={density}
        />
      );
    case 'seller':
        return <SellerListItem seller={item as SellerProfileInfo} onUpdate={onUpdate} />;
    case 'auctioneer':
        return <AuctioneerListItem auctioneer={item as AuctioneerProfileInfo} onUpdate={onUpdate} />;
    case 'asset':
        return <AssetListItem asset={item as Asset} onUpdate={onUpdate} />;
    case 'user':
        return <UserListItem user={item as UserProfileWithPermissions} onUpdate={onUpdate} />;
    case 'direct_sale':
        return <DirectSaleOfferListItem offer={item as DirectSaleOffer} density={density} />;
    default:
      console.warn(`Tipo de item de lista desconhecido: ${type}`);
      return null;
  }
}
