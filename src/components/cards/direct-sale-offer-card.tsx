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
    <Card data-ai-id={`direct-sale-card-${offer.id}`} className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group">
      <div className="relative">
        <Link href={offerDetailUrl} className="block">
          <div className="aspect-video relative bg-muted">
            <Image
              src={mainImageUrl}
              alt={offer.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={offer.dataAiHint || 'imagem oferta'}
            />
          </div>
        </Link>
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10">
          <Badge className={`text-xs px-2 py-1 ${offer.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-500'} text-white`}>
            {getAuctionStatusText(offer.status)}
          </Badge>
           <Badge variant="secondary" className="text-xs">
            {getOfferTypeLabel(offer.offerType)}
           </Badge>
        </div>
      </div>
      <CardContent className="p-3 flex-grow space-y-1.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Tag className="h-3 w-3" />
          <span>{offer.category}</span>
        </div>
        <Link href={offerDetailUrl}>
          <h3 data-ai-id="direct-sale-card-title" className="text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2">
            {offer.title}
          </h3>
        </Link>
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mr-1" />
          <span>{displayLocation}</span>
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t flex-col items-start space-y-2">
        <div className="w-full">
            <p className="text-xs text-muted-foreground">
                {offer.offerType === 'BUY_NOW' ? 'Preço Fixo' : 'Aberto a Propostas'}
            </p>
            {offer.price ? (
            <p className="text-xl font-bold text-primary">
                R$ {offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            ) : (
                <p className="text-lg font-semibold text-primary">Consulte</p>
            )}
        </div>
        <Button asChild size="sm" className="w-full">
            <Link href={offerDetailUrl}>
                <Eye className="mr-2 h-4 w-4" /> Ver Oferta
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
