// src/components/cards/auction-card.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auction } from '@/types';
import { Heart, Share2, Eye, X, Facebook, MessageSquareText, Mail, Clock, Users, Star, ListChecks, Wifi } from 'lucide-react';
import { isPast, differenceInDays } from 'date-fns';
import AuctionPreviewModal from '../auction-preview-modal';
import { isValidImageUrl, getAuctionStatusText, getAuctionTypeDisplayData } from '@/lib/ui-helpers';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [auctionFullUrl, setAuctionFullUrl] = React.useState<string>(`/auctions/${auction.publicId || auction.id}`);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuctionFullUrl(`${window.location.origin}/auctions/${auction.publicId || auction.id}`);
    }
  }, [auction.id, auction.publicId]);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const openPreviewModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPreviewModalOpen(true);
  };
  
  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch(platform) {
      case 'x': return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp': return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email': return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  }

  const mainImageUrl = isValidImageUrl(auction.imageUrl) ? auction.imageUrl! : `https://picsum.photos/seed/${auction.id}/600/400`;
  const sellerLogoUrl = isValidImageUrl(auction.seller?.logoUrl) ? auction.seller?.logoUrl : undefined;
  const sellerName = auction.seller?.name;
  const auctionTypeDisplay = getAuctionTypeDisplayData(auction.auctionType);
  const IconComponent = auctionTypeDisplay?.icon;
  const { effectiveLotEndDate: auctionEndDate } = getEffectiveLotEndDate(auction.lots?.[0], auction);
  const getAuctioneerInitial = () => (sellerName ? sellerName.charAt(0).toUpperCase() : 'C');
  const consignorInitial = getAuctioneerInitial();

  return (
    <TooltipProvider>
      <>
        <Card data-ai-id={`auction-card-${auction.id}`} className="card-auction">
          <div className="container-auction-image">
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="link-auction-image">
              <div className="wrapper-auction-image">
                <Image
                  src={mainImageUrl}
                  alt={auction.title || 'Imagem do Leilão'}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="img-auction"
                  data-ai-hint={auction.dataAiHint || 'imagem leilao'}
                  data-ai-id="auction-card-main-image"
                />
              </div>
            </Link>
            <div className="absolute bottom-2 left-1/2 z-20 flex w-full -translate-x-1/2 transform-gpu flex-row items-center justify-center space-x-1.5 opacity-0 transition-all duration-300 group-hover:-translate-y-0 group-hover:opacity-100 translate-y-4">
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="btn-card-action" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}><Heart className={`icon-card-action ${isFavorite ? 'is-favorite' : ''}`} /></Button></TooltipTrigger><TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="btn-card-action" onClick={openPreviewModal} aria-label="Pré-visualizar"><Eye className="icon-card-action" /></Button></TooltipTrigger><TooltipContent><p>Pré-visualizar</p></TooltipContent></Tooltip>
              <DropdownMenu>
                  <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="btn-card-action" aria-label="Compartilhar"><Share2 className="icon-card-action" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent><p>Compartilhar</p></TooltipContent></Tooltip>
                  <DropdownMenuContent align="end" className="dropdown-share-menu">
                      <DropdownMenuItem asChild><a href={getSocialLink('x', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="item-share-dropdown"><X className="icon-social-share" /> X (Twitter)</a></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={getSocialLink('facebook', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="item-share-dropdown"><Facebook className="icon-social-share" /> Facebook</a></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="item-share-dropdown"><MessageSquareText className="icon-social-share" /> WhatsApp</a></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={getSocialLink('email', auctionFullUrl, auction.title)} className="item-share-dropdown"><Mail className="icon-social-share" /> Email</a></DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
              <EntityEditMenu entityType="auction" entityId={auction.id} publicId={auction.publicId!} currentTitle={auction.title} isFeatured={auction.isFeaturedOnMarketplace || false} onUpdate={onUpdate}/>
            </div>
             {sellerLogoUrl && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href={auction.seller?.slug ? `/sellers/${auction.seller.slug}` : '#'} onClick={(e) => e.stopPropagation()} className="absolute bottom-2 right-2 z-10">
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
             <div className="absolute top-2 left-2 z-10">
                <Badge className={`badge-auction-status bg-green-600 text-white`}>
                    {getAuctionStatusText(auction.status)}
                </Badge>
            </div>
          </div>

          <CardContent className="card-content-auction">
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
          </CardContent>
          <CardFooter className="card-footer-auction">
            <div className="space-y-4 w-full">
              {auction.status === 'ABERTO_PARA_LANCES' && auctionEndDate && (
                <div className="mb-2">
                  <p className="text-center text-sm font-medium text-muted-foreground mb-2">
                    Encerra em:
                  </p>
                  <LotCountdown endDate={auctionEndDate} status={auction.status as any} className="text-primary dark:text-secondary" />
                </div>
              )}
              <p className="text-text-light dark:text-text-dark text-base font-normal leading-normal text-center">
                {auction.totalLots || 0} Lotes Disponíveis
              </p>
              <Button asChild className="w-full">
                <Link href={`/auctions/${auction.publicId || auction.id}`}>
                  <Eye className="mr-2 h-4 w-4"/> Ver Lotes
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        {isPreviewModalOpen && (
          <AuctionPreviewModal
            auction={auction}
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
          />
        )}
      </>
    </TooltipProvider>
  );
}
