'use client';

import type { Auction, Lot } from '@/types'; // Lot importada
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, CalendarDays, Clock, Eye, DollarSign, Gavel, Info, Car, Building, Truck, Share2, X, Facebook, MessageSquareText, Mail } from 'lucide-react'; // Adicionado Share2 e ícones sociais
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import LotPreviewModal from './lot-preview-modal'; // Import the new modal
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip

interface LotListItemProps {
  lot: Lot; 
}

export default function LotListItem({ lot }: LotListItemProps) {
  const [isFavorite, setIsFavorite] = useState(lot.isFavorite || false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isPast, setIsPast] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); // State for the modal
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

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = lot.endDate instanceof Date ? lot.endDate : new Date(lot.endDate);
      
      setIsPast(now > endDate);

      if (now > endDate) {
        if (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE') {
          setTimeRemaining(getAuctionStatusText('ENCERRADO'));
        } else {
          setTimeRemaining(getAuctionStatusText(lot.status));
        }
        return;
      }
      
      if (lot.status === 'EM_BREVE') {
        setTimeRemaining(`Inicia em ${format(endDate, "dd/MM HH:mm", { locale: ptBR })}`);
        return;
      }

      const days = differenceInDays(endDate, now);
      const hours = differenceInHours(endDate, now) % 24;
      const minutes = differenceInMinutes(endDate, now) % 60;

      if (days > 0) {
        setTimeRemaining(`em: ${days} dia(s)`);
      } else if (hours > 0) {
        setTimeRemaining(`em: ${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`em: ${minutes}m`);
      } else {
        setTimeRemaining('Encerrando');
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [lot.endDate, lot.status]);

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
              <Badge className={`absolute top-2 left-2 text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`}>
                {getAuctionStatusText(lot.status)}
              </Badge>
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
                  <p>Data: {displayAuctionDate}</p>
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
                <p className={`text-xl font-bold ${isPast ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                  R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-2">
                  <div className={`flex items-center gap-1 ${isPast ? 'line-through' : ''}`}>
                    <Clock className="h-3 w-3" />
                    <span>{timeRemaining}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${isPast ? 'line-through' : ''}`}>
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
