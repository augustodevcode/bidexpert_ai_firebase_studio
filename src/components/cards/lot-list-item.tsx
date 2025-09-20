
'use client';

import * as React from 'react';
import type { Auction, Lot, PlatformSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Tag, Users, Clock, Star, TrendingUp, ListChecks } from 'lucide-react';
import { isPast, differenceInDays } from 'date-fns';
import { getAuctionStatusText, isValidImageUrl, getAuctionTypeDisplayData, getActiveStage, getLotPriceForStage } from '@/lib/ui-helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EntityEditMenu from '@/components/entity-edit-menu';

interface LotListItemProps {
  lot: Lot;
  auction?: Auction;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

export default function LotListItem({ lot, auction, platformSettings, onUpdate }: LotListItemProps) {
    
  const activeStage = getActiveStage(auction?.auctionStages);
  const activeLotPrices = getLotPriceForStage(lot, activeStage?.id);

  const auctionTypeDisplay = getAuctionTypeDisplayData(auction?.auctionType);
  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'N/A';
  const sellerName = lot.sellerName || auction?.seller?.name;

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

    if ((lot.bidsCount || 0) > (platformSettings?.mentalTriggerSettings?.hotBidThreshold || 10)) {
      triggers.push('LANCE QUENTE');
    }

    if (lot.isFeatured) {
      triggers.push('DESTAQUE');
    }
    
    if (lot.additionalTriggers) {
      triggers.push(...lot.additionalTriggers);
    }
    
    return Array.from(new Set(triggers));
  }, [lot, platformSettings]);

  const mainImageUrl = isValidImageUrl(lot.imageUrl) ? lot.imageUrl : `https://placehold.co/600x400.png?text=Lote`;
  const sellerLogoUrl = isValidImageUrl(auction?.seller?.logoUrl) ? auction.seller?.logoUrl : undefined;

  return (
    <TooltipProvider>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted">
            <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`} className="block h-full w-full">
              <Image
                src={mainImageUrl!}
                alt={lot.title}
                fill
                className="object-cover"
                data-ai-hint={lot.dataAiHint || 'imagem lote lista'}
              />
            </Link>
            {sellerLogoUrl && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={auction?.seller?.slug ? `/sellers/${auction.seller.slug}` : '#'} onClick={(e) => e.stopPropagation()} className="absolute bottom-1 right-1 z-10">
                    <Avatar className="h-10 w-10 border-2 bg-background border-border shadow-md">
                      <AvatarImage src={sellerLogoUrl} alt={sellerName || "Logo Comitente"} data-ai-hint={auction?.seller?.dataAiHintLogo || 'logo comitente pequeno'} />
                      <AvatarFallback>{sellerName ? sellerName.charAt(0) : 'C'}</AvatarFallback>
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Comitente: {sellerName}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                 <div className="flex items-center gap-2 mb-1">
                     <Badge 
                        className={`text-xs px-1.5 py-0.5 shadow-sm
                            ${lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'ABERTO' ? 'bg-green-600 text-white' : ''}
                            ${lot.status === 'EM_BREVE' ? 'bg-blue-500 text-white' : ''}
                            ${['ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'CANCELADO', 'RASCUNHO'].includes(lot.status) ? 'bg-gray-500 text-white' : ''}
                        `}
                        >
                        {getAuctionStatusText(lot.status)}
                    </Badge>
                     {mentalTriggers.map(trigger => (
                        <Badge key={trigger} variant="secondary" className="text-xs px-1 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                           {trigger}
                        </Badge>
                     ))}
                </div>
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={lot.title}>
                    Lote {lot.number}: {lot.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={`Leilão: ${auction?.title || lot.auctionName}`}>
                  Leilão: {auction?.title || lot.auctionName}
                </p>
              </div>
              <EntityEditMenu 
                 entityType="lot" 
                 entityId={lot.id}
                 publicId={lot.publicId!} 
                 currentTitle={lot.title} 
                 isFeatured={lot.isFeatured || false}
                 onUpdate={onUpdate}
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
              {auctionTypeDisplay?.iconName && (
                <div className="flex items-center">
                  <EntityEditMenu entityType='lot' entityId={lot.id} publicId={lot.publicId!} currentTitle={lot.title} isFeatured={lot.isFeatured || false} onUpdate={onUpdate} />
                  <span>{auctionTypeDisplay.label}</span>
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
              <div className="flex items-center">
                <Eye className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span>{lot.views || 0} Visitas</span>
              </div>
               <div className="flex items-center">
                <ListChecks className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">{lot.bens?.length || 1} Iten(s)</span>
              </div>
               <div className="flex items-center">
                <Users className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">{lot.bidsCount || 0} Lances</span>
              </div>
            </div>

            {auction?.auctionStages && auction.auctionStages.length > 0 && (
                <div className="my-2 p-3 bg-muted/30 rounded-md">
                    <AuctionStagesTimeline auctionOverallStartDate={new Date(auction.auctionDate as string)} stages={auction.auctionStages} />
                </div>
            )}
            
            <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed">
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground">
                  {lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}
                </p>
                <p className="text-2xl font-bold text-primary">
                  R$ {(activeLotPrices?.initialBid ?? lot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0">
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> Ver Detalhes do Lote
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}

