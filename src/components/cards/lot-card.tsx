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
  
  const imageUrlToDisplay = lot.imageUrl;

  return (
    <>
      <Card data-ai-id={`lot-card-${lot.id}`} className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group">
        <div className="relative">
          <Link href={lotDetailUrl} className="block">
            <div className="aspect-video relative bg-muted">
              <Image
                src={isValidImageUrl(imageUrlToDisplay) ? imageUrlToDisplay! : `https://picsum.photos/seed/${lot.id}/600/400`}
                alt={lot.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                data-ai-hint={lot.dataAiHint || 'imagem lote'}
                data-ai-id="lot-card-main-image"
              />
            </div>
          </Link>
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10" data-ai-id="lot-card-status-badges">
            {sectionBadges.showStatusBadge !== false && (
              <Badge className={`text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`}>
                {getAuctionStatusText(lot.status)}
              </Badge>
            )}
            {isViewed && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700">
                    <Eye className="h-3 w-3 mr-0.5" /> Visto
                </Badge>
            )}
          </div>
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10" data-ai-id="lot-card-mental-triggers">
            {sectionBadges.showDiscountBadge !== false && mentalTriggersGlobalSettings.showDiscountBadge && discountPercentage > 0 && (
                <Badge variant="destructive" className="text-xs animate-pulse"><Percent className="h-3 w-3 mr-1" /> {discountPercentage}% OFF</Badge>
            )}
            {mentalTriggers.map(trigger => (
                <Badge key={trigger} variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                    {trigger === 'MAIS VISITADO' && <TrendingUp className="h-3 w-3 mr-0.5" />}
                    {trigger === 'LANCE QUENTE' && <Zap className="h-3 w-3 mr-0.5 text-red-500 fill-red-500" />}
                    {trigger === 'EXCLUSIVO' && <Crown className="h-3 w-3 mr-0.5 text-purple-600" />}
                    {trigger}
                </Badge>
            ))}
          </div>
          <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center items-center space-x-1.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <TooltipProvider>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}><Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} /></Button></TooltipTrigger><TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={handlePreviewOpen} aria-label="Pré-visualizar"><Eye className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>Pré-visualizar</p></TooltipContent></Tooltip>
                <DropdownMenu>
                    <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" aria-label="Compartilhar"><Share2 className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent><p>Compartilhar</p></TooltipContent></Tooltip>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild><a href={getSocialLink('x', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer text-xs"><X className="h-3.5 w-3.5" /> X (Twitter)</a></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={getSocialLink('facebook', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer text-xs"><Facebook className="h-3.5 w-3.5" /> Facebook</a></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', lotFullUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer text-xs"><MessageSquareText className="h-3.5 w-3.5" /> WhatsApp</a></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={getSocialLink('email', lotFullUrl, lot.title)} className="flex items-center gap-2 cursor-pointer text-xs"><Mail className="h-3.5 w-3.5" /> Email</a></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                {hasEditPermission && (<EntityEditMenu entityType="lot" entityId={lot.id} publicId={lot.publicId!} currentTitle={lot.title} isFeatured={lot.isFeatured || false} onUpdate={onUpdate}/>)}
            </TooltipProvider>
          </div>
        </div>
        <CardContent className="p-3 flex-grow space-y-1.5">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
             <div className="flex items-center gap-1" data-ai-id="lot-card-category">
                <Tag className="h-3 w-3" />
                <span>{lot.type}</span>
            </div>
            <div className="flex items-center gap-1" data-ai-id="lot-card-bid-count">
                <Gavel className="h-3 w-3" />
                <span>{lot.bidsCount || 0} Lances</span>
            </div>
          </div>
          <Link href={lotDetailUrl}>
            <h3 data-ai-id="lot-card-title" className="text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2">
              Lote {lot.number || lot.id.replace('LOTE','')} - {lot.title}
            </h3>
          </Link>
          <div className="flex items-center text-xs text-muted-foreground" data-ai-id="lot-card-location">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{displayLocation}</span>
          </div>
        </CardContent>

        <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
          <div className="w-full flex justify-between items-end" data-ai-id="lot-card-footer">
            <div data-ai-id="lot-card-price-section">
              <p className="text-xs text-muted-foreground">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
              <p className={`text-xl font-bold ${effectiveLotEndDate && isPast(effectiveLotEndDate) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
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
        <Card data-ai-id={`lot-card-skeleton-${props.lot.id}`} className="flex flex-col overflow-hidden h-full shadow-md rounded-lg">
            <div className="aspect-video relative bg-muted animate-pulse"></div>
             <CardContent className="p-3 flex-grow space-y-1.5">
                <Skeleton className="h-5 bg-muted rounded w-3/4" />
                 <Skeleton className="h-4 bg-muted rounded w-1/2" />
                 <Skeleton className="h-4 bg-muted rounded w-full" />
             </CardContent>
             <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
                <Skeleton className="h-4 bg-muted rounded w-1/4" />
                <Skeleton className="h-6 bg-muted rounded w-1/2" />
             </CardFooter>
        </Card>
    );
  }

  return <LotCardClientContent {...props} />;
}
