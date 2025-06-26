

'use client';

import type { Lot, PlatformSettings, BadgeVisibilitySettings, MentalTriggerSettings, Auction } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Eye, ListChecks, DollarSign, CalendarDays, Clock, Users, Gavel, Building, Car, Truck, Info, Percent, Zap, TrendingUp, Crown, Tag, ChevronRight, Layers, Pencil } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect, useMemo } from 'react';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate } from '@/lib/sample-data-helpers';
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModal from './lot-preview-modal';
import LotMapPreviewModal from './lot-map-preview-modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntityEditMenu from './entity-edit-menu';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';

interface TimeRemainingBadgeProps {
  endDate: Date | string | undefined | null;
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

  useEffect(() => {
    if (!endDate) {
      setTimeRemaining(getAuctionStatusText(status));
      setIsUrgent(false);
      return;
    }

    const calculateTime = () => {
      const now = new Date();
      const end = endDate instanceof Date ? endDate : new Date(endDate as string);

      if (isPast(end) || status !== 'ABERTO_PARA_LANCES') {
        setTimeRemaining(getAuctionStatusText(status === 'ABERTO_PARA_LANCES' && isPast(end) ? 'ENCERRADO' : status));
        setIsUrgent(false);
        return;
      }

      const totalSecondsLeft = differenceInSeconds(end, now);
      if (totalSecondsLeft <= 0) {
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
        if (hours > 0) {
          setTimeRemaining(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        } else {
          setTimeRemaining(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }
      } else {
        const days = Math.floor(totalSecondsLeft / (3600 * 24));
        const hours = Math.floor((totalSecondsLeft % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSecondsLeft % 3600) / 60);

        if (days > 0) setTimeRemaining(`${days}d ${hours}h`);
        else if (hours > 0) setTimeRemaining(`${hours}h ${minutes}m`);
        else if (minutes > 0) setTimeRemaining(`${minutes}m`);
        else setTimeRemaining('Encerrando!');
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
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
  auction?: Auction;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

const LotCardClientContent: React.FC<LotCardProps> = ({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isViewed, setIsViewed] = useState(false);
  const [lotDetailUrl, setLotDetailUrl] = useState<string>(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const { toast } = useToast();
  
  const mentalTriggersGlobalSettings = platformSettings.mentalTriggerSettings || {};

  const sectionBadges = badgeVisibilityConfig || platformSettings.sectionBadgeVisibility?.searchGrid || {
    showStatusBadge: true,
    showDiscountBadge: true,
    showUrgencyTimer: true,
    showPopularityBadge: true,
    showHotBidBadge: true,
    showExclusiveBadge: true,
  };

  const showCountdownOnThisCard = platformSettings.showCountdownOnCards !== false;
  
  const effectiveEndDate = useMemo(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLotDetailUrl(`${window.location.origin}/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
      setIsFavorite(isLotFavoriteInStorage(lot.id));
      setIsViewed(getRecentlyViewedIds().includes(lot.id));
    }
  }, [lot.id, lot.auctionId, lot.publicId]);

   useEffect(() => {
    if (lot && lot.id) {
        setIsFavorite(isLotFavoriteInStorage(lot.id));
    }
  }, [lot?.id]);


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

  const handleMapPreviewOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMapModalOpen(true);
  };

  const getTypeIcon = (type: string) => {
    const upperType = type.toUpperCase();
    if (upperType.includes('CASA') || upperType.includes('IMÓVEL') || upperType.includes('APARTAMENTO')) {
        return <Building className="h-3 w-3 text-muted-foreground" />;
    }
    if (upperType.includes('VEÍCULO') || upperType.includes('AUTOMÓVEL') || upperType.includes('CARRO')) {
        return <Car className="h-3 w-3 text-muted-foreground" />;
    }
    if (upperType.includes('MAQUINÁRIO') || upperType.includes('TRATOR')) {
        return <Truck className="h-3 w-3 text-muted-foreground" />;
    }
    return <Tag className="h-3 w-3 text-muted-foreground" />;
  };

  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';

  const discountPercentage = useMemo(() => {
    if (lot.initialPrice && lot.secondInitialPrice && lot.secondInitialPrice < lot.initialPrice && (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE')) {
      return Math.round(((lot.initialPrice - lot.secondInitialPrice) / lot.initialPrice) * 100);
    }
    return lot.discountPercentage || 0;
  }, [lot.initialPrice, lot.secondInitialPrice, lot.status, lot.discountPercentage]);


  const mentalTriggers = useMemo(() => {
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
    <Card className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg group">
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

        {/* LEFT BADGES (STATUS ONLY) */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10">
          {sectionBadges.showStatusBadge !== false && (
            <Badge className={`text-xs px-2 py-1 ${getLotStatusColor(lot.status)} border-current`}>
              {getAuctionStatusText(lot.status)}
            </Badge>
          )}
          {isViewed && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700">
                <Eye className="h-3 w-3 mr-0.5" /> Visto
              </Badge>
          )}
        </div>

        {/* RIGHT BADGES (MENTAL TRIGGERS) */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
          
          {sectionBadges.showDiscountBadge !== false && mentalTriggersGlobalSettings.showDiscountBadge && discountPercentage > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5 animate-pulse">
              <Percent className="h-3 w-3 mr-1" /> {discountPercentage}% OFF
            </Badge>
          )}
          {mentalTriggers.map(trigger => {
            let showThisTrigger = false;
            if (trigger === 'MAIS VISITADO' && sectionBadges.showPopularityBadge !== false && mentalTriggersGlobalSettings.showPopularityBadge) showThisTrigger = true;
            if (trigger === 'LANCE QUENTE' && sectionBadges.showHotBidBadge !== false && mentalTriggersGlobalSettings.showHotBidBadge) showThisTrigger = true;
            if (trigger === 'EXCLUSIVO' && sectionBadges.showExclusiveBadge !== false && mentalTriggersGlobalSettings.showExclusiveBadge) showThisTrigger = true;
            if (!showThisTrigger) return null;

            return (
                <Badge key={trigger} variant="secondary" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                {trigger === 'MAIS VISITADO' && <TrendingUp className="h-3 w-3 mr-0.5" />}
                {trigger === 'LANCE QUENTE' && <Zap className="h-3 w-3 mr-0.5 text-red-500 fill-red-500" />}
                {trigger === 'EXCLUSIVO' && <Crown className="h-3 w-3 mr-0.5 text-purple-600" />}
                {trigger}
                </Badge>
            );
          })}
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-row space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}><Heart className={`h-3.5 w-3.5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} /></Button></TooltipTrigger><TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" onClick={handlePreviewOpen} aria-label="Pré-visualizar Lote"><Eye className="h-3.5 w-3.5 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>Pré-visualizar</p></TooltipContent></Tooltip>
          {(lot.latitude || lot.longitude || lot.mapAddress || lot.mapEmbedUrl) && (
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" onClick={handleMapPreviewOpen} aria-label="Ver no Mapa"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>Ver Mapa</p></TooltipContent></Tooltip>
          )}
          <EntityEditMenu
            entityType="lot"
            entityId={lot.id}
            publicId={lot.publicId}
            currentTitle={lot.title}
            isFeatured={lot.isFeatured || false}
            onUpdate={onUpdate}
          />
        </div>
      </div>

      <CardContent className="p-3 flex-grow space-y-1.5">
        <Link href={lotDetailUrl} className="block mt-2">
          <h3 className="text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2">
            {lot.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 h-8 group-hover:text-primary/90">
            {lot.description || ''}
          </p>
        </Link>
        <div className="flex items-center text-xs text-muted-foreground">
            {getTypeIcon(lot.type)}
            <span className="truncate ml-1" title={lot.type}>{lot.type}</span>
            {lot.subcategoryName && (
                <>
                    <ChevronRight className="h-3 w-3 mx-0.5 text-muted-foreground/70 flex-shrink-0" />
                    <Layers className="h-3 w-3 mr-1 text-primary/70 flex-shrink-0" />
                    <span className="truncate" title={lot.subcategoryName}>{lot.subcategoryName}</span>
                </>
            )}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="truncate" title={displayLocation}>{displayLocation}</span>
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1 truncate" title={`Leilão: ${lot.auctionName}`}>
                <ListChecks className="h-3 w-3" />
                <span className="truncate">{lot.auctionName || 'Leilão não especificado'}</span>
            </div>
            <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{lot.views || 0}</span>
            </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
        <div className="w-full">
          <p className="text-xs text-muted-foreground">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
          <p className={`text-xl font-bold ${effectiveEndDate && isPast(effectiveEndDate) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
            R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="w-full flex justify-between items-center text-xs">
            <div>
              {showCountdownOnThisCard && (
                <TimeRemainingBadge
                  endDate={effectiveEndDate}
                  status={lot.status}
                  showUrgencyTimer={sectionBadges.showUrgencyTimer !== false && mentalTriggersGlobalSettings.showUrgencyTimer}
                  urgencyThresholdDays={mentalTriggersGlobalSettings.urgencyTimerThresholdDays}
                  urgencyThresholdHours={mentalTriggersGlobalSettings.urgencyTimerThresholdHours}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${effectiveEndDate && isPast(effectiveEndDate) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    <Gavel className="h-3 w-3" />
                    <span>{lot.bidsCount || 0}</span>
                </div>
                <span className={`font-semibold ${effectiveEndDate && isPast(effectiveEndDate) ? 'text-muted-foreground line-through' : 'text-foreground'}`}>Lote {lot.number || lot.id.replace('LOTE', '')}</span>
            </div>
        </div>

         <Button asChild className="w-full mt-2" size="sm">
            <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`}>Ver Detalhes do Lote</Link>
        </Button>
      </CardFooter>
    </Card>
    <LotPreviewModal
        lot={lot}
        auction={auction}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
       <LotMapPreviewModal
        lot={lot}
        platformSettings={platformSettings}
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
      />
    </>
  );
}


export default function LotCard({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate }: LotCardProps) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
      setIsClient(true);
    }, []);

    if (!isClient) {
      return (
        <Card className="flex flex-col overflow-hidden h-full shadow-md rounded-lg group">
             <div className="relative aspect-[16/10] bg-muted animate-pulse"></div>
             <CardContent className="p-3 flex-grow space-y-1.5">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse mt-2"></div>
                <div className="h-8 bg-muted rounded w-full animate-pulse mt-1"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-1"></div>
             </CardContent>
             <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
                <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-1"></div>
                <div className="h-4 bg-muted rounded w-full animate-pulse mt-1"></div>
                 <div className="h-8 bg-muted rounded w-full animate-pulse mt-2"></div>
             </CardFooter>
        </Card>
      );
    }

    return <LotCardClientContent lot={lot} auction={auction} badgeVisibilityConfig={badgeVisibilityConfig} platformSettings={platformSettings} onUpdate={onUpdate} />;
  }
