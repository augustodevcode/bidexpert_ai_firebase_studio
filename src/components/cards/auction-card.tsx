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


interface AuctionCardProps {
  auction: Auction;
  onUpdate?: () => void;
}

export default function AuctionCard({ auction, onUpdate }: AuctionCardProps) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [auctionFullUrl, setAuctionFullUrl] = React.useState<string>(`/auctions/${auction.publicId || auction.id}`);

  const soldLotsCount = React.useMemo(() => {
    if (!auction.lots || auction.lots.length === 0) return 0;
    return auction.lots.filter(lot => lot.status === 'VENDIDO').length;
  }, [auction.lots]);

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
  const mainImageAlt = auction.title || 'Imagem do Leilão';
  const mainImageDataAiHint = auction.dataAiHint || 'auction image';
  const sellerLogoUrl = isValidImageUrl(auction.seller?.logoUrl) ? auction.seller?.logoUrl : undefined;
  const sellerSlug = auction.seller?.slug;
  const sellerName = auction.seller?.name;


  const auctionTypeDisplay = getAuctionTypeDisplayData(auction.auctionType);
  
  const getStatusDisplay = () => {
    if (auction.status === 'ENCERRADO' || auction.status === 'FINALIZADO') {
      if (soldLotsCount > 0) {
        return { text: `Vendido (${soldLotsCount}/${auction.totalLots})`, className: 'bg-green-600 text-white' };
      }
      return { text: 'Finalizado (Sem Venda)', className: 'bg-gray-500 text-white' };
    }
    if (auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO') {
      return { text: getAuctionStatusText(auction.status), className: 'bg-green-600 text-white' };
    }
    if (auction.status === 'EM_BREVE') {
      return { text: getAuctionStatusText(auction.status), className: 'bg-blue-500 text-white' };
    }
    return { text: getAuctionStatusText(auction.status), className: 'bg-gray-500 text-white' };
  };

  const statusDisplay = getStatusDisplay();
  const getAuctionTypeIcon = () => {
    const IconComponent = getAuctionTypeDisplayData(auction.auctionType)?.icon;
    return IconComponent ? <IconComponent className="h-3 w-3" /> : null;
  };

  const consignorInitial = sellerName ? sellerName.charAt(0).toUpperCase() : 'C';

  return (
    <TooltipProvider>
      <>
        <Card data-ai-id={`auction-card-${auction.id}`} className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group">
          <div className="relative">
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="block">
              <div className="aspect-video relative bg-muted rounded-t-lg overflow-hidden">
                <Image
                  src={mainImageUrl!}
                  alt={mainImageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  data-ai-hint="marina home"
                  data-ai-id="auction-card-main-image"
                />
                 {sellerLogoUrl && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href={sellerSlug ? `/sellers/${sellerSlug}` : '#'} onClick={(e) => e.stopPropagation()} className="absolute bottom-2 right-2 z-10">
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
            </Link>
             <div className="absolute top-2 left-2 z-10">
                <Badge className={`text-xs px-2 py-1 shadow-md ${statusDisplay.className}`}>
                    {statusDisplay.text}
                </Badge>
            </div>
             <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                {mentalTriggers.map(trigger => (
                    <Badge key={trigger} variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                        {trigger.startsWith('ENCERRA') && <Clock className="h-3 w-3 mr-1" />}
                        {trigger === 'ALTA DEMANDA' && <Users className="h-3 w-3 mr-1" />}
                        {trigger === 'DESTAQUE' && <Star className="h-3 w-3 mr-1" />}
                        {trigger}
                    </Badge>
                ))}
            </div>
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center gap-2">
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}><Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} /></Button></TooltipTrigger><TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={openPreviewModal} aria-label="Pré-visualizar"><Eye className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>Pré-visualizar</p></TooltipContent></Tooltip>
              <DropdownMenu>
                  <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background"><Share2 className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent><p>Compartilhar</p></TooltipContent></Tooltip>
                  <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild><a href={getSocialLink('x', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><X className="h-3.5 w-3.5" /> X (Twitter)</a></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={getSocialLink('facebook', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><Facebook className="h-3.5 w-3.5" /> Facebook</a></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><MessageSquareText className="h-3.5 w-3.5" /> WhatsApp</a></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={getSocialLink('email', auctionFullUrl, auction.title)} className="flex items-center gap-2 cursor-pointer"><Mail className="h-3.5 w-3.5" /> Email</a></DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
              <EntityEditMenu entityType="auction" entityId={auction.id} publicId={auction.publicId!} currentTitle={auction.title} isFeatured={auction.isFeaturedOnMarketplace || false} onUpdate={onUpdate}/>
            </div>
          </div>

          <CardContent className="p-3 flex flex-col flex-grow space-y-3">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span className="truncate" title={`ID: ${auction.publicId || auction.id}`} data-ai-id="auction-card-public-id">ID: {auction.publicId || auction.id}</span>
              <div className="flex items-center gap-1.5" title={auctionTypeDisplay?.label}>
                  {getAuctionTypeIcon()}
                  <span>{auctionTypeDisplay?.label}</span>
              </div>
            </div>
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="flex-grow">
              <h3 data-ai-id="auction-card-title" className="text-base font-bold text-foreground hover:text-primary transition-colors leading-tight line-clamp-2 min-h-[2.5em]">
                {auction.title}
              </h3>
            </Link>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                <div title={`${auction.totalLots || 0} Lotes`}><ListChecks className="h-4 w-4 mx-auto mb-0.5"/><span className="text-counter">{auction.totalLots || 0} Lotes</span></div>
                <div title={`${auction.visits || 0} Visitas`}><Eye className="h-4 w-4 mx-auto mb-0.5"/><span className="text-counter">{auction.visits || 0}</span></div>
                <div title={`${auction.totalHabilitatedUsers || 0} Habilitados`}><Users className="h-4 w-4 mx-auto mb-0.5"/><span className="text-counter">{auction.totalHabilitatedUsers || 0}</span></div>
            </div>
            
            {auction.auctionStages && auction.auctionStages.length > 0 && (
                <div className="pt-2" data-ai-id="auction-card-timeline">
                    <BidExpertAuctionStagesTimeline auctionOverallStartDate={new Date(auction.auctionDate as string)} stages={auction.auctionStages} />
                </div>
            )}


          </CardContent>
          <CardFooter className="p-3 border-t flex items-end justify-between">
            {auction.initialOffer && (
              <div data-ai-id="auction-card-initial-offer">
                <p className="text-xs text-muted-foreground">
                  {auction.auctionType === 'TOMADA_DE_PRECOS' ? 'Valor Ref.' : 'A partir de'}
                </p>
                <p className="text-lg font-bold text-primary">
                  R$ {auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
            <Button asChild size="sm">
              <Link href={`/auctions/${auction.publicId || auction.id}`}>Ver Lotes ({auction.totalLots || 0})</Link>
            </Button>
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
