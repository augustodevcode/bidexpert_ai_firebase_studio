// src/components/cards/auction-list-item.tsx
'use client';

import * as React from 'react';
import type { Auction } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CalendarDays, Tag, MapPin, ListChecks, Gavel as AuctionTypeIcon, FileText as TomadaPrecosIcon, Users, Clock, Star, TrendingUp, Pencil } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText, isValidImageUrl } from '@/lib/ui-helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BidExpertAuctionStagesTimeline from '../auction/BidExpertAuctionStagesTimeline'; // Corrigido o import
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import EntityEditMenu from '../entity-edit-menu';


interface AuctionListItemProps {
  auction: Auction;
  onUpdate?: () => void;
}

export default function AuctionListItem({ auction, onUpdate }: AuctionListItemProps) {
  const auctionTypeDisplay = auction.auctionType === 'TOMADA_DE_PRECOS' 
    ? { label: 'Tomada de Preços', icon: <TomadaPrecosIcon className="h-3.5 w-3.5" /> }
    : { label: auction.auctionType || 'Leilão', icon: <AuctionTypeIcon className="h-3.5 w-3.5" /> };

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
  const sellerSlug = auction.seller?.slug;
  const consignorInitial = sellerName ? sellerName.charAt(0).toUpperCase() : 'C';

  return (
    <TooltipProvider>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image Column */}
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted">
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="block h-full w-full">
              <Image
                src={mainImageUrl!}
                alt={auction.title}
                fill
                className="object-cover"
                data-ai-hint={auction.dataAiHint || 'imagem leilao lista'}
              />
            </Link>
             {sellerLogoUrl && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href={sellerSlug ? `/sellers/${sellerSlug}` : '#'} onClick={(e) => e.stopPropagation()} className="absolute bottom-1 right-1 z-10">
                            <Avatar className="h-10 w-10 border-2 bg-background border-border shadow-md">
                                <AvatarImage src={sellerLogoUrl} alt={sellerName || "Logo Comitente"} data-ai-hint={auction.seller?.dataAiHintLogo || 'logo comitente pequeno'} />
                                <AvatarFallback>{consignorInitial}</AvatarFallback>
                            </Avatar>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Comitente: {sellerName}</p>
                    </TooltipContent>
                </Tooltip>
            )}
          </div>

          {/* Content Column */}
          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                 <div className="flex items-center gap-2 mb-1">
                     <Badge 
                        className={`text-xs px-1.5 py-0.5 shadow-sm
                            ${auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO' ? 'bg-green-600 text-white' : ''}
                            ${auction.status === 'EM_BREVE' ? 'bg-blue-500 text-white' : ''}
                            ${auction.status === 'ENCERRADO' || auction.status === 'FINALIZADO' || auction.status === 'CANCELADO' || auction.status === 'SUSPENSO' || auction.status === 'RASCUNHO' || auction.status === 'EM_PREPARACAO' ? 'bg-gray-500 text-white' : ''}
                        `}
                        >
                        {getAuctionStatusText(auction.status)}
                    </Badge>
                     {mentalTriggers.map(trigger => (
                        <Badge key={trigger} variant="secondary" className="text-xs px-1 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                           {trigger}
                        </Badge>
                     ))}
                </div>
                <Link href={`/auctions/${auction.publicId || auction.id}`}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={auction.title}>
                    {auction.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={`ID: ${auction.publicId || auction.id}`}>
                  ID: {auction.publicId || auction.id}
                </p>
              </div>
              <EntityEditMenu 
                 entityType="auction" 
                 entityId={auction.id}
                 publicId={auction.publicId} 
                 currentTitle={auction.title} 
                 isFeatured={auction.isFeaturedOnMarketplace || false}
                 onUpdate={onUpdate}
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
              <div className="flex items-center">
                {auctionTypeDisplay.icon && React.cloneElement(auctionTypeDisplay.icon, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" })}
                <span>{auctionTypeDisplay.label}</span>
              </div>
              <div className="flex items-center">
                <Tag className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span>{auction.category?.name || 'Não especificada'}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">{displayLocation}</span>
              </div>
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
            </div>

            {auction.auctionStages && auction.auctionStages.length > 0 && (
                <div className="my-2 p-3 bg-muted/30 rounded-md">
                    <BidExpertAuctionStagesTimeline auctionOverallStartDate={new Date(auction.auctionDate as string)} stages={auction.auctionStages} />
                </div>
            )}
            
            <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed">
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground">
                  {auction.auctionType === 'TOMADA_DE_PRECOS' ? 'Valor de Referência' : 'A partir de'}
                </p>
                <p className="text-2xl font-bold text-primary">
                  R$ {(auction.initialOffer || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0">
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
