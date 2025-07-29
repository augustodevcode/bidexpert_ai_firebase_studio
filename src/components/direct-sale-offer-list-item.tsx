// src/components/direct-sale-offer-list-item.tsx
'use client';

import type { DirectSaleOffer } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Tag, MapPin, UserCircle, DollarSign, ShoppingCart, Edit } from 'lucide-react';
import { getLotStatusColor, getAuctionStatusText } from '@/lib/ui-helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DirectSaleOfferListItemProps {
  offer: DirectSaleOffer;
}

export default function DirectSaleOfferListItem({ offer }: DirectSaleOfferListItemProps) {
  const displayLocation = offer.locationCity && offer.locationState
    ? `${offer.locationCity} - ${offer.locationState}`
    : offer.locationState || offer.locationCity || 'Não informado';

  const sellerInitial = offer.sellerName ? offer.sellerName.charAt(0).toUpperCase() : '?';

  return (
    <TooltipProvider>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image Column */}
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted">
            <Link href={`/direct-sales/${offer.id}`} className="block h-full w-full">
              <Image
                src={offer.imageUrl || 'https://placehold.co/600x400.png'}
                alt={offer.title}
                fill
                className="object-cover"
                data-ai-hint={offer.dataAiHint || 'imagem oferta direta lista'}
              />
            </Link>
            {offer.sellerLogoUrl && (
              <div className="absolute bottom-1 right-1 bg-background/80 p-1 rounded-sm shadow max-w-[80px] max-h-[40px] overflow-hidden">
                <Image
                  src={offer.sellerLogoUrl}
                  alt={offer.sellerName}
                  width={80}
                  height={40}
                  className="object-contain h-full w-full"
                  data-ai-hint={offer.dataAiHintSellerLogo || "logo vendedor pequeno"}
                />
              </div>
            )}
          </div>

          {/* Content Column */}
          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs px-1.5 py-0.5 ${getLotStatusColor(offer.status)}`}>
                        {getAuctionStatusText(offer.status)}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                        {offer.offerType === 'BUY_NOW' ? 'Comprar Já' : 'Aceita Proposta'}
                    </Badge>
                </div>
                <Link href={`/direct-sales/${offer.id}`}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={offer.title}>
                    {offer.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={`ID: ${offer.id}`}>
                  ID da Oferta: {offer.id}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
              <div className="flex items-center" title={`Vendedor: ${offer.sellerName}`}>
                <UserCircle className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">Vendedor: {offer.sellerName}</span>
              </div>
              <div className="flex items-center">
                <Tag className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span>{offer.category}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">{displayLocation}</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span>{offer.views || 0} Visualizações</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{offer.description}</p>

            <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed">
              <div className="flex-shrink-0">
                {offer.offerType === 'BUY_NOW' && offer.price !== undefined ? (
                    <>
                        <p className="text-xs text-muted-foreground">Preço Fixo</p>
                        <p className={`text-xl font-bold ${offer.status !== 'ACTIVE' ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                        R$ {offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </>
                ) : offer.offerType === 'ACCEPTS_PROPOSALS' ? (
                    <>
                        <p className="text-xs text-muted-foreground">Aceita Propostas</p>
                        {offer.minimumOfferPrice ? (
                            <p className={`text-lg font-bold ${offer.status !== 'ACTIVE' ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                            A partir de R$ {offer.minimumOfferPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        ): (
                             <p className="text-lg font-bold text-primary">Envie sua proposta</p>
                        )}
                    </>
                ) : (
                    <p className="text-lg font-bold text-muted-foreground">Preço sob consulta</p>
                )}
                
              </div>
              <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0">
                <Link href={`/direct-sales/${offer.id}`}>
                    {offer.offerType === 'BUY_NOW' ? <ShoppingCart className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                    {offer.offerType === 'BUY_NOW' ? 'Comprar Agora' : 'Ver e Propor'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
