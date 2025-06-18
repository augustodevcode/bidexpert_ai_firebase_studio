
'use client';

import type { Lot, PlatformSettings, BadgeVisibilitySettings } from '@/types'; // Adicionado PlatformSettings e BadgeVisibilitySettings
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MapPin, Eye, ListChecks, DollarSign, CalendarDays, Clock, Users, Gavel, Building, Car, Truck, Info, X, Facebook, MessageSquareText, Mail, Percent, Zap, TrendingUp, Crown } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect, useMemo } from 'react';
import { getAuctionStatusText, getLotStatusColor, sampleAuctions, samplePlatformSettings } from '@/lib/sample-data'; // Importado samplePlatformSettings
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModal from './lot-preview-modal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TimeRemainingBadgeProps {
  endDate: Date | string;
  status: Lot['status'];
  showUrgencyTimer?: boolean; // Adicionado para controle
}

const TimeRemainingBadge: React.FC<TimeRemainingBadgeProps> = ({ endDate, status, showUrgencyTimer }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEndingSoon, setIsEndingSoon] = useState(false);

  useEffect(() => {
    if (showUrgencyTimer === false) { // Se o timer de urgência estiver desabilitado, não calcula
        setTimeRemaining(getAuctionStatusText(status)); // Mostra apenas o status
        setIsEndingSoon(false);
        return;
    }

    const calculateTime = () => {
      const now = new Date();
      const end = endDate instanceof Date ? endDate : new Date(endDate);

      if (isPast(end) || status !== 'ABERTO_PARA_LANCES') {
        setTimeRemaining(getAuctionStatusText(status === 'ABERTO_PARA_LANCES' && isPast(end) ? 'ENCERRADO' : status));
        setIsEndingSoon(false);
        return;
      }

      const totalSeconds = differenceInSeconds(end, now);
      if (totalSeconds <= 0) {
        setTimeRemaining('Encerrado');
        setIsEndingSoon(false);
        return;
      }

      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      setIsEndingSoon(days === 0 && hours < 2); 

      if (days > 0) setTimeRemaining(`${days}d ${hours}h`);
      else if (hours > 0) setTimeRemaining(`${hours}h ${minutes}m`);
      else if (minutes > 0) setTimeRemaining(`${minutes}m ${seconds}s`);
      else if (seconds > 0) setTimeRemaining(`${seconds}s`);
      else setTimeRemaining('Encerrando!');
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endDate, status, showUrgencyTimer]);

  if (showUrgencyTimer === false) { // Se desabilitado, mostra apenas o status (já definido no useEffect)
    return <Badge variant="outline" className="text-xs font-medium">{timeRemaining}</Badge>;
  }

  return (
    <Badge variant={isEndingSoon ? "destructive" : "outline"} className="text-xs font-medium">
      <Clock className="h-3 w-3 mr-1" />
      {timeRemaining}
    </Badge>
  );
};


interface LotCardProps {
  lot: Lot;
  badgeVisibilityConfig?: BadgeVisibilitySettings; // Nova prop
}

// Renomeado para LotCardClientContent para melhor clareza, já que o wrapper exportado ainda é LotCard
const LotCardClientContent: React.FC<LotCardProps> = ({ lot, badgeVisibilityConfig }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [lotDetailUrl, setLotDetailUrl] = useState<string>(`/auctions/${lot.auctionId}/lots/${lot.id}`);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Usar as configurações globais como fallback se badgeVisibilityConfig não for passado
  const platformMentalTriggers = samplePlatformSettings.mentalTriggerSettings || {};
  const sectionBadges = badgeVisibilityConfig || samplePlatformSettings.sectionBadgeVisibility?.searchGrid || {}; // Fallback para config de searchGrid se não especificado

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
    const settings = platformMentalTriggers; // Use as configurações globais

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
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive, platformMentalTriggers, sectionBadges]);


  return (
    <>
    <Card className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg group">
      <div className="relative">
        <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`} className="block">
          <div className="aspect-[16/10] relative bg-muted">
            <Image
              src={lot.imageUrl}
              alt={lot.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={lot.dataAiHint || 'imagem lote'}
            />
            {/* Main Status Badge - Condicional */}
            {sectionBadges.showStatusBadge !== false && (
              <Badge className={`absolute top-2 left-2 text-xs px-2 py-1 z-10 ${getLotStatusColor(lot.status)}`}>
                {getAuctionStatusText(lot.status)}
              </Badge>
            )}
            
            {/* Mental Trigger Badges - stack below main status or to the right */}
            <div className={`absolute top-2 ${sectionBadges.showStatusBadge !== false ? 'mt-7 sm:mt-0 sm:top-2' : 'top-2'} right-2 flex flex-col items-end gap-1 z-10`}>
              {sectionBadges.showDiscountBadge !== false && platformMentalTriggers.showDiscountBadge && discountPercentage > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 animate-pulse">
                  <Percent className="h-3 w-3 mr-1" /> {discountPercentage}% OFF
                </Badge>
              )}
              {mentalTriggers.map(trigger => {
                let showThisTrigger = false;
                if (trigger === 'MAIS VISITADO' && sectionBadges.showPopularityBadge !== false && platformMentalTriggers.showPopularityBadge) showThisTrigger = true;
                if (trigger === 'LANCE QUENTE' && sectionBadges.showHotBidBadge !== false && platformMentalTriggers.showHotBidBadge) showThisTrigger = true;
                if (trigger === 'EXCLUSIVO' && sectionBadges.showExclusiveBadge !== false && platformMentalTriggers.showExclusiveBadge) showThisTrigger = true;

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

            <div className="absolute top-10 right-2 flex flex-col space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
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
              <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" aria-label="Compartilhar">
                        <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Compartilhar</p></TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('x', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                      <X className="h-3.5 w-3.5" /> X (Twitter)
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('facebook', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                      <Facebook className="h-3.5 w-3.5" /> Facebook
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('whatsapp', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                      <MessageSquareText className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('email', lotDetailUrl, lot.title)} className="flex items-center gap-2 text-xs">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Link>
      </div>

      <CardContent className="p-3 flex-grow space-y-1.5">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{displayLocation}</span>
          </div>
          <div className="flex items-center gap-1">
            {getTypeIcon(lot.type)}
            <span>{lot.type}</span>
          </div>
        </div>

        <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
          <h3 className="text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2">
            {lot.title}
          </h3>
        </Link>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                <span>{lot.auctionName}</span>
            </div>
            <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{lot.views}</span>
            </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
        <div className="w-full">
          <p className="text-xs text-muted-foreground">Lance Mínimo</p>
          <p className={`text-xl font-bold ${isPast(new Date(lot.endDate)) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
            R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`flex items-center text-xs text-muted-foreground ${isPast(new Date(lot.endDate)) ? 'line-through' : ''}`}>
          <CalendarDays className="h-3 w-3 mr-1" />
          <span>{format(new Date(lot.endDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
        </div>
        
        <div className="w-full flex justify-between items-center text-xs">
            <TimeRemainingBadge endDate={lot.endDate} status={lot.status} showUrgencyTimer={sectionBadges.showUrgencyTimer !== false && platformMentalTriggers.showUrgencyTimer} />
            <div className={`flex items-center gap-1 ${isPast(new Date(lot.endDate)) ? 'text-muted-foreground line-through' : ''}`}>
                <Gavel className="h-3 w-3" />
                <span>{lot.bidsCount || 0} Lances</span>
            </div>
            <span className={`font-semibold ${isPast(new Date(lot.endDate)) ? 'text-muted-foreground line-through' : 'text-foreground'}`}>Lote {lot.number || lot.id.replace('LOTE', '')}</span>
        </div>
         <Button asChild className="w-full mt-2" size="sm">
            <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>Ver Detalhes do Lote</Link>
        </Button>
      </CardFooter>
    </Card>
    <LotPreviewModal
        lot={lot}
        auction={sampleAuctions.find(a => a.id === lot.auctionId)} // Pass the parent auction if available
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </>
  );
}


export default function LotCard({ lot, badgeVisibilityConfig }: LotCardProps) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
      setIsClient(true);
    }, []);
  
    if (!isClient) {
      // Skeleton para SSR ou enquanto JS não carregou
      return (
        <Card className="flex flex-col overflow-hidden h-full shadow-md rounded-lg group">
             <div className="relative aspect-[16/10] bg-muted animate-pulse"></div>
             <CardContent className="p-3 flex-grow space-y-1.5">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
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
  
    return <LotCardClientContent lot={lot} badgeVisibilityConfig={badgeVisibilityConfig} />;
  }

