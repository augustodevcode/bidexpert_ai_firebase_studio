
'use client';

import type { Auction, Lot, PlatformSettings, BadgeVisibilitySettings, MentalTriggerSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card'; 
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MapPin, Eye, ListChecks, DollarSign, CalendarDays, Clock, Users, Gavel, Building, Car, Truck, Info, X, Facebook, MessageSquareText, Mail, Percent, Zap, TrendingUp, Crown } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect, useMemo } from 'react';
import { getAuctionStatusText, getLotStatusColor, sampleAuctions, samplePlatformSettings } from '@/lib/sample-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModal from './lot-preview-modal';
import LotMapPreviewModal from './lot-map-preview-modal'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TimeRemainingBadgeProps {
  endDate: Date | string;
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
    const calculateTime = () => {
      const now = new Date();
      const end = endDate instanceof Date ? endDate : new Date(endDate);

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


interface LotListItemProps {
  lot: Lot;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  platformSettingsProp?: PlatformSettings; 
}

function LotListItemClientContent({ lot, badgeVisibilityConfig, platformSettingsProp }: LotListItemProps) {
  const [isFavorite, setIsFavorite] = useState(lot.isFavorite || false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false); 
  const [lotDetailUrl, setLotDetailUrl] = useState<string>(`/auctions/${lot.auctionId}/lots/${lot.id}`);
  const { toast } = useToast();

  const platformSettings = platformSettingsProp || samplePlatformSettings;
  const mentalTriggersGlobalSettings = platformSettings.mentalTriggerSettings || {};
  const sectionBadges = badgeVisibilityConfig || platformSettings.sectionBadgeVisibility?.searchList || {}; 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLotDetailUrl(`${window.location.origin}/auctions/${lot.auctionId}/lots/${lot.id}`);
      setIsFavorite(isLotFavoriteInStorage(lot.id));
    }
  }, [lot.id, lot.auctionId]);

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
  
  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch(platform) {
      case 'x':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  }

  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';
  const displayAuctionDate = lot.auctionDate && !isNaN(new Date(lot.auctionDate).getTime())
    ? format(new Date(lot.auctionDate), "dd/MM - HH:mm", { locale: ptBR })
    : 'N/D';
  const displaySecondAuctionDate = lot.secondAuctionDate && !isNaN(new Date(lot.secondAuctionDate).getTime())
    ? format(new Date(lot.secondAuctionDate), "dd/MM - HH:mm", { locale: ptBR })
    : 'N/D';

  const discountPercentage = useMemo(() => {
    if (lot.initialPrice && lot.secondInitialPrice && lot.secondInitialPrice < lot.initialPrice && (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE')) {
      return Math.round(((lot.initialPrice - lot.secondInitialPrice) / lot.initialPrice) * 100);
    }
    return lot.discountPercentage || 0;
  }, [lot.initialPrice, lot.secondInitialPrice, lot.status, lot.discountPercentage]);

  const mentalTriggers = useMemo(() => {
    const triggers = lot.additionalTriggers ? [...lot.additionalTriggers] : [];
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
    return triggers;
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive, mentalTriggersGlobalSettings, sectionBadges]);

  return (
    <>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-square">
            <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`} className="block h-full w-full">
              <Image
                src={lot.imageUrl}
                alt={lot.title}
                fill
                className="object-cover"
                data-ai-hint={lot.dataAiHint || 'imagem lote lista'}
              />
            </Link>
            {sectionBadges.showStatusBadge !== false && (
                <Badge className={`absolute top-2 left-2 text-xs px-2 py-1 z-10 ${getLotStatusColor(lot.status)}`}>
                  {getAuctionStatusText(lot.status)}
                </Badge>
            )}
            <div className={`absolute top-2 ${sectionBadges.showStatusBadge !== false ? 'mt-7 sm:mt-0 sm:top-2' : 'top-2'} right-2 flex flex-col items-end gap-1 z-10`}>
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
                        {trigger === 'MAIS VISITADO' && <TrendingUp className="h-3 w-3 mr-1" />}
                        {trigger === 'LANCE QUENTE' && <Zap className="h-3 w-3 mr-1 text-red-500 fill-red-500" />}
                        {trigger === 'EXCLUSIVO' && <Crown className="h-3 w-3 mr-1 text-purple-600" />}
                        {trigger}
                        </Badge>
                    );
                })}
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-row space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}>
                    <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" onClick={handlePreviewOpen} aria-label="Pré-visualizar Lote">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Pré-visualizar Lote</p></TooltipContent>
              </Tooltip>
              {(lot.latitude || lot.longitude || lot.mapAddress || lot.mapEmbedUrl) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" onClick={handleMapPreviewOpen} aria-label="Ver no Mapa">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Ver no Mapa</p></TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1">
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                    <h3 className="text-lg font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2">
                        {lot.title}
                    </h3>
                </Link>
                <div className="md:hidden flex items-center space-x-1 flex-shrink-0">
                 <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}>
                        <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent>
                  </Tooltip>
                   {(lot.latitude || lot.longitude || lot.mapAddress || lot.mapEmbedUrl) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMapPreviewOpen} aria-label="Ver no Mapa">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Ver no Mapa</p></TooltipContent>
                    </Tooltip>
                  )}
                </div>
            </div>
            <p className="text-xs text-muted-foreground mb-0.5">Lote {lot.number || lot.id.replace('LOTE','')} | {lot.type}</p>
            <p className="text-xs text-muted-foreground mb-2 flex items-center">
              <MapPin className="h-3 w-3 mr-1" /> {displayLocation}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{lot.description}</p>
            
            <div className="flex flex-col sm:flex-row justify-between text-xs text-muted-foreground mb-3 pt-2 border-t border-dashed">
                <div className="mb-2 sm:mb-0">
                  <p className="font-medium">1ª Praça/Leilão:</p>
                  <p>Data: {lot.lotSpecificAuctionDate ? format(new Date(lot.lotSpecificAuctionDate), "dd/MM HH:mm", { locale: ptBR }) : displayAuctionDate}</p>
                  <p>Lance Inicial: R$ {lot.initialPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/D'}</p>
                </div>
                {lot.secondAuctionDate && (
                  <div className="sm:pl-2 sm:border-l sm:border-dashed">
                    <p className="font-medium">2ª Praça/Leilão:</p>
                    <p>Data: {displaySecondAuctionDate}</p>
                    <p>Lance Inicial: R$ {lot.secondInitialPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/D'}</p>
                  </div>
                )}
            </div>

            <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
                <p className={`text-2xl font-bold ${isPast(new Date(lot.endDate)) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                  R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                 <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-2">
                   <TimeRemainingBadge 
                        endDate={lot.endDate} 
                        status={lot.status} 
                        showUrgencyTimer={sectionBadges.showUrgencyTimer !== false && mentalTriggersGlobalSettings.showUrgencyTimer}
                        urgencyThresholdDays={mentalTriggersGlobalSettings.urgencyTimerThresholdDays}
                        urgencyThresholdHours={mentalTriggersGlobalSettings.urgencyTimerThresholdHours}
                    />
                    <div className={`flex items-center gap-1 ${isPast(new Date(lot.endDate)) ? 'line-through' : ''}`}>
                        <Gavel className="h-3 w-3" />
                        <span>{lot.bidsCount || 0} Lances</span>
                    </div>
                </div>
              </div>
              <Button asChild size="sm" className="w-full md:w-auto">
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
      <LotPreviewModal
        lot={lot}
        auction={sampleAuctions.find(a => a.id === lot.auctionId)}
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

export default function LotListItem({ lot, badgeVisibilityConfig, platformSettingsProp }: LotListItemProps) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
      setIsClient(true);
    }, []);
  
    if (!isClient) {
      // Skeleton para SSR ou enquanto JS não carregou
      return (
        <Card className="flex flex-row overflow-hidden h-full shadow-md rounded-lg group">
             <div className="relative aspect-square h-full bg-muted animate-pulse w-1/3 md:w-1/4 flex-shrink-0"></div>
             <div className="flex flex-col flex-grow">
                <CardContent className="p-4 flex-grow space-y-1.5">
                    <div className="h-5 bg-muted rounded w-3/4 animate-pulse"></div>
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
  
    return <LotListItemClientContent lot={lot} badgeVisibilityConfig={badgeVisibilityConfig} platformSettingsProp={platformSettingsProp} />;
  }

