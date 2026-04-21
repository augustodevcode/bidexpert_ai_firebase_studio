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
import type { AuctionItem } from './cards/auction-lot-card-v2.types';
import AuctionLotCardV2 from './cards/auction-lot-card-v2';
import LotCard from './cards/lot-card';
import SellerCard from './cards/seller-card';
import AuctioneerCard from './cards/auctioneer-card';
import AssetCard from './cards/asset-card';
import UserCard from './cards/user-card';
import DirectSaleOfferCard from './cards/direct-sale-offer-card';

// Tipagem unificada para o item
type AnyItem = Auction | Lot | AuctionItem | SellerProfileInfo | AuctioneerProfileInfo | Asset | UserProfileWithPermissions | DirectSaleOffer;

interface BidExpertCardProps {
  item: AnyItem;
  type: 'auction' | 'lot' | 'seller' | 'auctioneer' | 'asset' | 'user' | 'direct_sale';
  platformSettings?: PlatformSettings | null;
  parentAuction?: Auction; // Opcional, para contexto (ex: um lote precisa saber sobre seu leilão)
  onUpdate?: () => void;
  showCountdown?: boolean;
}

function isPreparedLotCardItem(item: AnyItem): item is AuctionItem {
  return Boolean(
    item
    && typeof item === 'object'
    && 'pricing' in item
    && 'timeline' in item
    && 'stats' in item,
  );
}

export default function BidExpertCard({ item, type, platformSettings, parentAuction, onUpdate, showCountdown }: BidExpertCardProps) {
  switch (type) {
    case 'auction':
      return <AuctionCard auction={item as Auction} platformSettings={platformSettings ?? null} onUpdate={onUpdate} />;
    case 'lot':
      if (isPreparedLotCardItem(item)) {
        return <AuctionLotCardV2 item={item} />;
      }

      return <LotCard lot={item as Lot} auction={parentAuction} platformSettings={platformSettings ?? null} onUpdate={onUpdate} showCountdown={showCountdown} />;
    case 'seller':
      return <SellerCard seller={item as SellerProfileInfo} onUpdate={onUpdate} />;
    case 'auctioneer':
        return <AuctioneerCard auctioneer={item as AuctioneerProfileInfo} onUpdate={onUpdate} />;
    case 'asset':
        return <AssetCard asset={item as Asset} onUpdate={onUpdate} />;
    case 'user':
        return <UserCard user={item as UserProfileWithPermissions} onUpdate={onUpdate} />;
    case 'direct_sale':
        return <DirectSaleOfferCard offer={item as DirectSaleOffer} platformSettings={platformSettings!} onUpdate={onUpdate} />;
    default:
      // Fallback ou erro
      console.warn(`Tipo de card desconhecido: ${type}`);
      return null;
  }
}
