
'use client';

import type { Auction, Lot } from '@/types'; // Lot importada
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, CalendarDays, Clock, Eye, DollarSign, Gavel } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data';

interface LotListItemProps {
  lot: Lot; // Usar Lot em vez de Auction['lots'][0] para consistência
}

export default function LotListItem({ lot }: LotListItemProps) {
  const [isFavorite, setIsFavorite] = useState(lot.isFavorite || false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isPast, setIsPast] = useState<boolean>(false);

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
    setIsFavorite(!isFavorite);
  };
  
  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';
  const displayAuctionDate = lot.auctionDate && !isNaN(new Date(lot.auctionDate).getTime())
    ? format(new Date(lot.auctionDate), "dd/MM - HH:mm", { locale: ptBR })
    : 'N/D';
  const displaySecondAuctionDate = lot.secondAuctionDate && !isNaN(new Date(lot.secondAuctionDate).getTime())
    ? format(new Date(lot.secondAuctionDate), "dd/MM - HH:mm", { locale: ptBR })
    : 'N/D';


  return (
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
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleFavoriteToggle}>
                <Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
              </Button>
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
  );
}

    