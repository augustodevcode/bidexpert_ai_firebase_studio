// src/components/lot-list-item.tsx
'use client';

import * as React from 'react'; 
import type { Auction, Lot, PlatformSettings, BadgeVisibilitySettings, MentalTriggerSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MapPin, Eye, DollarSign, Clock, Users, Gavel, Percent, Zap, TrendingUp, Crown, Tag, ChevronRight, Layers, Pencil, X, Facebook, MessageSquareText, Mail } from 'lucide-react';
import { isPast, differenceInSeconds } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate } from '@/lib/sample-data-helpers';
import LotPreviewModal from './lot-preview-modal';
import EntityEditMenu from './entity-edit-menu';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const LotMapPreviewModal = dynamic(() => import('./lot-map-preview-modal'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-background/50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});


interface TimeRemainingBadgeProps {
  endDate: Date | null;
  status: Lot['status'];
  showUrgencyTimer?: boolean;
  urgencyThresholdDays?: number;
  urgencyThresholdHours?: number;
}

const TimeRemainingBadge: React.FC<TimeRemainingBadgeProps> = ({
  endDate,
  status,
  showUrgencyTimer = true,
  urgencyThresholdDays = 1,
  urgencyThresholdHours = 0
}) => {
  const [timeRemaining, setTimeRemaining] = React.useState<string>('');
  const [isUrgent, setIsUrgent] = React.useState(false);

  React.useEffect(() => {
    if (!endDate) {
      setTimeRemaining(getAuctionStatusText(status));
      setIsUrgent(false);
      return;
    }

    const calculate = () => {
      const now = new Date();
      if (isPast(endDate) || status !== 'ABERTO_PARA_LANCES') {
        setTimeRemaining(getAuctionStatusText(status === 'ABERTO_PARA_LANCES' && isPast(endDate) ? 'ENCERRADO' : status));
        setIsUrgent(false);
        return;
      }
      
      const totalSecondsLeft = differenceInSeconds(endDate, now);
      if(totalSecondsLeft <= 0) {
          setTimeRemaining('Encerrado');
          setIsUrgent(false);
          return;
      }
      
      const thresholdInSeconds = (urgencyThresholdDays * 24 * 60 * 60) + (urgencyThresholdHours * 60 * 60);
      const currentlyUrgent = totalSecondsLeft <= thresholdInSeconds;
      setIsUrgent(currentlyUrgent && showUrgencyTimer);

      if (currentlyUrgent && showUrgencyTimer) {
        const hours = Math.floor(totalSecondsLeft / 3600);
        const minutes = Math.floor((totalSecondsLeft % 3600) / 60);
        const seconds = totalSecondsLeft % 60;
        if(hours > 0) {
           setTimeRemaining(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        } else {
           setTimeRemaining(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }
      } else {
        const days = Math.floor(totalSecondsLeft / (3600 * 24));
        const hours = Math.floor((totalSecondsLeft % (3600 * 24)) / 3600);
        if (days > 0) setTimeRemaining(`${days}d ${hours}h restantes`);
        else if (hours > 0) setTimeRemaining(`${hours}h restantes`);
        else setTimeRemaining(`~${Math.floor((totalSecondsLeft % 3600) / 60)}m restantes`);
      }
    };
    
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endDate, status, showUrgencyTimer, urgencyThresholdDays, urgencyThresholdHours]);

  return (
    <Badge variant={isUrgent ? "destructive" : "outline"} className="text-xs font-medium">
      <Clock className="h-3 w-3 mr-1" />
      {timeRemaining}
    </Badge>
  );
};


interface LotListItemProps {
  lot: Lot;
  auction?: Auction | null;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

function LotListItemClientContent({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate }: LotListItemProps) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isViewed, setIsViewed] = React.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = React.useState(false);
  const { toast } = useToast();

  const mentalTriggersGlobalSettings = platformSettings?.mentalTriggerSettings || {};
  const sectionBadges = badgeVisibilityConfig || platformSettings?.sectionBadgeVisibility?.searchList || {
    showStatusBadge: true,
    showDiscountBadge: true,
    showUrgencyTimer: true,
    showPopularityBadge: true,
    showHotBidBadge: true,
    showExclusiveBadge: true,
  };

  const showCountdownOnThisCard = platformSettings?.showCountdownOnCards !== false;
  
  const effectiveEndDate = React.useMemo(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);
  
  React.useEffect(() => {
    if (lot.id) {
      setIsFavorite(isLotFavoriteInStorage(lot.id));
      setIsViewed(getRecentlyViewedIds().includes(lot.id));
    }
  }, [lot.id]);
  
  const lotDetailUrl = `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`;

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    if (newFavoriteState) addFavoriteLotIdToStorage(lot.id);
    else removeFavoriteLotIdFromStorage(lot.id);
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
  
  const discountPercentage = React.useMemo(() => {
    if (lot.initialPrice && lot.secondInitialPrice && lot.secondInitialPrice < lot.initialPrice && (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE')) {
      return Math.round(((lot.initialPrice - lot.secondInitialPrice) / lot.initialPrice) * 100);
    }
    return lot.discountPercentage || 0;
  }, [lot.initialPrice, lot.secondInitialPrice, lot.status, lot.discountPercentage]);

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

  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';

  return (
    <>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted">
            <Link href={lotDetailUrl} className="block h-full w-full">
              <Image
                src={lot.imageUrl || 'https://placehold.co/600x400.png'}
                alt={lot.title}
                fill
                className="object-cover"
                data-ai-hint={lot.dataAiHint || 'imagem lote lista'}
              />
            </Link>
          </div>
          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                 <Link href={lotDetailUrl}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={lot.title}>
                    Lote {lot.number || lot.id.replace('LOTE','')} - {lot.title}
                  </h3>
                </Link>
                 <p className="text-xs text-muted-foreground mt-0.5 truncate" title={`Leilão: ${auction?.title}`}>
                  Leilão: {auction?.title || lot.auctionName || 'Não especificado'}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFavoriteToggle}><Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviewOpen}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 my-2">
                {sectionBadges.showStatusBadge !== false && (
                    <Badge className={`text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`}>
                        {getAuctionStatusText(lot.status)}
                    </Badge>
                )}
                 {sectionBadges.showDiscountBadge !== false && mentalTriggersGlobalSettings.showDiscountBadge && discountPercentage > 0 && (
                    <Badge variant="destructive" className="text-xs"><Percent className="h-3 w-3 mr-1" /> {discountPercentage}% OFF</Badge>
                )}
                {showCountdownOnThisCard && (
                    <TimeRemainingBadge endDate={effectiveEndDate} status={lot.status} showUrgencyTimer={sectionBadges.showUrgencyTimer} urgencyThresholdDays={mentalTriggersGlobalSettings.urgencyTimerThresholdDays} urgencyThresholdHours={mentalTriggersGlobalSettings.urgencyTimerThresholdHours} />
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

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-grow">{lot.description}</p>
            
            <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed">
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
                <p className={`text-2xl font-bold ${isPast(effectiveEndDate || 0) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                  R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0">
                <Link href={lotDetailUrl}>
                    <Gavel className="mr-2 h-4 w-4" /> Dar Lance Agora
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <LotPreviewModal lot={lot} auction={auction} platformSettings={platformSettings} isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} />
    </>
  );
}

export default function LotListItem({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate }: LotListItemProps & {onUpdate?: () => void}) {
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
                    <div className="h-5 bg-muted rounded w-3/4 animate-pulse mt-1"></div>
                    <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-1"></div>
                    <div className="h-4 bg-muted rounded w-full animate-pulse mt-1"></div>
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse mt-1"></div>
                </CardContent>
                <CardFooter className="p-4 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex-grow">
                        <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                        <div className="h-6 bg-muted rounded w-1/2 animate-pulse mt-1"></div>
                    </div>
                    <div className="h-9 bg-muted rounded w-full md:w-auto animate-pulse"></div>
                </CardFooter>
             </div>
        </Card>
      );
    }

    return <LotListItemClientContent lot={lot} auction={auction} badgeVisibilityConfig={badgeVisibilityConfig} platformSettings={platformSettings} onUpdate={onUpdate} />;
  }

