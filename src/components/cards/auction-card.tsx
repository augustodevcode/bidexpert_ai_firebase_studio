
// src/components/cards/auction-card.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auction } from '@/types';
import { Heart, Share2, Eye, X, Facebook, MessageSquareText, Mail, Clock, Users, Star, ListChecks } from 'lucide-react';
import { isPast, differenceInDays } from 'date-fns';
import AuctionPreviewModal from '../auction-preview-modal';
import { getAuctionStatusText, isValidImageUrl, getAuctionTypeDisplayData } from '@/lib/ui-helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  
  const mainImageUrl = isValidImageUrl(auction.imageUrl) ? auction.imageUrl : `https://picsum.photos/seed/${auction.id}/600/400`;
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


  return (
    <TooltipProvider>
      <>
        <Card data-ai-id={`auction-card-${auction.id}`} className="card-auction group">
          <div className="container-auction-image">
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="link-auction-image">
              <div className="wrapper-auction-image">
                <Image
                  src={mainImageUrl!}
                  alt={mainImageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="img-auction"
                  data-ai-hint="marina home"
                  data-ai-id="auction-card-main-image"
                />
                 {sellerLogoUrl && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href={sellerSlug ? `/sellers/${sellerSlug}` : '#'} onClick={(e) => e.stopPropagation()} className="link-seller-logo">
                                <Avatar className="avatar-seller-logo" data-ai-id="auction-card-seller-logo">
                                    <AvatarImage src={sellerLogoUrl} alt={sellerName || "Logo Comitente"} className="img-seller-logo" data-ai-hint={auction.seller?.dataAiHintLogo || 'logo comitente'} />
                                    <AvatarFallback className="fallback-seller-logo">{sellerName ? sellerName.charAt(0) : 'C'}</AvatarFallback>
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
             <div className="container-auction-badges" data-ai-id="auction-card-badges">
                <Badge className={`badge-auction-status ${statusDisplay.className}`}>
                    {statusDisplay.text}
                </Badge>
            </div>
             <div className="container-mental-triggers" data-ai-id="auction-card-mental-triggers">
                {mentalTriggers.map(trigger => (
                    <Badge key={trigger} variant="secondary" className="badge-mental-trigger">
                        {trigger.startsWith('ENCERRA') && <Clock className="icon-mental-trigger" />}
                        {trigger === 'ALTA DEMANDA' && <Users className="icon-mental-trigger" />}
                        {trigger === 'DESTAQUE' && <Star className="icon-mental-trigger" />}
                        {trigger}
                    </Badge>
                ))}
            </div>
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
          </div>

          <CardContent className="card-content-auction">
            <div className="container-auction-meta">
              <span className="text-auction-id" title={`ID: ${auction.publicId || auction.id}`} data-ai-id="auction-card-public-id">ID: {auction.publicId || auction.id}</span>
              {auctionTypeDisplay?.label && (
                <div className="container-auction-type" data-ai-id="auction-card-type">
                    {getAuctionTypeIcon()}
                    <span className="label-auction-type">{auctionTypeDisplay.label}</span>
                </div>
                )}
            </div>
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="link-auction-title">
              <h3 data-ai-id="auction-card-title" className="title-auction-card">
                {auction.title}
              </h3>
            </Link>
            
            <div className="grid-auction-counters" data-ai-id="auction-card-counters">
                <div className="item-counter" title={`${auction.totalLots || 0} Lotes`}>
                    <ListChecks className="icon-counter" />
                    <span className="text-counter">{auction.totalLots || 0} Lotes</span>
                </div>
                 <div className="item-counter" title={`${auction.visits || 0} Visitas`}>
                    <Eye className="icon-counter" />
                    <span className="text-counter">{auction.visits || 0} Visitas</span>
                </div>
                 <div className="item-counter" title={`${auction.totalHabilitatedUsers || 0} Usuários Habilitados`}>
                    <Users className="icon-counter" />
                    <span className="text-counter">{auction.totalHabilitatedUsers || 0} Habilitados</span>
                </div>
            </div>
            
            {auction.auctionStages && auction.auctionStages.length > 0 ? (
                <div className="container-auction-timeline" data-ai-id="auction-card-timeline">
                    <BidExpertAuctionStagesTimeline auctionOverallStartDate={new Date(auction.auctionDate as string)} stages={auction.auctionStages} variant="compact" />
                </div>
            ) : null}


          </CardContent>
          <CardFooter className="card-footer-auction">
            {auction.initialOffer && (
              <div className="container-initial-offer" data-ai-id="auction-card-initial-offer">
                <p className="label-initial-offer">
                  {auction.auctionType === 'TOMADA_DE_PRECOS' ? 'Valor de Referência' : 'A partir de'}
                </p>
                <p className="text-initial-offer">
                  R$ {auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
            <Button asChild className="btn-view-lots">
              <Link href={`/auctions/${auction.publicId || auction.id}`}>Ver Lotes ({auction.totalLots})</Link>
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
