
'use client';

import * as React from 'react'; // Adicionado import do React
import type { Auction, Lot, PlatformSettings, BadgeVisibilitySettings, MentalTriggerSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MapPin, Eye, ListChecks, DollarSign, CalendarDays, Clock, Users, Gavel, Building, Car, Truck, Info, X, Facebook, MessageSquareText, Mail, Percent, Zap, TrendingUp, Crown, Tag, ChevronRight, Layers } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect, useMemo } from 'react';
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data';
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
import EntityEditMenu from './entity-edit-menu';

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
  auction?: Auction;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  platformSettings: PlatformSettings;
}

function LotListItemClientContent({ lot, auction, badgeVisibilityConfig, platformSettings }: LotListItemProps) {
  const [isFavorite, setIsFavorite] = useState(lot.isFavorite || false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [lotDetailUrl, setLotDetailUrl] = useState<string>(`/auctions/${lot.auctionId}/lots/${lot.id}`);
  const { toast } = useToast();

  const mentalTriggersGlobalSettings = platformSettings.mentalTriggerSettings || {};
  const sectionBadges = badgeVisibilityConfig || platformSettings.sectionBadgeVisibility?.searchList || {
    showStatusBadge: true,
    showDiscountBadge: true,
    showUrgencyTimer: true,
    showPopularityBadge: true,
    showHotBidBadge: true,
    showExclusiveBadge: true,
  };

  const showCountdownOnThisCard = platformSettings.showCountdownOnCards !== false;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLotDetailUrl(`${window.location.origin}/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
      setIsFavorite(isLotFavoriteInStorage(lot.id));
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
    return <Info className="h-3 w-3 text-muted-foreground" />;
  };

  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';
  const displayAuctionDate = lot.auctionDate && !isNaN(new Date(lot.auctionDate as string).getTime())
    ? format(new Date(lot.auctionDate as string), "dd/MM - HH:mm", { locale: ptBR })
    : 'N/D';
  const displaySecondAuctionDate = lot.secondAuctionDate && !isNaN(new Date(lot.secondAuctionDate as string).getTime())
    ? format(new Date(lot.secondAuctionDate as string), "dd/MM - HH:mm", { locale: ptBR })
    : 'N/D';

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
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image Column */}
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-auto bg-muted">
            <Link href={lotDetailUrl} className="block h-full w-full">
              <Image
                src={lot.imageUrl || 'https://placehold.co/600x400.png'}
                alt={lot.title}
                fill
                className="object-cover"
                data-ai-hint={lot.dataAiHint || 'imagem lote lista'}
              />
            </Link>
            <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10">
              {sectionBadges.showStatusBadge !== false && (
                <Badge className={`text-xs px-1.5 py-0.5 ${getLotStatusColor(lot.status)} border-current`}>
                  {getAuctionStatusText(lot.status)}
                </Badge>
              )}
            </div>
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
              {sectionBadges.showDiscountBadge !== false && mentalTriggersGlobalSettings.showDiscountBadge && discountPercentage > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 animate-pulse">
                  <Percent className="h-3 w-3 mr-0.5" /> {discountPercentage}% OFF
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
          </div>

          {/* Content Column */}
          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                 <Link href={lotDetailUrl}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={lot.title}>
                    {lot.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={`Lote ${lot.number || lot.id.replace('LOTE','')} | Leilão: ${lot.auctionName}`}>
                  Lote {lot.number || lot.id.replace('LOTE','')} | Leilão: {lot.auctionName}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-0.5">
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFavoriteToggle}><Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} /></Button></TooltipTrigger><TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviewOpen}><Eye className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>Pré-visualizar</p></TooltipContent></Tooltip>
                {(lot.latitude || lot.longitude || lot.mapAddress || lot.mapEmbedUrl) && (
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMapPreviewOpen}><MapPin className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>Ver Mapa</p></TooltipContent></Tooltip>
                )}
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Compartilhar">
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>Compartilhar</p></TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><a href={getSocialLink('x', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs"><X className="h-3.5 w-3.5" /> X (Twitter)</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('facebook', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs"><Facebook className="h-3.5 w-3.5" /> Facebook</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs"><MessageSquareText className="h-3.5 w-3.5" /> WhatsApp</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('email', lotDetailUrl, lot.title)} className="flex items-center gap-2 text-xs"><Mail className="h-3.5 w-3.5" /> Email</a></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="flex items-center text-xs text-muted-foreground mb-1">
                <MapPin className="h-3 w-3 mr-1 text-primary/80 flex-shrink-0" />
                <span className="truncate" title={displayLocation}>{displayLocation}</span>
                <span className="mx-1.5 text-muted-foreground/50">|</span>
                <Tag className="h-3 w-3 mr-1 text-primary/80 flex-shrink-0" />
                <span className="truncate" title={lot.type}>{lot.type}</span>
                {lot.subcategoryName && (
                  <>
                    <ChevronRight className="h-3 w-3 mx-0.5 text-muted-foreground/70 flex-shrink-0" />
                    <Layers className="h-3 w-3 mr-1 text-primary/70 flex-shrink-0" />
                    <span className="truncate" title={lot.subcategoryName}>{lot.subcategoryName}</span>
                  </>
                )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{lot.description}</p>

            <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed">
              <div>
                <p className="text-xs text-muted-foreground">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
                <p className={`text-2xl font-bold ${lot.endDate && isPast(new Date(lot.endDate as string)) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                  R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {lot.bidIncrementStep && (
                    <p className="text-xs text-muted-foreground">
                    Incremento: R$ {lot.bidIncrementStep.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                )}
              </div>
               <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0">
                    <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Detalhes do Lote
                    </Link>
                </Button>
            </div>
          </div>
        </div>
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

export default function LotListItem({ lot, auction, badgeVisibilityConfig, platformSettings }: LotListItemProps) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
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

    return <LotListItemClientContent lot={lot} auction={auction} badgeVisibilityConfig={badgeVisibilityConfig} platformSettings={platformSettings} />;
  }

