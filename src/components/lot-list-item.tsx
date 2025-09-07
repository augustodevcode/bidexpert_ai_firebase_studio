// src/components/lot-list-item.tsx
'use client';

import * as React from 'react'; // Adicionado import do React
import type { Auction, Lot, BadgeVisibilitySettings, MentalTriggerSettings, PlatformSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, Eye, MapPin, Gavel, Percent, Zap, TrendingUp, Crown, Tag, ChevronRight, Layers, Pencil, X, Facebook, MessageSquareText, Mail, Building, Car, Truck, Info, Leaf, CalendarDays } from 'lucide-react';
import { isPast, differenceInSeconds } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModal from './lot-preview-modal';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate, isValidImageUrl, getActiveStage, getLotPriceForStage } from '@/lib/ui-helpers';
import { useAuth } from '@/contexts/auth-context';
import { hasPermission } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntityEditMenu from './entity-edit-menu';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';


interface LotListItemProps {
  lot: Lot;
  auction?: Auction;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

function LotListItemClientContent({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate }: LotListItemProps) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [isViewed, setIsViewed] = React.useState(false);
  const { toast } = useToast();
  const { userProfileWithPermissions } = useAuth();

  const hasEditPermission = hasPermission(userProfileWithPermissions, 'manage_all');

  const mentalTriggersGlobalSettings = platformSettings?.mentalTriggerSettings || {};
  const sectionBadges = badgeVisibilityConfig || platformSettings.sectionBadgeVisibility?.searchList || {
    showStatusBadge: true,
    showDiscountBadge: true,
    showUrgencyTimer: true,
    showPopularityBadge: true,
    showHotBidBadge: true,
    showExclusiveBadge: true,
  };

  const showCountdownOnThisCard = platformSettings.showCountdownOnCards !== false;
  
  const effectiveEndDate = React.useMemo(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);
  const activeStage = React.useMemo(() => getActiveStage(auction?.auctionStages), [auction]);
  const activeLotPrices = React.useMemo(() => getLotPriceForStage(lot, activeStage?.id), [lot, activeStage]);

  React.useEffect(() => {
    setIsFavorite(isLotFavoriteInStorage(lot.id));
    setIsViewed(getRecentlyViewedIds().includes(lot.id));
  }, [lot.id]);
  
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
  
  const inheritedBem = (lot.inheritedMediaFromBemId && lot.bens) ? lot.bens.find(b => b.id === lot.inheritedMediaFromBemId) : null;
  const imageUrlToDisplay = inheritedBem ? inheritedBem.imageUrl : lot.imageUrl;

  const getTypeIcon = (type?: string) => {
    if (!type) {
      return <Info className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    const upperType = type.toUpperCase();
    if (upperType.includes('CASA') || upperType.includes('IMÓVEL') || upperType.includes('APARTAMENTO')) {
        return <Building className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    if (upperType.includes('VEÍCULO') || upperType.includes('AUTOMÓVEL') || upperType.includes('CARRO')) {
        return <Car className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    if (upperType.includes('MAQUINÁRIO') || upperType.includes('TRATOR')) {
        return <Truck className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    return <Info className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image Column */}
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted">
            <Link href={lotDetailUrl} className="block h-full w-full">
              <Image
                src={isValidImageUrl(imageUrlToDisplay) ? imageUrlToDisplay! : 'https://placehold.co/600x400.png'}
                alt={lot.title}
                fill
                className="object-cover"
                data-ai-hint={lot.dataAiHint || 'imagem lote lista'}
              />
            </Link>
          </div>

          {/* Content Column */}
          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                 <div className="flex items-center gap-2 mb-1">
                     <Badge className={`text-xs px-1.5 py-0.5 ${getLotStatusColor(lot.status)}`}>
                        {getAuctionStatusText(lot.status)}
                    </Badge>
                     {mentalTriggers.map(trigger => (
                        <Badge key={trigger} variant="secondary" className="text-xs px-1 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                           {trigger}
                        </Badge>
                     ))}
                </div>
                <Link href={lotDetailUrl}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={lot.title}>
                    Lote {lot.number || lot.id.replace('LOTE','')} - {lot.title}
                  </h3>
                </Link>
              </div>
              <EntityEditMenu 
                 entityType="lot" 
                 entityId={lot.id}
                 publicId={lot.publicId} 
                 currentTitle={lot.title} 
                 isFeatured={lot.isFeatured || false}
                 onUpdate={onUpdate}
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
              <div className="flex items-center" title={`Categoria: ${lot.type}`}>
                {getTypeIcon(lot.type)}
                <span className="truncate ml-1">{lot.type}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate" title={displayLocation}>{displayLocation}</span>
              </div>
               <div className="flex items-center">
                <Gavel className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">{lot.bidsCount || 0} Lances</span>
              </div>
               <div className="flex items-center">
                <Eye className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">{lot.views || 0} Visitas</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{lot.description}</p>

            <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed">
              <div>
                <p className="text-xs text-muted-foreground">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
                <p className={`text-xl font-bold ${effectiveEndDate && isPast(effectiveEndDate) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                  R$ {(activeLotPrices?.initialBid ?? lot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
               <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0">
                    <Link href={lotDetailUrl}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                    </Link>
                </Button>
            </div>
          </div>
        </div>
      </Card>
      <LotPreviewModal
        lot={lot}
        auction={auction}
        platformSettings={platformSettings}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </>
  );
}

export default function LotListItem(props: LotListItemProps & {onUpdate?: () => void}) {
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => {
      setIsClient(true);
    }, []);

    if (!isClient) {
      return (
        <Card className="flex flex-row overflow-hidden h-full shadow-md rounded-lg group">
             <div className="relative aspect-square h-full bg-muted animate-pulse w-1/3 md:w-1/4 flex-shrink-0"></div>
             <div className="flex flex-col flex-grow">
                <CardContent className="p-4 flex-grow space-y-1.5">
                    <Skeleton className="h-5 bg-muted rounded w-3/4" />
                    <Skeleton className="h-4 bg-muted rounded w-1/2" />
                    <Skeleton className="h-4 bg-muted rounded w-full" />
                    <Skeleton className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
                <CardFooter className="p-4 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex-grow">
                        <Skeleton className="h-4 bg-muted rounded w-1/4" />
                        <Skeleton className="h-6 bg-muted rounded w-1/2 mt-1" />
                    </div>
                    <Skeleton className="h-9 bg-muted rounded w-full md:w-auto" />
                </CardFooter>
             </div>
        </Card>
      );
    }

    return <LotListItemClientContent {...props} />;
  }
