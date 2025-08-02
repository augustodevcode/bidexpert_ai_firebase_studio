

'use client';

import * as React from 'react'; // Adicionado import do React
import type { Auction, Lot, PlatformSettings, BadgeVisibilitySettings, MentalTriggerSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MapPin, Eye, ListChecks, DollarSign, CalendarDays, Clock, Users, Gavel, Building, Car, Truck, Info, Percent, Zap, TrendingUp, Crown, Tag, ChevronRight, Layers, Pencil, X, Facebook, MessageSquareText, Mail } from 'lucide-react';
import { format, isPast, differenceInSeconds, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect, useMemo } from 'react';
import { getAuctionStatusText, getLotStatusColor, getEffectiveLotEndDate, slugify, getAuctionStatusColor } from '@/lib/ui-helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModal from './lot-preview-modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntityEditMenu from './entity-edit-menu';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { hasPermission } from '@/lib/permissions';

const LotMapPreviewModal = dynamic(() => import('./lot-map-preview-modal'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-background/50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});


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
  const [remaining, setRemaining] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!endDate || !isValid(new Date(endDate))) {
      setRemaining(getAuctionStatusText(status));
      setIsUrgent(false);
      return;
    }

    const interval = setInterval(() => {
      const end = new Date(endDate as string);
      if (isPast(end)) {
        setRemaining('Encerrado');
        clearInterval(interval);
        setIsUrgent(false);
        return;
      }

      const totalSecondsLeft = differenceInSeconds(end, new Date());
             if (totalSecondsLeft <= 0) {
                setRemaining('Encerrado');
                clearInterval(interval);
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
                  setRemaining(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
                } else {
                  setRemaining(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
                }
            } else {
                 const days = Math.floor(totalSecondsLeft / (3600 * 24));
                const hours = Math.floor((totalSecondsLeft % (3600 * 24)) / 3600);
                const minutes = Math.floor((totalSecondsLeft % 3600) / 60);

                if (days > 0) setRemaining(`${days}d ${hours}h`);
                else if (hours > 0) setRemaining(`${hours}h ${minutes}m`);
                else if (minutes > 0) setRemaining(`${minutes}m`);
                else setRemaining('Encerrando!');
            }

        }, 1000);

        return () => clearInterval(interval);
  }, [endDate, status, showUrgencyTimer, urgencyThresholdDays, urgencyThresholdHours]);

  return (
    <Badge variant={isUrgent ? "destructive" : "outline"} className="text-xs font-medium">
      <Clock className="h-3 w-3 mr-1" />
      {remaining}
    </Badge>
  );
};


interface LotListItemProps {
  lot: Lot;
  auction?: Auction;
  badgeVisibilityConfig?: BadgeVisibilitySettings;
  platformSettings: PlatformSettings;
  onUpdate?: () => void;
}

function LotListItemClientContent({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate }: LotListItemProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isViewed, setIsViewed] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [lotDetailUrl, setLotDetailUrl] = useState<string>(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
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
  
  const effectiveEndDate = useMemo(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);
  
  const [formattedEndDate, setFormattedEndDate] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLotDetailUrl(`${window.location.origin}/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
      setIsFavorite(isLotFavoriteInStorage(lot.id));
      setIsViewed(getRecentlyViewedIds().includes(lot.id));
    }
     if (effectiveEndDate && isValid(effectiveEndDate)) {
      setFormattedEndDate(format(effectiveEndDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
    } else {
      setFormattedEndDate(null);
    }
  }, [lot.id, lot.auctionId, lot.publicId, effectiveEndDate]);

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

  const getTypeIcon = (type?: string) => {
    if (!type) {
      return <Info className="h-3 w-3 text-muted-foreground" />;
    }
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
            {auction?.seller?.logoUrl && (
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href={auction.seller?.slug ? `/sellers/${auction.seller.slug}` : '#'} onClick={(e) => e.stopPropagation()} className="absolute bottom-1 right-1 z-10">
                            <Avatar className="h-10 w-10 border-2 bg-background border-border shadow-md">
                                <AvatarImage src={auction.seller.logoUrl} alt={auction.seller.name} data-ai-hint={auction.seller.dataAiHintLogo || 'logo comitente pequeno'}/>
                                <AvatarFallback>{auction.seller.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Comitente: {auction.seller.name}</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Content Column */}
          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                 <div className="flex items-center gap-2 mb-1">
                     <Badge 
                        className={`text-xs px-1.5 py-0.5 shadow-sm
                            ${getLotStatusColor(lot.status)}
                        `}
                        >
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
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={`Leilão: ${lot.auctionName}`}>
                  Leilão: {lot.auctionName || 'Não especificado'}
                </p>
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
                <p className={`text-2xl font-bold ${effectiveEndDate && isPast(effectiveEndDate) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                  R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {formattedEndDate && (
                  <div className="flex items-center text-xs text-muted-foreground pt-1">
                    <CalendarDays className="h-3 w-3 mr-1"/>
                    <span>Prazo: {formattedEndDate}</span>
                  </div>
                )}
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
       <LotMapPreviewModal
        lot={lot}
        platformSettings={platformSettings}
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
      />
    </>
  );
}


export default function LotListItem({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate }: LotListItemProps & {onUpdate?: () => void}) {
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

    return <LotListItemClientContent lot={lot} auction={auction} badgeVisibilityConfig={badgeVisibilityConfig} platformSettings={platformSettings} onUpdate={onUpdate} />;
  }
