

'use client';

import type { DirectSaleOffer } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Tag, MapPin, UserCircle, DollarSign } from 'lucide-react';
import { getLotStatusColor, getAuctionStatusText } from '@/lib/sample-data-helpers';

interface DirectSaleOfferCardProps {
  offer: DirectSaleOffer;
}

export default function DirectSaleOfferCard({ offer }: DirectSaleOfferCardProps) {
  const displayLocation = offer.locationCity && offer.locationState
    ? `${offer.locationCity} - ${offer.locationState}`
    : offer.locationState || offer.locationCity || 'Não informado';

  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group">
      <div className="relative">
        <Link href={`/direct-sales/${offer.id}`} className="block">
          <div className="aspect-[16/10] relative bg-muted">
            <Image
              src={offer.imageUrl || 'https://placehold.co/600x400.png'}
              alt={offer.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={offer.dataAiHint || 'oferta venda direta'}
            />
            <Badge className={`absolute top-2 left-2 text-xs px-2 py-1 ${getLotStatusColor(offer.status)}`}>
              {getAuctionStatusText(offer.status)}
            </Badge>
             <Badge variant="outline" className="absolute top-2 right-2 text-xs px-2 py-1 bg-background/80">
                {offer.offerType === 'BUY_NOW' ? 'Comprar Já' : 'Aceita Proposta'}
            </Badge>
          </div>
        </Link>
      </div>

      <CardContent className="p-3 flex-grow space-y-1.5">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1 truncate">
            <UserCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{offer.sellerName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            <span>{offer.category}</span>
          </div>
        </div>

        <Link href={`/direct-sales/${offer.id}`}>
          <h3 className="text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2">
            {offer.title}
          </h3>
        </Link>
        
        <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{displayLocation}</span>
        </div>
      </CardContent>

      <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
        <div className="w-full">
          {offer.offerType === 'BUY_NOW' && offer.price !== undefined && (
            <>
              <p className="text-xs text-muted-foreground">Preço Fixo</p>
              <p className="text-xl font-bold text-primary">
                R$ {offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </>
          )}
          {offer.offerType === 'ACCEPTS_PROPOSALS' && (
            <>
              <p className="text-xs text-muted-foreground">Aceita Propostas</p>
              {offer.minimumOfferPrice && (
                <p className="text-md font-bold text-primary">
                  A partir de R$ {offer.minimumOfferPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
               {!offer.minimumOfferPrice && (
                 <p className="text-md font-bold text-primary">Envie sua melhor oferta</p>
               )}
            </>
          )}
        </div>
         <Button asChild className="w-full mt-2" size="sm">
            <Link href={`/direct-sales/${offer.id}`}>
                <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
