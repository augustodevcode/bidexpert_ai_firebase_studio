// src/components/cards/lot-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Tag, Gavel } from 'lucide-react';
import { isPast, differenceInDays } from 'date-fns';
import { getAuctionStatusText, isValidImageUrl, getAuctionTypeDisplayData } from '@/lib/ui-helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BidExpertAuctionStagesTimeline from '@/components/auction/BidExpertAuctionStagesTimeline';
import EntityEditMenu from '../entity-edit-menu';
import ConsignorLogoBadge from '../consignor-logo-badge';
import { cn } from '@/lib/utils';

interface LotListItemProps {
  lot: Lot;
  auction?: Auction;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
  density?: 'default' | 'compact';
}

export default function LotListItem({ lot, auction, platformSettings, onUpdate, density = 'default' }: LotListItemProps) {
  const auctionTypeDisplay = getAuctionTypeDisplayData(auction?.auctionType);
  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'N/A';
  const sellerName = auction?.seller?.name;
  const sellerLogoUrl = isValidImageUrl(auction?.seller?.logoUrl) ? auction.seller?.logoUrl : undefined;
  const sellerSlug = auction?.seller?.slug;
  const consignorInitial = sellerName ? sellerName.charAt(0).toUpperCase() : 'C';

  const mentalTriggers = React.useMemo(() => {
    const triggers: string[] = [];
    const now = new Date();

    if (lot.endDate) {
        const endDate = new Date(lot.endDate as string);
        if (!isPast(endDate)) {
            const daysDiff = differenceInDays(endDate, now);
            if (daysDiff === 0) triggers.push('ENCERRA HOJE');
            else if (daysDiff === 1) triggers.push('ENCERRA AMANHÃ');
        }
    }
    
    if ((lot.bidsCount || 0) > 10) { 
        triggers.push('LANCE QUENTE');
    }
    
    if (lot.isFeatured) {
        triggers.push('DESTAQUE');
    }
    
    return Array.from(new Set(triggers));
  }, [lot.endDate, lot.bidsCount, lot.isFeatured]);
  
  const mainImageUrl = isValidImageUrl(lot.imageUrl) ? lot.imageUrl! : `https://picsum.photos/seed/${lot.id}/600/400`;

  const IconComponent = auctionTypeDisplay?.icon;
  const isCompact = density === 'compact';
  const badgeBaseClass = cn('px-1.5 py-0.5 text-xs shadow-sm', isCompact && 'px-1 text-[11px]');

  return (
    <TooltipProvider>
      <Card
        data-density={density}
        className={cn(
          'w-full shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl group overflow-hidden border border-border/30 bg-card/90',
          isCompact && 'shadow-none border-border/40 bg-surface/80 rounded-xl'
        )}
      >
        <div className={cn('flex flex-col md:flex-row', isCompact && 'flex-row gap-3')}>
          <div
            className={cn(
              'md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted',
              isCompact && 'w-[120px] h-[110px] aspect-square rounded-xl overflow-hidden'
            )}
          >
            <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`} className="block h-full w-full">
              <Image
                src={mainImageUrl}
                alt={lot.title}
                fill
                className="object-cover"
                data-ai-hint={lot.dataAiHint || 'imagem lote lista'}
              />
            </Link>
            <ConsignorLogoBadge
              href={sellerSlug ? `/sellers/${sellerSlug}` : undefined}
              logoUrl={sellerLogoUrl}
              fallbackInitial={consignorInitial}
              name={sellerName}
              dataAiHint={auction?.seller?.dataAiHintLogo || 'logo comitente pequeno'}
              anchorClassName="absolute top-2 left-2"
            />
          </div>

          <div className={cn('flex flex-col flex-grow p-4', isCompact && 'p-3 text-sm gap-1')}>
            <div className={cn('flex justify-between items-start', isCompact && 'gap-2')}>
              <div className="flex-grow min-w-0">
                 <div className="flex flex-wrap items-center gap-2 mb-1">
                     <Badge 
                        className={cn(
                          badgeBaseClass,
                          lot.status === 'ABERTO_PARA_LANCES' ? 'bg-green-600 text-white' : '',
                          lot.status === 'EM_BREVE' ? 'bg-blue-500 text-white' : '',
                          ['ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'CANCELADO'].includes(lot.status) ? 'bg-gray-500 text-white' : ''
                        )}
                        >
                        {getAuctionStatusText(lot.status)}
                    </Badge>
                     {mentalTriggers.map(trigger => (
                        <Badge key={trigger} variant="secondary" className={cn('text-xs px-1 py-0.5 bg-amber-100 text-amber-700 border-amber-300', isCompact && 'text-[11px]') }>
                           {trigger}
                        </Badge>
                     ))}
                </div>
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`}>
                  <h3 className={cn('text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2', isCompact && 'text-sm line-clamp-2')}
                    title={lot.title}
                  >
                    Lote {lot.number} - {lot.title}
                  </h3>
                </Link>
                <p className={cn('text-xs text-muted-foreground mt-0.5 truncate', isCompact && 'text-[11px]')}
                  title={`Leilão: ${auction?.title}`}
                >
                  Leilão: {auction?.title}
                </p>
              </div>
              {!isCompact && (
                <EntityEditMenu 
                  entityType="lot" 
                  entityId={lot.id.toString()}
                  publicId={lot.publicId!} 
                  currentTitle={lot.title} 
                  isFeatured={lot.isFeatured || false}
                  onUpdate={onUpdate}
                />
              )}
            </div>
            
            <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2', isCompact && 'grid-cols-1 gap-y-1 text-[11px]')}>
              {IconComponent && (
                <div className="flex items-center">
                    <IconComponent className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                    <span>{auctionTypeDisplay?.label}</span>
                </div>
              )}
              <div className="flex items-center">
                <Tag className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span>{lot.type || 'Não especificada'}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">{displayLocation}</span>
              </div>
              {!isCompact && (
                <div className="flex items-center">
                  <Gavel className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                  <span className="truncate">{lot.bidsCount || 0} Lances</span>
                </div>
              )}
            </div>

            {!isCompact && auction?.auctionStages && auction.auctionStages.length > 0 && (
                <div className="my-2 p-3 bg-muted/30 rounded-md">
                    <BidExpertAuctionStagesTimeline auctionOverallStartDate={new Date(auction.auctionDate as string)} stages={auction.auctionStages} variant="compact" />
                </div>
            )}
            
            <div className={cn('mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed', isCompact && 'border-dashed/50 pt-2')}
            >
              <div className="flex-shrink-0">
                <p className={cn('text-xs text-muted-foreground', isCompact && 'text-[11px]')}>
                  {lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}
                </p>
                <p className={cn('text-2xl font-bold text-primary', isCompact && 'text-xl')}>
                  R$ {(lot.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant={isCompact ? 'mapGhost' : 'default'}
                className="w-full md:w-auto mt-2 md:mt-0"
              >
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> Ver Lote
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
