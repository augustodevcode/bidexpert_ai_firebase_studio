// src/components/BidExpertCard.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings, DirectSaleOffer, SellerProfileInfo, AuctioneerProfileInfo, UserProfileWithPermissions, Asset } from '@/types';

// Importa os componentes de card específicos que agora servirão como templates internos
import AuctionCard from './cards/auction-card';
import LotCard from './cards/lot-card';
import DirectSaleOfferCard from './cards/direct-sale-offer-card';
import SellerCard from './cards/seller-card';
import AuctioneerCard from './cards/auctioneer-card';
import UserCard from './cards/user-card';
import AssetCard from './cards/asset-card';

// Tipo unificado para os itens que podem ser renderizados
type Item = Partial<Auction & Lot & DirectSaleOffer & SellerProfileInfo & AuctioneerProfileInfo & UserProfileWithPermissions & Asset>;

interface BidExpertCardProps {
  item: Item;
  type: 'auction' | 'lot' | 'direct_sale' | 'seller' | 'auctioneer' | 'user' | 'asset';
  platformSettings: PlatformSettings;
  parentAuction?: Auction;
  onUpdate?: () => void;
  showCountdown?: boolean;
}

/**
 * @fileoverview Componente de card unificado e reutilizável.
 * Este componente atua como um dispatcher, renderizando o tipo correto de card
 * com base na prop `type`. Ele é o ponto de entrada único para a exibição de
 * cards de diferentes entidades em toda a plataforma.
 */
export default function BidExpertCard({ item, type, platformSettings, parentAuction, onUpdate, showCountdown }: BidExpertCardProps) {
  
  // Utiliza um switch para determinar qual componente de card específico renderizar.
  // Cada componente específico foi mantido em seu próprio arquivo para organização,
  // mas eles só são chamados através deste componente unificado.

  switch (type) {
    case 'auction':
      return <AuctionCard auction={item as Auction} onUpdate={onUpdate} />;
    case 'lot':
      return (
        <LotCard 
          lot={item as Lot} 
          auction={parentAuction} 
          platformSettings={platformSettings}
          onUpdate={onUpdate}
          showCountdown={showCountdown}
        />
      );
    case 'direct_sale':
      return <DirectSaleOfferCard offer={item as DirectSaleOffer} platformSettings={platformSettings} onUpdate={onUpdate} />;
    case 'seller':
      return <SellerCard seller={item as SellerProfileInfo} onUpdate={onUpdate} />;
    case 'auctioneer':
      return <AuctioneerCard auctioneer={item as AuctioneerProfileInfo} onUpdate={onUpdate} />;
    case 'user':
      return <UserCard user={item as UserProfileWithPermissions} onUpdate={onUpdate} />;
    case 'asset':
      return <AssetCard asset={item as any} onUpdate={onUpdate} />;
    default:
      return null;
  }
}
