
'use client';

import type { Lot } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Eye, Gavel, Tag } from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays, isPast, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { getAuctionStatusText, getLotStatusColor } from '@/lib/ui-helpers';

interface LiveLotCardProps {
  lot: Lot;
  isHighlighted?: boolean;
}

function TimeRemaining({ endDate, status }: { endDate: Date | string | null; status: Lot['status'] }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!endDate) return;
    const end = new Date(endDate);
    if (!isValid(end)) {
        setRemaining('Data inválida');
        return;
    }

    const calculate = () => {
      const now = new Date();
      if (isPast(end) || status !== 'ABERTO_PARA_LANCES') {
        setRemaining(getAuctionStatusText(status === 'ABERTO_PARA_LANCES' && isPast(end) ? 'ENCERRADO' : status));
        return;
      }

      const minutes = differenceInMinutes(end, now);
      const hours = differenceInHours(end, now);
      const days = differenceInDays(end, now);

      if (days > 0) {
        setRemaining(`${days}d ${hours % 24}h`);
      } else if (hours > 0) {
        setRemaining(`${hours}h ${minutes % 60}m`);
      } else if (minutes > 0) {
        setRemaining(`${minutes}m`);
      } else {
        setRemaining('Encerrando!');
      }
    };
    calculate();
    const interval = setInterval(calculate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [endDate, status]);

  return <span className="font-semibold">{remaining}</span>;
}


export default function LiveLotCard({ lot, isHighlighted = false }: LiveLotCardProps) {
  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || 'Não informado';

  return (
    <Card className={`flex flex-col overflow-hidden h-full shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg group ${isHighlighted ? 'border-2 border-primary ring-2 ring-primary/50' : ''}`}>
      <div className="relative">
        <Link href={`/auctions/${lot.auctionId}/live?lotId=${lot.publicId || lot.id}`} className="block">
          <div className={`aspect-[16/10] relative ${isHighlighted ? 'bg-primary/10' : 'bg-muted'}`}>
            <Image
              src={lot.imageUrl || 'https://placehold.co/600x400.png'}
              alt={lot.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={lot.dataAiHint || 'imagem lote ao vivo'}
            />
            {isHighlighted && (
                <Badge className="absolute top-2 left-2 text-xs px-2.5 py-1 bg-primary text-primary-foreground animate-pulse">
                    EM DESTAQUE / PRÓXIMO
                </Badge>
            )}
             {!isHighlighted && (
                <Badge className={`absolute top-2 left-2 text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`}>
                 {getAuctionStatusText(lot.status)}
                </Badge>
             )}
          </div>
        </Link>
      </div>

      <CardContent className="p-3 flex-grow space-y-1.5">
        <Link href={`/auctions/${lot.auctionId}/live?lotId=${lot.publicId || lot.id}`}>
          <h3 className="text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2">
            {lot.title} (Lote {lot.number || lot.id.replace('LOTE', '')})
          </h3>
        </Link>
         <p className="text-xs text-muted-foreground truncate">
            Leilão: {lot.auctionName}
        </p>
        <div className="flex items-center text-xs text-muted-foreground">
          <Tag className="h-3 w-3 mr-1" />
          <span>{lot.type}</span>
        </div>
      </CardContent>

      <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
        <div className="w-full">
          <p className="text-xs text-muted-foreground">Lance Atual / Inicial</p>
          <p className={`text-xl font-bold ${isHighlighted ? 'text-primary' : 'text-foreground'}`}>
            R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="w-full flex justify-between items-center text-xs">
            <div className={`flex items-center gap-1 ${isHighlighted ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                <Clock className="h-3 w-3" />
                <TimeRemaining endDate={lot.endDate} status={lot.status} />
            </div>
            <div className={`flex items-center gap-1 ${isHighlighted ? 'text-foreground' : 'text-muted-foreground'}`}>
                <Gavel className="h-3 w-3" />
                <span>{lot.bidsCount || 0} Lances</span>
            </div>
        </div>
         <Button asChild className="w-full mt-2" size="sm">
            <Link href={`/auctions/${lot.auctionId}/live?lotId=${lot.publicId || lot.id}`}>
                <Eye className="mr-2 h-4 w-4" /> Entrar no Auditório
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
