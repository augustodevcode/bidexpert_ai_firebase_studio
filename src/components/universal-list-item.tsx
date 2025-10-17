// src/components/BidExpertListItem.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings, DirectSaleOffer, SellerProfileInfo, AuctioneerProfileInfo, UserProfileWithPermissions, Asset } from '@/types';

// Importa os componentes de item de lista específicos que agora servirão como templates internos
import AuctionListItem from '@/components/cards/auction-list-item';
import LotListItem from '@/components/cards/lot-list-item';
import DirectSaleOfferListItem from '@/components/cards/direct-sale-offer-list-item';
import SellerListItem from './cards/seller-list-item';
import AuctioneerListItem from './cards/auctioneer-list-item';
import UserListItem from './cards/user-list-item';
import AssetListItem from './cards/asset-list-item';

// Tipo unificado para os itens que podem ser renderizados
type Item = Partial<Auction & Lot & DirectSaleOffer & SellerProfileInfo & AuctioneerProfileInfo & UserProfileWithPermissions & Asset>;

interface BidExpertListItemProps {
  item: Item;
  type: 'auction' | 'lot' | 'direct_sale' | 'seller' | 'auctioneer' | 'user' | 'asset';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
}

/**
 * @fileoverview Componente de item de lista unificado e reutilizável.
 * Este componente atua como um dispatcher, renderizando o tipo correto de item de lista
 * com base na prop `type`. Ele é o ponto de entrada único para a exibição de
 * itens em formato de lista em toda a plataforma.
 */
export default function BidExpertListItem({ item, type, platformSettings, parentAuction, onUpdate }: BidExpertListItemProps) {
  if (!item) return null;

  switch (type) {
    case 'auction':
      return <AuctionListItem auction={item as Auction} onUpdate={onUpdate} />;
    case 'lot':
      return (
        <LotListItem 
          lot={item as Lot} 
          auction={parentAuction} 
          platformSettings={platformSettings}
          onUpdate={onUpdate}
        />
      );
    case 'direct_sale':
      return <DirectSaleOfferListItem offer={item as DirectSaleOffer} />;
    case 'seller':
      return <SellerListItem seller={item as SellerProfileInfo} onUpdate={onUpdate} />;
    case 'auctioneer':
      return <AuctioneerListItem auctioneer={item as AuctioneerProfileInfo} onUpdate={onUpdate} />;
    case 'user':
      return <UserListItem user={item as UserProfileWithPermissions} onUpdate={onUpdate} />;
    case 'asset':
      return <AssetListItem asset={item as Asset} onUpdate={onUpdate} />;
    default:
      return null;
  }
}
