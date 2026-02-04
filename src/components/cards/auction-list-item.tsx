// src/components/cards/auction-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Tag, MapPin, ListChecks, Gavel as AuctionTypeIcon, Users } from 'lucide-react';
import { isPast, differenceInDays } from 'date-fns';
import { getAuctionStatusText, isValidImageUrl, getAuctionTypeDisplayData } from '@/lib/ui-helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BidExpertAuctionStagesTimeline from '@/components/auction/BidExpertAuctionStagesTimeline';
import EntityEditMenu from '../entity-edit-menu';
import ConsignorLogoBadge from '../consignor-logo-badge';
import { cn } from '@/lib/utils';


interface AuctionListItemProps {
  auction: Auction;
  onUpdate?: () => void;
  density?: 'default' | 'compact' | 'map';
}

export default function AuctionListItem({ auction, onUpdate, density = 'default' }: AuctionListItemProps) {
  const auctionTypeDisplay = getAuctionTypeDisplayData(auction.auctionType);
  const AuctionTypeIcon = auctionTypeDisplay?.icon;

  const displayLocation = auction.city && auction.state ? `${auction.city} - ${auction.state}` : auction.state || auction.city || 'N/A';
  const sellerName = auction.seller?.name;


  const mentalTriggers = React.useMemo(() => {
    const triggers: string[] = [];
    const now = new Date();

    if (auction.endDate) {
        const endDate = new Date(auction.endDate as string);
        if (!isPast(endDate)) {
            const daysDiff = differenceInDays(endDate, now);
            if (daysDiff === 0) triggers.push('ENCERRA HOJE');
            else if (daysDiff === 1) triggers.push('ENCERRA AMANHÃ');
        }
    }
    
    if ((auction.totalHabilitatedUsers || 0) > 100) { 
        triggers.push('ALTA DEMANDA');
    }
    
    if (auction.isFeaturedOnMarketplace) {
        triggers.push('DESTAQUE');
    }

    if (auction.additionalTriggers) {
        triggers.push(...auction.additionalTriggers);
    }
    
    return Array.from(new Set(triggers));
  }, [auction.endDate, auction.totalHabilitatedUsers, auction.isFeaturedOnMarketplace, auction.additionalTriggers]);
  
  const mainImageUrl = isValidImageUrl(auction.imageUrl) ? auction.imageUrl! : `https://placehold.co/600x400.png?text=Leilao`;
  const sellerLogoUrl = isValidImageUrl(auction.seller?.logoUrl) ? auction.seller?.logoUrl : undefined;
  const sellerSlug = auction.seller?.slug || auction.seller?.publicId || auction.seller?.id;
  const consignorInitial = sellerName ? sellerName.charAt(0).toUpperCase() : 'C';

  const isCompact = density === 'compact';
  const isMap = density === 'map';
  const auctionStartDate = auction.auctionDate ? new Date(auction.auctionDate as string) : undefined;

  return (
    <TooltipProvider>
      <Card
        data-density={density}
        className={cn(
          'w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl group overflow-hidden border border-border/30 bg-card/90',
          isCompact && 'shadow-none border-border/40 bg-surface/80 rounded-xl'
        )}
      >
        <div className={cn('flex flex-col md:flex-row', isCompact && 'flex-row gap-3')}>
          <div
            className={cn(
              'md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted',
              isCompact && 'w-[120px] h-[110px] aspect-square rounded-xl overflow-hidden',
              isMap && 'md:w-2/5 lg:w-[38%] md:aspect-[5/3]'
            )}
          >
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="block h-full w-full">
              <Image
                src={mainImageUrl!}
                alt={auction.title}
                fill
                className="object-cover"
                data-ai-hint={auction.dataAiHint || 'imagem leilao lista'}
              />
            </Link>
            <ConsignorLogoBadge
              href={sellerSlug ? `/sellers/${sellerSlug}` : undefined}
              logoUrl={sellerLogoUrl}
              fallbackInitial={consignorInitial}
              name={sellerName}
              dataAiHint={auction.seller?.dataAiHintLogo || 'logo comitente pequeno'}
              anchorClassName="absolute top-2 left-2"
            />
          </div>

          {/* Content Column */}
          <div className={cn('flex flex-col flex-grow p-4', isCompact && 'p-3 text-sm gap-1')}>
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                 <div className="flex flex-wrap items-center gap-2 mb-1">
                     <Badge 
                        className={cn(
                          'text-xs px-1.5 py-0.5 shadow-sm',
                          isCompact && 'text-[11px] px-1 py-0.5',
                          (auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO') && 'bg-green-600 text-white',
                          auction.status === 'EM_BREVE' && 'bg-blue-500 text-white',
                          ['ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO', 'RASCUNHO', 'EM_PREPARACAO'].includes(auction.status) && 'bg-gray-500 text-white'
                        )}
                        >
                        {getAuctionStatusText(auction.status)}
                    </Badge>
                     {mentalTriggers.map(trigger => (
                        <Badge key={trigger} variant="secondary" className={cn('text-xs px-1 py-0.5 bg-amber-100 text-amber-700 border-amber-300', isCompact && 'text-[11px]')}>
                           {trigger}
                        </Badge>
                     ))}
                </div>
                <Link href={`/auctions/${auction.publicId || auction.id}`}>
                  <h3 className={cn('text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2', isCompact && 'text-sm')} title={auction.title}>
                    {auction.title}
                  </h3>
                </Link>
                <p className={cn('text-xs text-muted-foreground mt-0.5 truncate', isCompact && 'text-[11px]')} title={`ID: ${auction.publicId || auction.id}`}>
                  ID: {auction.publicId || auction.id}
                </p>
              </div>
              {!isCompact && (
                <EntityEditMenu 
                  entityType="auction" 
                  entityId={auction.id}
                  publicId={auction.publicId} 
                  currentTitle={auction.title} 
                  isFeatured={auction.isFeaturedOnMarketplace || false}
                  onUpdate={onUpdate}
                />
              )}
            </div>
            
            <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2', isCompact && 'grid-cols-1 text-[11px]')}>
                {AuctionTypeIcon && (
                  <div className="flex items-center">
                    <AuctionTypeIcon className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                    <span>{auctionTypeDisplay?.label}</span>
                 </div>
                )}
              <div className="flex items-center">
                <Tag className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span>{auction.category?.name || 'Não especificada'}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">{displayLocation}</span>
              </div>
              {!isCompact && (
                <>
                  <div className="flex items-center">
                    <Eye className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                    <span>{auction.visits || 0} Visitas</span>
                  </div>
                  <div className="flex items-center">
                    <ListChecks className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                    <span className="truncate">{auction.totalLots || 0} Lotes</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                    <span className="truncate">{auction.totalHabilitatedUsers || 0} Habilitados</span>
                  </div>
                </>
              )}
            </div>

            <div
              className={cn(
                'my-2 rounded-md',
                isCompact ? 'p-2 bg-muted/20' : 'p-3 bg-muted/30'
              )}
              data-ai-id="auction-list-item-timeline"
            >
              <BidExpertAuctionStagesTimeline
                auction={auction}
                stages={auction.auctionStages || []}
                auctionOverallStartDate={auctionStartDate}
                variant={isCompact ? 'compact' : 'extended'}
              />
            </div>
            
            <div className={cn('mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed', isCompact && 'text-[11px]')}>
              <div className="flex-shrink-0">
                <p className={cn('text-xs text-muted-foreground', isCompact && 'text-[11px]')}>
                  {auction.auctionType === 'TOMADA_DE_PRECOS' ? 'Valor de Referência' : 'A partir de'}
                </p>
                <p className={cn('text-2xl font-bold text-primary', isCompact && 'text-xl')}>
                  R$ {(auction.initialOffer || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant={isCompact ? 'mapGhost' : 'default'}
                className="w-full md:w-auto mt-2 md:mt-0"
              >
                <Link href={`/auctions/${auction.publicId || auction.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> Ver Leilão ({auction.totalLots})
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
