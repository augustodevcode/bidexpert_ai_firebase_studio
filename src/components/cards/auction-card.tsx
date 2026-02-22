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
import { cn } from '@/lib/utils';
import AuctionPreviewModalV2 from '../auction-preview-modal-v2';
import { isValidImageUrl, getAuctionStatusText, getAuctionTypeDisplayData } from '@/lib/ui-helpers';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntityEditMenu from '../entity-edit-menu';
import BidExpertAuctionStagesTimeline from '@/components/auction/BidExpertAuctionStagesTimeline';
import ConsignorLogoBadge from '../consignor-logo-badge';
import GoToLiveAuctionButton from '@/components/auction/go-to-live-auction-button';


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
  const sellerSlug = auction.seller?.slug || auction.seller?.publicId || auction.seller?.id;
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
        <Card data-ai-id={`auction-card-${auction.id}`} data-testid="auction-card" className="card-auction group">
          <div className="wrapper-card-media">
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="link-card-media-overlay">
              <div className="container-card-image">
                <Image
                  src={mainImageUrl!}
                  alt={mainImageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="img-card-auction"
                  data-ai-hint={mainImageDataAiHint}
                  data-ai-id="auction-card-main-image"
                />
              </div>
            </Link>
            <div className="wrapper-card-status-badges" data-ai-id="auction-card-badges">
                <Badge className={cn("badge-auction-status", statusDisplay.className)} data-ai-id="auction-card-status-badge">
                    {statusDisplay.text}
                </Badge>
            </div>
             <div className="wrapper-card-mental-triggers" data-ai-id="auction-card-mental-triggers">
                {mentalTriggers.map(trigger => (
                    <Badge key={trigger} variant="secondary" className="badge-trigger-mental" data-ai-id={`auction-card-trigger-${trigger.toLowerCase().replace(/\s+/g, '-')}`}>
                        {trigger.startsWith('ENCERRA') && <Clock className="icon-trigger-small" />}
                        {trigger === 'ALTA DEMANDA' && <Users className="icon-trigger-small" />}
                        {trigger === 'DESTAQUE' && <Star className="icon-trigger-small" />}
                        {trigger}
                    </Badge>
                ))}
            </div>
            <ConsignorLogoBadge
              href={sellerSlug ? `/sellers/${sellerSlug}` : undefined}
              logoUrl={sellerLogoUrl}
              fallbackInitial={consignorInitial}
              name={sellerName}
              dataAiHint={auction.seller?.dataAiHintLogo || 'logo comitente pequeno'}
              anchorClassName="badge-consignor-logo-overlay-right"
            />
            <div className="wrapper-card-actions-overlay" data-ai-id="auction-card-actions-overlay">
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="btn-card-action-overlay" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"} data-ai-id="auction-card-favorite-btn"><Heart className={cn("icon-card-action", isFavorite && "icon-favorite-active")} /></Button></TooltipTrigger><TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="btn-card-action-overlay" onClick={openPreviewModal} aria-label="Pré-visualizar" data-ai-id="auction-card-preview-btn"><Eye className="icon-card-action" /></Button></TooltipTrigger><TooltipContent><p>Pré-visualizar</p></TooltipContent></Tooltip>
              <DropdownMenu>
                  <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="btn-card-action-overlay" aria-label="Compartilhar" data-ai-id="auction-card-share-btn"><Share2 className="icon-card-action" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent><p>Compartilhar</p></TooltipContent></Tooltip>
                  <DropdownMenuContent align="end" className="menu-share-content" data-ai-id="auction-card-share-menu">
                      <DropdownMenuItem asChild><a href={getSocialLink('x', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="item-share-link"><X className="icon-share-platform" /> X (Twitter)</a></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={getSocialLink('facebook', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="item-share-link"><Facebook className="icon-share-platform" /> Facebook</a></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="item-share-link"><MessageSquareText className="icon-share-platform" /> WhatsApp</a></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={getSocialLink('email', auctionFullUrl, auction.title)} className="item-share-link"><Mail className="icon-share-platform" /> Email</a></DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
              <div className="wrapper-edit-menu-overlay" data-ai-id="auction-card-edit-menu"><EntityEditMenu entityType="auction" entityId={auction.id} publicId={auction.publicId!} currentTitle={auction.title} isFeatured={auction.isFeaturedOnMarketplace || false} onUpdate={onUpdate}/></div>
            </div>
          </div>
          <CardContent className="content-card-auction" data-ai-id="auction-card-content">
            <div className="wrapper-card-auction-info-header">
              <span className="text-card-auction-public-id" title={`ID: ${auction.publicId || auction.id}`}>ID: {auction.publicId || auction.id}</span>
              {auctionTypeDisplay?.label && (
                <div className="wrapper-card-auction-type" title={auctionTypeDisplay.label}>
                    {getAuctionTypeIcon()}
                    <span className="text-card-auction-type-label">{auctionTypeDisplay.label}</span>
                </div>
                )}
            </div>
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="link-card-content" data-ai-id="auction-card-link-main">
              <h3 data-ai-id="auction-card-title" className="header-card-auction-title">
                {auction.title}
              </h3>
            </Link>
            
            <div className="grid-auction-stats" data-ai-id="auction-card-stats">
                <div className="item-auction-stat" title={`${auction.totalLots || 0} Lotes`}><ListChecks className="icon-auction-stat" /><span className="text-auction-stat-value">{auction.totalLots || 0}</span> Lotes</div>
                <div className="item-auction-stat" title={`${auction.visits || 0} Visitas`}><Eye className="icon-auction-stat" /><span className="text-auction-stat-value">{auction.visits || 0}</span></div>
                <div className="item-auction-stat" title={`${auction.totalHabilitatedUsers || 0} Habilitados`}><Users className="icon-auction-stat" /><span className="text-auction-stat-value">{auction.totalHabilitatedUsers || 0}</span></div>
            </div>

            
            <div className="wrapper-card-timeline-section" data-ai-id="auction-card-timeline">
              <BidExpertAuctionStagesTimeline
                auction={auction}
                stages={auction.auctionStages || []}
                auctionOverallStartDate={auction.auctionDate ? new Date(auction.auctionDate as string) : undefined}
                variant="extended"
              />
            </div>
          </CardContent>
          <CardFooter className="footer-card-auction" data-ai-id="auction-card-footer">
            {auction.initialOffer && (
              <div className="wrapper-card-auction-price" data-ai-id="auction-card-initial-offer">
                <p className="text-card-price-label">
                  {auction.auctionType === 'TOMADA_DE_PRECOS' ? 'Valor Ref.' : 'A partir de'}
                </p>
                <p className="text-card-price-value-primary">
                  R$ {auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2 items-end">
              <GoToLiveAuctionButton auction={auction} dataAiId="auction-card-go-live-btn" />
              <Button asChild size="sm" className="btn-card-view-lots" data-ai-id="auction-card-view-lots-btn">
                <Link href={`/auctions/${auction.publicId || auction.id}`}>Ver Lotes ({auction.totalLots || 0})</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        {isPreviewModalOpen && (
          <AuctionPreviewModalV2
            auction={auction}
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
          />
        )}
      </>
    </TooltipProvider>
  );
}
