// src/components/cards/auction-card.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auction } from '@/types';
import { Eye, Clock, Users, Wifi, ListChecks } from 'lucide-react';
import { isValidImageUrl, getAuctionStatusText, getAuctionTypeDisplayData } from '@/lib/ui-helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntityEditMenu from '../entity-edit-menu';
import BidExpertAuctionStagesTimeline from '@/components/auction/BidExpertAuctionStagesTimeline';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import LotCountdown from '../lot-countdown';
import { getEffectiveLotEndDate } from '@/lib/ui-helpers';


interface AuctionCardProps {
  auction: Auction;
  onUpdate?: () => void;
}

export default function AuctionCard({ auction, onUpdate }: AuctionCardProps) {
  const mainImageUrl = isValidImageUrl(auction.imageUrl) ? auction.imageUrl! : `https://picsum.photos/seed/${auction.id}/600/400`;
  const sellerLogoUrl = isValidImageUrl(auction.seller?.logoUrl) ? auction.seller?.logoUrl : undefined;
  const sellerName = auction.seller?.name;
  const auctionTypeDisplay = getAuctionTypeDisplayData(auction.auctionType);
  const IconComponent = auctionTypeDisplay?.icon;

  const { effectiveLotEndDate: auctionEndDate } = getEffectiveLotEndDate(auction.lots?.[0], auction);
  
  const getAuctioneerInitial = () => {
    const name = auction.seller?.name;
    if (name && typeof name === 'string') {
      return name.charAt(0).toUpperCase();
    }
    return 'C';
  };
  
  const consignorInitial = getAuctioneerInitial();

  return (
    <TooltipProvider>
        <div className="flex flex-col items-stretch justify-start rounded-xl shadow-lg bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-2xl overflow-hidden group h-full">
            <div className="relative">
                <Link href={`/auctions/${auction.publicId || auction.id}`}>
                    <div className="relative w-full h-40">
                         <Image alt={auction.title || 'Auction item'} className="w-full h-full object-cover" src={mainImageUrl} fill data-ai-hint="imagem leilao" />
                    </div>
                </Link>
                <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                    {getAuctionStatusText(auction.status)}
                </span>
                <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link className="flex items-center gap-2 bg-white dark:bg-slate-700 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-shadow" href={auction.seller?.slug ? `/sellers/${auction.seller.slug}` : '#'}>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={sellerLogoUrl} alt={sellerName || "Logo Comitente"} data-ai-hint={auction.seller?.dataAiHintLogo || 'logo comitente'} />
                                <AvatarFallback>{consignorInitial}</AvatarFallback>
                            </Avatar>
                            <div className="pr-2">
                                <p className="text-xs font-medium text-text-light dark:text-text-dark">Comitente</p>
                                <p className="text-sm font-bold text-primary dark:text-secondary">#{auction.seller?.publicId || auction.sellerId?.substring(0,6)}</p>
                            </div>
                        </Link>
                      </TooltipTrigger>
                       <TooltipContent>
                           <p>Comitente: {sellerName}</p>
                       </TooltipContent>
                    </Tooltip>
                </div>
            </div>
            <div className="p-6 pt-10 flex flex-col flex-grow">
                <h2 className="text-xl font-bold leading-tight tracking-tight text-primary dark:text-white mb-4 line-clamp-2 h-14">
                  <Link href={`/auctions/${auction.publicId || auction.id}`}>
                    {auction.title}
                  </Link>
                </h2>
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    {IconComponent && (
                        <div className="flex items-center gap-2" title={`Tipo: ${auctionTypeDisplay?.label}`}>
                            <IconComponent className="h-4 w-4 text-primary dark:text-secondary"/>
                            <p>{auctionTypeDisplay?.label}</p>
                        </div>
                    )}
                    <div className="flex items-center gap-2" title={`Modalidade: ${auction.participation}`}>
                        <Wifi className="h-4 w-4 text-primary dark:text-secondary"/>
                        <p>{auction.participation}</p>
                    </div>
                </div>

                {auction.auctionStages && auction.auctionStages.length > 0 && (
                    <div className="mb-6">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Praças do Leilão</p>
                        <BidExpertAuctionStagesTimeline auctionOverallStartDate={new Date(auction.auctionDate as string)} stages={auction.auctionStages} variant="compact" />
                    </div>
                )}
                
                <div className="mt-auto space-y-4">
                  {auction.status === 'ABERTO_PARA_LANCES' && auctionEndDate && (
                    <div className="mb-2">
                      <p className="text-center text-sm font-medium text-muted-foreground mb-2">
                        Encerra em:
                      </p>
                      <LotCountdown endDate={auctionEndDate} status={auction.status as any} className="text-primary dark:text-secondary" />
                    </div>
                  )}

                  <p className="text-text-light dark:text-text-dark text-base font-normal leading-normal mb-2 text-center">
                    {auction.totalLots || 0} Lotes Disponíveis
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/auctions/${auction.publicId || auction.id}`}>
                      <Eye className="mr-2 h-4 w-4"/> Ver Lotes
                    </Link>
                  </Button>
                </div>
            </div>
        </div>
    </TooltipProvider>
  );
}
