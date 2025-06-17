
'use client';

import type { Auction, Lot } from '@/types'; // Lot importada
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, CalendarDays, Clock, Eye, DollarSign, Gavel, Info, Car, Building, Truck, Share2, X, Facebook, MessageSquareText, Mail, Percent, Zap, TrendingUp, Crown } from 'lucide-react'; // Adicionado Share2 e ícones sociais
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

export default function LotListItem({ lot }: LotListItemProps) {
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

```
  </change>
  <change>
    <file>/home/user/studio/src/app/page.tsx</file>
    <content><![CDATA[

import AuctionCard from '@/components/auction-card';
import AuctionFilters from '@/components/auction-filters';
import HeroCarousel from '@/components/hero-carousel';
import PromoCard from '@/components/promo-card';
import FilterLinkCard from '@/components/filter-link-card'; // Import the new component
import { sampleAuctions, sampleLots } from '@/lib/sample-data';
import type { Auction, Lot } from '@/types';
import Link from 'next/link';
import { Landmark, Scale, FileText, Tags, CalendarX, CheckSquare, Star } from 'lucide-react';

export default function HomePage() {
  const auctions: Auction[] = sampleAuctions.slice(0, 10); // Pegar até 10 leilões ativos
  const featuredLots: Lot[] = sampleLots.filter(lot => lot.isFeatured).slice(0, 10); // Pegar até 10 lotes em destaque

  const filterLinksData = [
    {
      title: 'Leilões Judiciais',
      subtitle: 'Oportunidades de processos judiciais.',
      imageUrl: 'https://images.unsplash.com/photo-1589216532372-1c2a367900d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxMZWlsJUMzJUEzbyUyMEp1ZGljaWFsfGVufDB8fHx8MTc0OTk0MjE4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      imageAlt: 'Ícone Leilões Judiciais',
      dataAiHint: 'gavel justice',
      link: '/search?type=judicial',
      bgColorClass: 'bg-sky-50 dark:bg-sky-900/40 hover:border-sky-300',
    },
    {
      title: 'Leilões Extrajudiciais',
      subtitle: 'Negociações diretas e mais ágeis.',
      imageUrl: 'https://images.unsplash.com/photo-1654588834754-33346e3ee095?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxOHx8bGVpbCVDMyVBM28lMjBleHRyYSUyMGp1ZGljaWFsfGVufDB8fHx8MTc0OTk0MzI5NXww&ixlib=rb-4.1.0&q=80&w=1080',
      imageAlt: 'Ícone Leilões Extrajudiciais',
      dataAiHint: 'document agreement',
      link: '/search?type=extrajudicial',
      bgColorClass: 'bg-teal-50 dark:bg-teal-900/40 hover:border-teal-300',
    },
    {
      title: 'Venda Direta',
      subtitle: 'Compre sem a disputa de lances.',
      imageUrl: 'https://images.unsplash.com/photo-1642543348745-03b1219733d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxOXx8dmVuZGVyJTIwc2VtJTIwaW50ZXJtZWRpJUMzJUExcmlvc3xlbnwwfHx8fDE3NDk5NDM2NDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      imageAlt: 'Ícone Venda Direta',
      dataAiHint: 'property deal',
      link: '/search?type=direct_sale',
      bgColorClass: 'bg-amber-50 dark:bg-amber-900/40 hover:border-amber-300',
    },
    {
      title: 'Em Segunda Praça',
      subtitle: 'Novas chances com valores atrativos.',
      imageUrl: 'https://placehold.co/100x100.png',
      imageAlt: 'Ícone Segunda Praça',
      dataAiHint: 'auction discount',
      link: '/search?stage=second_praça',
      bgColorClass: 'bg-violet-50 dark:bg-violet-900/40 hover:border-violet-300',
    },
    {
      title: 'Leilões Encerrados',
      subtitle: 'Consulte o histórico de resultados.',
      imageUrl: 'https://placehold.co/100x100.png',
      imageAlt: 'Ícone Leilões Encerrados',
      dataAiHint: 'archive checkmark',
      link: '/search?status=encerrado',
      bgColorClass: 'bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300',
    },
    {
      title: 'Leilões Cancelados',
      subtitle: 'Veja os leilões que foram cancelados.',
      imageUrl: 'https://placehold.co/100x100.png',
      imageAlt: 'Ícone Leilões Cancelados',
      dataAiHint: 'stamp cancel',
      link: '/search?status=cancelado',
      bgColorClass: 'bg-rose-50 dark:bg-rose-900/40 hover:border-rose-300',
    },
  ];

  return (
    <div className="space-y-12">
      <HeroCarousel />

      <section>
        <h2 className="text-2xl font-bold text-center mb-6 font-headline">Explorar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {filterLinksData.map((card) => (
            <FilterLinkCard
              key={card.title}
              title={card.title}
              subtitle={card.subtitle}
              imageUrl={card.imageUrl}
              imageAlt={card.imageAlt}
              dataAiHint={card.dataAiHint}
              link={card.link}
              bgColorClass={card.bgColorClass}
            />
          ))}
        </div>
      </section>

      {featuredLots.length > 0 && (
        <section>
           <h2 className="text-2xl font-bold text-center mb-6 font-headline flex items-center justify-center">
            <Star className="h-7 w-7 mr-2 text-amber-500" /> Lotes em Destaque
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {featuredLots.map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>
        </section>
      )}
      
      <div>
        <h1 className="text-3xl font-bold mb-2 text-center font-headline">Leilões Ativos</h1>
        <p className="text-muted-foreground text-center mb-8">Descubra itens únicos e faça seus lances.</p>
        
        {/* <AuctionFilters /> Componente de filtros removido da home page */}

        {auctions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Nenhum leilão encontrado</h2>
            <p className="text-muted-foreground">Por favor, verifique mais tarde ou ajuste seus filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}

