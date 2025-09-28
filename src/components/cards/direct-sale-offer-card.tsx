// src/components/cards/direct-sale-offer-card.tsx
'use client';

import * as React from 'react';
import type { DirectSaleOffer, PlatformSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Tag, Edit, ShoppingCart } from 'lucide-react';
import { getAuctionStatusText, isValidImageUrl } from '@/lib/ui-helpers';
import EntityEditMenu from '../entity-edit-menu';

interface DirectSaleOfferCardProps {
  offer: DirectSaleOffer;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

export default function DirectSaleOfferCard({ offer, platformSettings, onUpdate }: DirectSaleOfferCardProps) {
  const offerDetailUrl = `/direct-sales/${offer.id}`;
  const displayLocation = offer.locationCity && offer.locationState ? `${offer.locationCity} - ${offer.locationState}` : offer.locationState || offer.locationCity || 'Não informado';
  const mainImageUrl = isValidImageUrl(offer.imageUrl) ? offer.imageUrl! : 'https://placehold.co/600x400.png';

  const getOfferTypeLabel = (type: string | undefined) => {
    switch(type) {
        case 'BUY_NOW': return 'Compra Imediata';
        case 'ACCEPTS_PROPOSALS': return 'Aceita Propostas';
        default: return 'Não especificado';
    }
  }

  return (
    <Card data-ai-id={`direct-sale-card-${offer.id}`} className="card-direct-sale">
      <div className="container-direct-sale-image">
        <Link href={offerDetailUrl} className="link-direct-sale-image">
          <div className="wrapper-direct-sale-image">
            <Image
              src={mainImageUrl}
              alt={offer.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="img-direct-sale"
              data-ai-hint={offer.dataAiHint || 'imagem oferta'}
            />
          </div>
        </Link>
        <div className="container-direct-sale-badges">
          <Badge className={`badge-direct-sale-status ${offer.status === 'ACTIVE' ? 'is-active' : 'is-inactive'}`}>
            {getAuctionStatusText(offer.status)}
          </Badge>
           <Badge variant="secondary" className="badge-direct-sale-type">
            {getOfferTypeLabel(offer.offerType)}
           </Badge>
        </div>
      </div>
      <CardContent className="card-content-direct-sale">
        <div className="container-direct-sale-category">
          <Tag className="icon-category" />
          <span className="text-category">{offer.category}</span>
        </div>
        <Link href={offerDetailUrl} className="link-direct-sale-title">
          <h3 data-ai-id="direct-sale-card-title" className="title-direct-sale-card">
            {offer.title}
          </h3>
        </Link>
        <div className="container-direct-sale-location">
          <MapPin className="icon-location" />
          <span className="text-location">{displayLocation}</span>
        </div>
      </CardContent>
      <CardFooter className="card-footer-direct-sale">
        <div className="container-direct-sale-price">
            <p className="label-direct-sale-price">
                {offer.offerType === 'BUY_NOW' ? 'Preço Fixo' : 'Aberto a Propostas'}
            </p>
            {offer.price ? (
            <p className="text-direct-sale-price">
                R$ {offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            ) : (
                <p className="text-direct-sale-price is-consult">Consulte</p>
            )}
        </div>
        <Button asChild size="sm" className="btn-view-offer">
            <Link href={offerDetailUrl}>
                <Eye className="icon-view-offer" /> Ver Oferta
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
