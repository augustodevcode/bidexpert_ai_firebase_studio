// src/components/cards/direct-sale-offer-list-item.tsx
'use client';

import * as React from 'react';
import type { DirectSaleOffer } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Tag, Users, Clock, Star, TrendingUp, ListChecks, DollarSign, Edit } from 'lucide-react';
import { getAuctionStatusText, isValidImageUrl } from '@/lib/ui-helpers';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DirectSaleOfferListItemProps {
  offer: DirectSaleOffer;
}

export default function DirectSaleOfferListItem({ offer }: DirectSaleOfferListItemProps) {
  const displayLocation = offer.locationCity && offer.locationState ? `${offer.locationCity} - ${offer.locationState}` : offer.locationState || offer.locationCity || 'N/A';
  const mainImageUrl = isValidImageUrl(offer.imageUrl) ? offer.imageUrl! : `https://placehold.co/600x400.png?text=Oferta`;
  
  const getOfferTypeLabel = (type: string | undefined) => {
    switch(type) {
        case 'BUY_NOW': return 'Compra Imediata';
        case 'ACCEPTS_PROPOSALS': return 'Aceita Propostas';
        default: return 'Não especificado';
    }
  }

  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted">
          <Link href={`/direct-sales/${offer.id}`} className="block h-full w-full">
            <Image
              src={mainImageUrl}
              alt={offer.title}
              fill
              className="object-cover"
              data-ai-hint={offer.dataAiHint || 'imagem oferta lista'}
            />
          </Link>
        </div>

        <div className="flex flex-col flex-grow p-4">
          <div className="flex justify-between items-start mb-1.5">
            <div className="flex-grow min-w-0">
               <div className="flex items-center gap-2 mb-1">
                   <Badge 
                      className={`text-xs px-1.5 py-0.5 shadow-sm
                          ${offer.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'}
                      `}
                      >
                      {getAuctionStatusText(offer.status)}
                  </Badge>
                  <Badge variant="secondary">{getOfferTypeLabel(offer.offerType)}</Badge>
              </div>
              <Link href={`/direct-sales/${offer.id}`}>
                <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={offer.title}>
                  {offer.title}
                </h3>
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5 truncate" title={`Vendido por: ${offer.sellerName}`}>
                Vendido por: {offer.sellerName}
              </p>
            </div>
            {/* O EntityEditMenu pode ser adicionado aqui no futuro se necessário */}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
            <div className="flex items-center">
              <Tag className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              <span>{offer.category || 'Não especificada'}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              <span className="truncate">{displayLocation}</span>
            </div>
            <div className="flex items-center">
              <Eye className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              <span>{offer.views || 0} Visitas</span>
            </div>
             {offer.expiresAt && (
                <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                    <span>Expira em: {format(new Date(offer.expiresAt as string), 'dd/MM/yyyy')}</span>
                </div>
            )}
          </div>
          
          <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed">
            <div className="flex-shrink-0">
              <p className="text-xs text-muted-foreground">
                {offer.offerType === 'BUY_NOW' ? 'Preço Fixo' : 'Aberto a Propostas'}
              </p>
              {offer.price ? (
                <p className="text-2xl font-bold text-primary">
                  R$ {(offer.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              ) : (
                <p className="text-lg font-semibold text-primary">Consulte</p>
              )}
            </div>
            <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0">
              <Link href={`/direct-sales/${offer.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> Ver Oferta
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
