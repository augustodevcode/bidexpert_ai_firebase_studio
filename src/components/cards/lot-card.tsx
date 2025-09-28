// src/components/cards/lot-card.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auction, Lot, PlatformSettings, BadgeVisibilitySettings, MentalTriggerSettings } from '@/types';
import { Heart, Share2, Eye, MapPin, Gavel, Percent, Zap, TrendingUp, Crown, Tag, Pencil, Clock, X, Facebook, MessageSquareText, Mail } from 'lucide-react';
import { isPast } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModal from '@/components/lot-preview-modal';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate, isValidImageUrl, getActiveStage, getLotPriceForStage } from '@/lib/ui-helpers';
import { useAuth } from '@/contexts/auth-context';
import { hasPermission } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntityEditMenu from '../entity-edit-menu';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import { Skeleton } from '../ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';


interface LotCardProps {
  lot: Lot;
  auction?: Auction; // The parent auction, if available
  platformSettings: PlatformSettings;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  onUpdate?: () => void;
}

function LotCardClientContent({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate }: LotCardProps) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [isViewed, setIsViewed] = React.useState(false);
  const { toast } = useToast();
  const { userProfileWithPermissions } = useAuth();
  const [lotFullUrl, setLotFullUrl] = React.useState('');

  const hasEditPermission = hasPermission(userProfileWithPermissions, 'manage_all');

  const mentalTriggersGlobalSettings = platformSettings?.mentalTriggerSettings || {};
  const sectionBadges = badgeVisibilityConfig || platformSettings.sectionBadgeVisibility?.searchGrid || {
    showStatusBadge: true,
    showDiscountBadge: true,
    showUrgencyTimer: true,
    showPopularityBadge: true,
    showHotBidBadge: true,
    showExclusiveBadge: true,
  };
  
  const showCountdownOnThisCard = platformSettings.showCountdownOnCards !== false;
  
  const { effectiveLotEndDate } = React.useMemo(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);
  const activeStage = React.useMemo(() => getActiveStage(auction?.auctionStages), [auction]);
  const activeLotPrices = React.useMemo(() => getLotPriceForStage(lot, activeStage?.id), [lot, activeStage]);

  React.useEffect(() => {
    setIsFavorite(isLotFavoriteInStorage(lot.id));
    setIsViewed(getRecentlyViewedIds().includes(lot.id));
    if (typeof window !== 'undefined') {
        setLotFullUrl(`${window.location.origin}/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
    }
  }, [lot.id, lot.auctionId, lot.publicId]);
  
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    if (newFavoriteState) {
      addFavoriteLotIdToStorage(lot.id);
    } else {
      removeFavoriteLotIdFromStorage(lot.id);
    }
    toast({
      title: newFavoriteState ? "Adicionado aos Favoritos" : "Removido dos Favoritos",
      description: `O lote "${lot.title}" foi ${newFavoriteState ? 'adicionado à' : 'removido da'} sua lista.`,
    });
  };

  const handlePreviewOpen = (e: React.MouseEvent) => {
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
  };
  
  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';
  const lotDetailUrl = `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`;
  
  const discountPercentage = React.useMemo(() => {
    if (activeLotPrices?.initialBid && lot.evaluationValue && activeLotPrices.initialBid < lot.evaluationValue) {
      return Math.round(((lot.evaluationValue - activeLotPrices.initialBid) / lot.evaluationValue) * 100);
    }
    return lot.discountPercentage || 0;
  }, [activeLotPrices, lot.evaluationValue, lot.discountPercentage]);

  const mentalTriggers = React.useMemo(() => {
    let triggers = lot.additionalTriggers ? [...lot.additionalTriggers] : [];
    const settings = mentalTriggersGlobalSettings;
    
    if (sectionBadges.showPopularityBadge !== false && settings.showPopularityBadge && (lot.views || 0) > (settings.popularityViewThreshold || 500)) {
      triggers.push('MAIS VISITADO');
    }
    if (sectionBadges.showHotBidBadge !== false && settings.showHotBidBadge && (lot.bidsCount || 0) > (settings.hotBidThreshold || 10) && lot.status === 'ABERTO_PARA_LANCES') {
      triggers.push('LANCE QUENTE');
    }
     if (sectionBadges.showExclusiveBadge !== false && settings.showExclusiveBadge && lot.isExclusive) {
        triggers.push('EXCLUSIVO');
    }
    return Array.from(new Set(triggers));
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive, mentalTriggersGlobalSettings, sectionBadges]);
  
  return (
    <>
      <Card data-ai-id={`lot-card-${lot.id}`} className="card-lot">
        <div className="container-lot-image">
          <Link href={lotDetailUrl} className="link-lot-image">
            <div className="wrapper-lot-image">
              <Image
                src={isValidImageUrl(lot.imageUrl) ? lot.imageUrl! : `https://picsum.photos/seed/${lot.id}/600/400`}
                alt={lot.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="img-lot"
                data-ai-hint="marina home"
                data-ai-id="lot-card-main-image"
              />
            </div>
          </Link>
          <div className="container-lot-badges" data-ai-id="lot-card-status-badges">
            {sectionBadges.showStatusBadge !== false && (
              <Badge className={`badge-lot-status ${getLotStatusColor(lot.status)}`}>
                {getAuctionStatusText(lot.status)}
              </Badge>
            )}
            {isViewed && (
                <Badge variant="outline" className="badge-lot-viewed">
                    <Eye className="icon-badge-viewed" /> Visto
                </Badge>
            )}
          </div>
          <div className="container-lot-mental-triggers" data-ai-id="lot-card-mental-triggers">
            {sectionBadges.showDiscountBadge !== false && mentalTriggersGlobalSettings.showDiscountBadge && discountPercentage > 0 && (
                <Badge variant="destructive" className="badge-lot-discount"><Percent className="icon-badge-discount" /> {discountPercentage}% OFF</Badge>
            )}
            {mentalTriggers.map(trigger => (
                <Badge key={trigger} variant="secondary" className="badge-lot-mental-trigger">
                    {trigger === 'MAIS VISITADO' && <TrendingUp className="icon-mental-trigger" />}
                    {trigger === 'LANCE QUENTE' && <Zap className="icon-mental-trigger is-hot" />}
                    {trigger === 'EXCLUSIVO' && <Crown className="icon-mental-trigger is-exclusive" />}
                    {trigger}
                </Badge>
            ))}
          </div>
          <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center items-center space-x-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <TooltipProvider>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="btn-card-action" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}><Heart className={`icon-card-action ${isFavorite ? 'is-favorite' : ''}`} /></Button></TooltipTrigger><TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="btn-card-action" onClick={handlePreviewOpen} aria-label="Pré-visualizar"><Eye className="icon-card-action" /></Button></TooltipTrigger><TooltipContent><p>Pré-visualizar</p></TooltipContent></Tooltip>
                <DropdownMenu>
                    <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="btn-card-action" aria-label="Compartilhar"><Share2 className="icon-card-action" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent><p>Compartilhar</p></TooltipContent></Tooltip>
                    <DropdownMenuContent align="end" className="dropdown-share-menu">
                        <DropdownMenuItem asChild><a href={getSocialLink('x', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="item-share-dropdown"><X className="icon-social-share" /> X (Twitter)</a></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={getSocialLink('facebook', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="item-share-dropdown"><Facebook className="icon-social-share" /> Facebook</a></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="item-share-dropdown"><MessageSquareText className="icon-social-share" /> WhatsApp</a></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={getSocialLink('email', lotFullUrl, lot.title)} className="item-share-dropdown"><Mail className="icon-social-share" /> Email</a></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                {hasEditPermission && (<EntityEditMenu entityType="lot" entityId={lot.id} publicId={lot.publicId!} currentTitle={lot.title} isFeatured={lot.isFeatured || false} onUpdate={onUpdate}/>)}
            </TooltipProvider>
          </div>
        </div>
        <CardContent className="card-content-lot">
          <div className="container-lot-meta">
             <div className="item-lot-meta" data-ai-id="lot-card-category">
                <Tag className="icon-lot-meta" />
                <span className="text-lot-meta">{lot.type}</span>
            </div>
            <div className="item-lot-meta" data-ai-id="lot-card-bid-count">
                <Gavel className="icon-lot-meta" />
                <span className="text-lot-meta">{lot.bidsCount || 0} Lances</span>
            </div>
          </div>
          <Link href={lotDetailUrl} className="link-lot-title">
            <h3 data-ai-id="lot-card-title" className="title-lot-card">
              Lote {lot.number || lot.id.replace('LOTE','')} - {lot.title}
            </h3>
          </Link>
          <div className="container-lot-location" data-ai-id="lot-card-location">
            <MapPin className="icon-location" />
            <span className="text-location">{displayLocation}</span>
          </div>
        </CardContent>

        <CardFooter className="card-footer-lot">
          <div className="container-lot-footer" data-ai-id="lot-card-footer">
            <div className="section-lot-price" data-ai-id="lot-card-price-section">
              <p className="label-lot-price">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
              <p className={`text-lot-price ${effectiveLotEndDate && isPast(effectiveLotEndDate) ? 'is-ended' : ''}`}>
                R$ {(activeLotPrices?.initialBid ?? lot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>
      {isPreviewModalOpen && (
        <LotPreviewModal
            lot={lot}
            auction={auction}
            platformSettings={platformSettings}
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
    </>
  );
}

export default function LotCard(props: LotCardProps & {onUpdate?: () => void}) {
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
        <Card data-ai-id={`lot-card-skeleton-${props.lot.id}`} className="card-lot-skeleton">
            <div className="skeleton-lot-image"></div>
             <CardContent className="skeleton-lot-content">
                <Skeleton className="skeleton-lot-text-title" />
                 <Skeleton className="skeleton-lot-text-meta" />
                 <Skeleton className="skeleton-lot-text-full" />
             </CardContent>
             <CardFooter className="skeleton-lot-footer">
                <Skeleton className="skeleton-lot-text-price-label" />
                <Skeleton className="skeleton-lot-text-price" />
             </CardFooter>
        </Card>
    );
  }

  return <LotCardClientContent {...props} />;
}
