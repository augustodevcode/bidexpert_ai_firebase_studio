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
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate, isValidImageUrl, getActiveStage, getLotPriceForStage, getAuctionTypeDisplayData } from '@/lib/ui-helpers';
import { useAuth } from '@/contexts/auth-context';
import { hasPermission } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntityEditMenu from '../entity-edit-menu';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import { Skeleton } from '../ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import LotCountdown from '../lot-countdown';


interface LotCardProps {
  lot: Lot;
  auction?: Auction; // The parent auction, if available
  platformSettings: PlatformSettings;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  onUpdate?: () => void;
  showCountdown?: boolean; // New prop to control countdown visibility
}

function LotCardClientContent({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate, showCountdown = false }: LotCardProps) {
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
  
  const showCountdownOnThisCard = showCountdown && platformSettings.showCountdownOnCards !== false;
  
  const { effectiveLotEndDate } = React.useMemo(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);
  const activeStage = React.useMemo(() => getActiveStage(auction?.auctionStages), [auction]);
  const activeLotPrices = React.useMemo(() => getLotPriceForStage(lot, activeStage?.id), [lot, activeStage]);
  
  const auctionTypeDisplay = getAuctionTypeDisplayData(auction?.auctionType);

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
  const lotNumber = lot.number || String(lot.id).replace(/\D/g, '').padStart(3, '0');

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
              {auctionTypeDisplay?.label && (
                 <Badge className={`text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`}>
                    {auctionTypeDisplay.label}
                 </Badge>
              )}
              {auction?.participation && (
                <Badge variant="secondary" className="text-xs">{auction.participation}</Badge>
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
          {auction?.seller?.logoUrl && (
             <div className="absolute -bottom-5 right-4 bg-white dark:bg-zinc-800 rounded-lg p-2 shadow-md">
                <Image alt={auction.seller.name} className="h-8" src={auction.seller.logoUrl} width={80} height={32} style={{objectFit: 'contain'}} />
            </div>
          )}
        </div>
        <CardContent className="p-4 pt-8 flex-grow space-y-3">
          <div className="flex justify-between items-center text-sm text-zinc-500 dark:text-zinc-400">
             <span className="font-semibold" data-ai-id="lot-card-number">LOTE {lotNumber}</span>
             <Link href={`/sellers/${auction?.seller?.slug || auction?.sellerId}`} className="text-primary hover:underline font-medium text-xs">
                {auction?.seller?.name || 'Vendedor'}
             </Link>
          </div>
          
          <Link href={lotDetailUrl}>
            <h3 data-ai-id="lot-card-title" className="text-lg font-bold text-zinc-900 dark:text-white hover:text-primary transition-colors leading-tight min-h-[2.5em] line-clamp-2">
              {lot.title}
            </h3>
          </Link>

          <div className="text-sm text-zinc-600 dark:text-zinc-300 space-y-1">
             <div className="flex items-center space-x-2">
                <Gavel className="h-4 w-4 text-primary/80"/>
                <span>{auctionTypeDisplay?.label || 'Leilão'} | {auction?.participation || 'Online'}</span>
             </div>
             <div className="flex items-center space-x-2">
                 <MapPin className="h-4 w-4 text-primary/80"/>
                <span>{displayLocation}</span>
             </div>
          </div>
          
          <div className="text-center pt-2">
             <p className="text-sm text-zinc-500 dark:text-zinc-400">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
             <p className={`text-3xl font-bold ${effectiveLotEndDate && isPast(effectiveLotEndDate) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                R$ {(activeLotPrices?.initialBid ?? lot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </p>
          </div>

          <LotCountdown endDate={effectiveLotEndDate} status={lot.status as any} variant="card"/>
        </CardContent>

        <CardFooter className="p-4 border-t mt-auto">
             <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href={lotDetailUrl}>
                    <Gavel className="mr-2 h-4 w-4" /> Fazer Lance
                </Link>
            </Button>
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
