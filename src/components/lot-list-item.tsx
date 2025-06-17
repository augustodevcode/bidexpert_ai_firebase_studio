
'use client';

import type { Auction, Lot } from '@/types'; // Lot importada
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MapPin, Eye, ListChecks, DollarSign, CalendarDays, Clock, Users, Gavel, Building, Car, Truck, Info, X, Facebook, MessageSquareText, Mail, Percent, Zap, TrendingUp, Crown } from 'lucide-react'; // Adicionado Share2 e ícones sociais
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect, useMemo } from 'react';
import { getAuctionStatusText, getLotStatusColor, sampleAuctions } from '@/lib/sample-data'; // Importado sampleAuctions
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
}

const TimeRemainingBadge: React.FC<TimeRemainingBadgeProps> = ({ endDate, status }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isEndingSoon, setIsEndingSoon] = useState(false);

  useEffect(() => {
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
  }, [endDate, status]);

  return (
    <Badge variant={isEndingSoon ? "destructive" : "outline"} className="text-xs font-medium">
      <Clock className="h-3 w-3 mr-1" />
      {timeRemaining}
    </Badge>
  );
};


interface LotListItemProps {
  lot: Lot;
}

function LotListItemClientContent({ lot }: LotListItemProps) {
  const [isFavorite, setIsFavorite] = useState(lot.isFavorite || false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [lotDetailUrl, setLotDetailUrl] = useState<string>(`/auctions/${lot.auctionId}/lots/${lot.id}`);
  const { toast } = useToast();

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
    const platformSettings = { mentalTriggerSettings: { popularityViewThreshold: 500, hotBidThreshold: 10, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true, showDiscountBadge: true, showUrgencyTimer: true }}; // Simulado

    if (platformSettings.mentalTriggerSettings?.showPopularityBadge && (lot.views || 0) > (platformSettings.mentalTriggerSettings.popularityViewThreshold || 500)) {
      triggers.push('MAIS VISITADO');
    }
    if (platformSettings.mentalTriggerSettings?.showHotBidBadge && (lot.bidsCount || 0) > (platformSettings.mentalTriggerSettings.hotBidThreshold || 10) && lot.status === 'ABERTO_PARA_LANCES') {
      triggers.push('LANCE QUENTE');
    }
    if (platformSettings.mentalTriggerSettings?.showExclusiveBadge && lot.isExclusive) {
        triggers.push('EXCLUSIVO');
    }
    return triggers;
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive]);


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

  return (
    <>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex flex-row">
          <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`} className="block w-1/3 md:w-1/4 flex-shrink-0">
            <div className="relative aspect-square h-full bg-muted">
              <Image
                src={lot.imageUrl}
                alt={lot.title}
                fill
                className="object-cover"
                data-ai-hint={lot.dataAiHint || 'imagem lote lista'}
              />
              <Badge className={`absolute top-2 left-2 text-xs px-2 py-1 z-10 ${getLotStatusColor(lot.status)}`}>
                {getAuctionStatusText(lot.status)}
              </Badge>
               <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                  {discountPercentage > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                      <Percent className="h-3 w-3 mr-1" /> {discountPercentage}% OFF
                    </Badge>
                  )}
                  {mentalTriggers.map(trigger => (
                    <Badge key={trigger} variant="secondary" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                      {trigger === 'MAIS VISITADO' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {trigger === 'LANCE QUENTE' && <Zap className="h-3 w-3 mr-1 text-red-500 fill-red-500" />}
                      {trigger === 'EXCLUSIVO' && <Crown className="h-3 w-3 mr-1 text-purple-600" />}
                      {trigger}
                    </Badge>
                  ))}
                </div>
            </div>
          </Link>

          <div className="flex flex-col flex-grow">
            <CardContent className="p-4 flex-grow space-y-1.5">
              <div className="flex justify-between items-start">
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                  <h3 className="text-md font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2">
                    {lot.title}
                  </h3>
                </Link>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}>
                        <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviewOpen} aria-label="Pré-visualizar Lote">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Pré-visualizar Lote</p></TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Compartilhar">
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

              <p className="text-sm text-muted-foreground">
                Lote {lot.number || lot.id.replace('LOTE','')} ({lot.type})
              </p>
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{displayLocation}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Eye className="h-3 w-3 mr-1" />
                <span>{lot.views} Visitas</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-dashed">
                <div className="flex-1 pr-2">
                  <p className="font-medium">1ª Praça/Leilão:</p>
                  <p>Data: {lot.lotSpecificAuctionDate ? format(new Date(lot.lotSpecificAuctionDate), "dd/MM HH:mm", { locale: ptBR }) : displayAuctionDate}</p>
                  <p>Inicial: R$ {lot.initialPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/D'}</p>
                </div>
                {lot.secondAuctionDate && (
                  <div className="flex-1 pl-2 sm:border-l sm:border-dashed mt-2 sm:mt-0">
                    <p className="font-medium">2ª Praça/Leilão:</p>
                    <p>Data: {displaySecondAuctionDate}</p>
                    <p>Inicial: R$ {lot.secondInitialPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/D'}</p>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="p-4 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex-grow">
                <p className="text-xs text-muted-foreground">{lot.bidsCount && lot.bidsCount > 0 ? 'Lance Atual' : 'Lance Inicial'}</p>
                <p className={`text-xl font-bold ${isPast(new Date(lot.endDate)) ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                  R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-2">
                  <TimeRemainingBadge endDate={lot.endDate} status={lot.status} />
                  <div className={`flex items-center gap-1 ${isPast(new Date(lot.endDate)) ? 'line-through' : ''}`}>
                    <Gavel className="h-3 w-3" />
                    <span>{lot.bidsCount || 0} Lances</span>
                  </div>
                  <span className={`font-semibold ${isPast(new Date(lot.endDate)) ? 'text-muted-foreground line-through' : 'text-foreground'}`}>Lote {lot.number || lot.id.replace('LOTE', '')}</span>
                </div>
              </div>
              <Button asChild className="w-full md:w-auto mt-2 md:mt-0" size="sm">
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>Ver Detalhes</Link>
              </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
      <LotPreviewModal
        lot={lot}
        auction={sampleAuctions.find(a => a.id === lot.auctionId)}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </>
  );
}

// Exporta um wrapper para manter a lógica do 'use client' separada.
// A lógica 'isClient' aqui é para o caso de precisarmos de renderização condicional que dependa do client
// para coisas como localStorage, mas o componente principal já é client-side.
export default function LotListItemWrapper({ lot }: LotListItemProps) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
      setIsClient(true);
    }, []);

    if (!isClient) {
      // Poderia retornar um Skeleton aqui se necessário
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

    return <LotListItemClientContent lot={lot} />;
  }

    