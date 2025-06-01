
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, History, AlertCircle, CalendarDays, Clock, Gavel } from 'lucide-react';
import { sampleLots, getLotStatusColor, getAuctionStatusText } from '@/lib/sample-data';
import type { Lot } from '@/types';
import { getRecentlyViewedIds } from '@/lib/recently-viewed-store';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BrowsingHistoryPage() {
  const [viewedLots, setViewedLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const ids = getRecentlyViewedIds();
    const lotsFromHistory = ids.map(id => sampleLots.find(lot => lot.id === id)).filter(lot => lot !== undefined) as Lot[];
    setViewedLots(lotsFromHistory);
    setIsLoading(false);
  }, []);

  const getTimeRemaining = (endDateStr: Date | string, status: LotStatus): {text: string, isPast: boolean} => {
    const now = new Date();
    const endDate = new Date(endDateStr);
    const isPast = now > endDate;

    if (isPast) {
      if (status === 'ABERTO_PARA_LANCES' || status === 'EM_BREVE') {
        return { text: getAuctionStatusText('ENCERRADO'), isPast: true };
      }
      return { text: getAuctionStatusText(status), isPast: true };
    }
    
    if (status === 'EM_BREVE') {
      return {text: `Inicia em ${format(endDate, "dd/MM HH:mm", { locale: ptBR })}`, isPast: false};
    }

    const days = differenceInDays(endDate, now);
    const hours = differenceInHours(endDate, now) % 24;
    const minutes = differenceInMinutes(endDate, now) % 60;

    if (days > 0) {
      return { text: `em: ${days} dia(s)`, isPast: false };
    } else if (hours > 0) {
      return { text: `em: ${hours}h ${minutes}m`, isPast: false };
    } else if (minutes > 0) {
      return { text: `em: ${minutes}m`, isPast: false };
    }
    return { text: 'Encerrando', isPast: false };
  };


  if (!isClient || isLoading) {
    // Pode mostrar um skeleton loader aqui se desejar
    return (
        <div className="space-y-8">
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <History className="h-7 w-7 mr-3 text-primary" />
                Histórico de Navegação
            </CardTitle>
            <CardDescription>
                Lotes que você visualizou recentemente.
            </CardDescription>
            </CardHeader>
            <CardContent className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                        <Card key={i} className="overflow-hidden">
                            <div className="relative aspect-video bg-muted rounded-t-lg"></div>
                            <CardContent className="p-4 space-y-2">
                                <div className="h-5 bg-muted rounded w-3/4"></div>
                                <div className="h-4 bg-muted rounded w-1/2"></div>
                                <div className="h-4 bg-muted rounded w-1/3"></div>
                            </CardContent>
                            <CardFooter className="p-4 border-t">
                                <div className="h-9 bg-muted rounded w-full"></div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
        </div>
    );
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <History className="h-7 w-7 mr-3 text-primary" />
            Histórico de Navegação
          </CardTitle>
          <CardDescription>
            Lotes que você visualizou recentemente. O histórico é salvo no seu navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewedLots.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Item no Histórico</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Quando você visualizar lotes, eles aparecerão aqui.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/search">Buscar Lotes</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {viewedLots.map((lot) => {
                const timeInfo = getTimeRemaining(lot.endDate, lot.status);
                return (
                  <Card key={lot.id} className="overflow-hidden shadow-md flex flex-col">
                    <div className="relative aspect-[16/10]">
                      <Image 
                          src={lot.imageUrl} 
                          alt={lot.title} 
                          fill 
                          className="object-cover"
                          data-ai-hint={lot.dataAiHint || 'imagem lote historico'}
                      />
                       <Badge className={`absolute top-2 left-2 text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`}>
                          {getAuctionStatusText(lot.status)}
                      </Badge>
                    </div>
                    <CardContent className="p-4 flex-grow">
                      <h4 className="font-semibold text-md mb-1 truncate hover:text-primary">
                          <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                              {lot.title}
                          </Link>
                      </h4>
                      <p className="text-xs text-muted-foreground mb-0.5">Leilão: {lot.auctionName}</p>
                      <p className="text-xs text-muted-foreground">Local: {lot.location}</p>
                      <p className={`text-sm mt-1.5 ${timeInfo.isPast ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                          Lance Inicial:
                          <span className="font-bold ml-1 text-md">
                              R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                      </p>
                        <div className={`flex items-center text-xs mt-1 ${timeInfo.isPast ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{timeInfo.text}</span>
                        </div>
                        <div className={`flex items-center text-xs mt-0.5 ${timeInfo.isPast ? 'text-muted-foreground line-through' : ''}`}>
                            <Gavel className="h-3 w-3 mr-1" />
                            <span>{lot.bidsCount} Lances</span>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t">
                      <Button size="sm" className="w-full" asChild>
                        <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Lote
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
