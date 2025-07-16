// src/components/lot-card.tsx
'use client';

import * as React from 'react';
import type { Lot, Auction, PlatformSettings, BadgeVisibilitySettings, MentalTriggerSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Clock, Gavel, Tag, Percent, Zap, TrendingUp, Crown, Heart, ListChecks } from 'lucide-react';
import { format, isPast, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate } from '@/lib/sample-data-helpers';
import LotPreviewModal from './lot-preview-modal';
import EntityEditMenu from './entity-edit-menu';

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
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

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
        setTimeRemaining(`${days}d restante(s)`);
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


interface LotCardProps {
  lot: Lot;
  auction?: Auction | null;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

export default function LotCard({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate }: LotCardProps) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [lotDetailUrl, setLotDetailUrl] = React.useState<string>(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
  const { toast } = useToast();

  const mentalTriggersGlobalSettings = platformSettings?.mentalTriggerSettings || {};
  const sectionBadges = badgeVisibilityConfig || platformSettings?.sectionBadgeVisibility?.searchGrid || {
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
    if (typeof window !== 'undefined') {
      setLotDetailUrl(`${window.location.origin}/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
      setIsFavorite(isLotFavoriteInStorage(lot.id));
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
     window.dispatchEvent(new CustomEvent('favorites-updated'));
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


  return (
    <>
      <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg group">
        <div className="relative">
          <Link href={lotDetailUrl} className="block">
            <div className="aspect-[16/10] relative bg-muted">
              <Image
                src={lot.imageUrl || 'https://placehold.co/600x400.png'}
                alt={lot.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                data-ai-hint={lot.dataAiHint || 'imagem lote'}
              />
            </div>
          </Link>
          <div className="absolute top-2 left-2 flex flex-wrap items-start gap-1 z-10">
              {sectionBadges.showStatusBadge !== false && (
                  <Badge className={`text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`}>
                      {getAuctionStatusText(lot.status)}
                  </Badge>
              )}
          </div>
           <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
              {mentalTriggers.map(trigger => (
                <Badge key={trigger} variant="secondary" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                  {trigger === 'MAIS VISITADO' && <TrendingUp className="h-3 w-3 mr-0.5" />}
                  {trigger === 'LANCE QUENTE' && <Zap className="h-3 w-3 mr-0.5 text-red-500 fill-red-500" />}
                  {trigger === 'EXCLUSIVO' && <Crown className="h-3 w-3 mr-0.5 text-purple-600" />}
                  {trigger}
                </Badge>
              ))}
          </div>
          <div className="absolute bottom-2 left-1/2 z-20 flex w-full -translate-x-1/2 transform-gpu flex-row items-center justify-center space-x-1.5 opacity-0 transition-all duration-300 group-hover:-translate-y-0 group-hover:opacity-100 translate-y-4">
              <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}><Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={handlePreviewOpen} aria-label="Pré-visualizar"><Eye className="h-4 w-4 text-muted-foreground" /></Button>
              <EntityEditMenu entityType="lot" entityId={lot.id} publicId={lot.publicId} currentTitle={lot.title} isFeatured={lot.isFeatured || false} onUpdate={onUpdate} />
          </div>
        </div>

        <CardContent className="p-3 flex-grow">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
             <div className="flex items-center gap-1 truncate">
               <Tag className="h-3 w-3" />
               <span className="truncate" title={lot.type}>{lot.type}</span>
            </div>
            {lot.cityName && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{lot.cityName}</span>
              </div>
            )}
          </div>

          <Link href={lotDetailUrl}>
            <h3 className="text-sm font-semibold hover:text-primary transition-colors mt-1.5 mb-1 leading-tight min-h-[2.2em] line-clamp-2">
              {lot.title}
            </h3>
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Gavel className="h-3 w-3" />
                <span>{lot.bidsCount || 0} Lances</span>
              </div>
               {showCountdownOnThisCard && (
                    <TimeRemainingBadge endDate={effectiveEndDate} status={lot.status} showUrgencyTimer={sectionBadges.showUrgencyTimer} urgencyThresholdDays={mentalTriggersGlobalSettings.urgencyTimerThresholdDays} urgencyThresholdHours={mentalTriggersGlobalSettings.urgencyTimerThresholdHours} />
                )}
          </div>
        </CardContent>

        <CardFooter className="p-3 border-t flex-col items-start space-y-1">
          <div className="w-full">
            <p className="text-xs text-muted-foreground">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
            <p className={`text-xl font-bold ${isPast(effectiveEndDate || 0) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
              R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Button asChild className="w-full mt-2" size="sm">
            <Link href={lotDetailUrl}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </Link>
          </Button>
        </CardFooter>
      </Card>
      <LotPreviewModal lot={lot} auction={auction} platformSettings={platformSettings} isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} />
    </>
  );
}
