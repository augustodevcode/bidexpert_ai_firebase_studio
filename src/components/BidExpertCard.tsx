// src/components/BidExpertCard.tsx
/**
 * @fileoverview Componente de card unificado e reutilizável.
 * Atua como um "dispatcher" que renderiza o template de card apropriado
 * (leilão, lote, comitente, etc.) com base na prop `type`.
 */
'use client';

import * as React from 'react';
import type { Auction, Lot, SellerProfileInfo, AuctioneerProfileInfo, Asset, UserProfileWithPermissions, DirectSaleOffer, PlatformSettings } from '@/types';
import AuctionCard from './cards/auction-card';
import LotCard from './cards/lot-card';
import SellerCard from './cards/seller-card';
import AuctioneerCard from './cards/auctioneer-card';
import AssetCard from './cards/asset-card';
import UserCard from './cards/user-card';
import DirectSaleOfferCard from './cards/direct-sale-offer-card';

// Tipagem unificada para o item
type AnyItem = Auction | Lot | SellerProfileInfo | AuctioneerProfileInfo | Asset | UserProfileWithPermissions | DirectSaleOffer;

interface BidExpertCardProps {
  item: AnyItem;
  type: 'auction' | 'lot' | 'seller' | 'auctioneer' | 'asset' | 'user' | 'direct_sale';
  platformSettings: PlatformSettings;
  parentAuction?: Auction; // Opcional, para contexto (ex: um lote precisa saber sobre seu leilão)
  onUpdate?: () => void;
  showCountdown?: boolean;
}

export default function BidExpertCard({ item, type, platformSettings, parentAuction, onUpdate, showCountdown }: BidExpertCardProps) {
  switch (type) {
    case 'auction':
      return <AuctionCard auction={item as Auction} onUpdate={onUpdate} />;
    case 'lot':
      return <LotCard lot={item as Lot} auction={parentAuction} platformSettings={platformSettings} onUpdate={onUpdate} showCountdown={showCountdown} />;
    case 'seller':
      return <SellerCard seller={item as SellerProfileInfo} onUpdate={onUpdate} />;
    case 'auctioneer':
        return <AuctioneerCard auctioneer={item as AuctioneerProfileInfo} onUpdate={onUpdate} />;
    case 'asset':
        return <AssetCard asset={item as Asset} onUpdate={onUpdate} />;
    case 'user':
        return <UserCard user={item as UserProfileWithPermissions} onUpdate={onUpdate} />;
    case 'direct_sale':
        return <DirectSaleOfferCard offer={item as DirectSaleOffer} platformSettings={platformSettings} onUpdate={onUpdate} />;
    default:
      // Fallback ou erro
      console.warn(`Tipo de card desconhecido: ${type}`);
      return null;
  }
}
