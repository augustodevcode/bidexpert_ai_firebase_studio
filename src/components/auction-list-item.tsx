
'use client';

import * as React from 'react'; // Adicionado import do React
import type { Auction, AuctionStage as AuctionStageType } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CalendarDays, Tag, MapPin, ListChecks, Gavel as AuctionTypeIcon, FileText as TomadaPrecosIcon, Users, Clock, Star } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuctionStatusText } from '@/lib/sample-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AuctionListItemProps {
  auction: Auction;
}

export default function AuctionListItem({ auction }: AuctionListItemProps) {
  const auctionTypeDisplay = auction.auctionType === 'TOMADA_DE_PRECOS' 
    ? { label: 'Tomada de Preços', icon: <TomadaPrecosIcon className="h-3.5 w-3.5" /> }
    : { label: auction.auctionType || 'Leilão', icon: <AuctionTypeIcon className="h-3.5 w-3.5" /> };

  const displayLocation = auction.city && auction.state ? `${auction.city} - ${auction.state}` : auction.state || auction.city || 'N/A';

  const mentalTriggers = React.useMemo(() => {
    const triggers: string[] = [];
    const now = new Date();

    if (auction.endDate) {
        const endDate = new Date(auction.endDate as string);
        if (!isPast(endDate)) {
            const daysDiff = differenceInDays(endDate, now);
            if (daysDiff === 0) triggers.push('ENCERRA HOJE');
            else if (daysDiff === 1) triggers.push('ENCERRA AMANHÃ');
        }
    }
    
    if ((auction.totalHabilitatedUsers || 0) > 100) {
        triggers.push('ALTA DEMANDA');
    }
    
    if (auction.isFeaturedOnMarketplace) {
        triggers.push('DESTAQUE');
    }

    if (auction.additionalTriggers) {
        triggers.push(...auction.additionalTriggers);
    }
    
    return Array.from(new Set(triggers));
  }, [auction.endDate, auction.totalHabilitatedUsers, auction.isFeaturedOnMarketplace, auction.additionalTriggers]);


  return (
    <TooltipProvider>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image Column */}
          <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted">
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="block h-full w-full">
              <Image
                src={auction.imageUrl || 'https://placehold.co/600x400.png'}
                alt={auction.title}
                fill
                className="object-cover"
                data-ai-hint={auction.dataAiHint || 'imagem leilao lista'}
              />
            </Link>
            <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10">
                <Badge 
                className={`text-xs px-2 py-1
                    ${auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO' ? 'bg-green-600 text-white' : ''}
                    ${auction.status === 'EM_BREVE' ? 'bg-blue-500 text-white' : ''}
                    ${auction.status === 'ENCERRADO' || auction.status === 'FINALIZADO' || auction.status === 'CANCELADO' || auction.status === 'SUSPENSO' || auction.status === 'RASCUNHO' || auction.status === 'EM_PREPARACAO' ? 'bg-gray-500 text-white' : ''}
                `}
                >
                {getAuctionStatusText(auction.status)}
                </Badge>
            </div>
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                {mentalTriggers.map(trigger => (
                    <Badge key={trigger} variant="secondary" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                        {trigger.startsWith('ENCERRA') && <Clock className="h-3 w-3 mr-0.5" />}
                        {trigger === 'ALTA DEMANDA' && <Users className="h-3 w-3 mr-0.5" />}
                        {trigger === 'DESTAQUE' && <Star className="h-3 w-3 mr-0.5" />}
                        {trigger}
                    </Badge>
                ))}
            </div>
          </div>

          {/* Content Column */}
          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                <Link href={`/auctions/${auction.publicId || auction.id}`}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2" title={auction.title}>
                    {auction.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={auction.description || undefined}>
                  {auction.description?.substring(0, 70) + '...'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
              <div className="flex items-center" title={`ID: ${auction.publicId || auction.id}`}>
                <ListChecks className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">ID: {auction.publicId ? auction.publicId.substring(0,12)+'...' : auction.id.substring(0,12)+'...'}</span>
              </div>
              <div className="flex items-center">
                {auctionTypeDisplay.icon && React.cloneElement(auctionTypeDisplay.icon, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" })}
                <span>{auctionTypeDisplay.label}</span>
              </div>
              <div className="flex items-center">
                <Tag className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span>{auction.category}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                <span className="truncate">{displayLocation}</span>
              </div>
            </div>

            {auction.auctionStages && auction.auctionStages.length > 0 ? (
                <div className="space-y-1 mb-2 max-h-20 overflow-y-auto text-xs">
                    {auction.auctionStages.map((stage, index) => (
                        <div key={index} className={`p-1.5 rounded-md ${new Date(stage.endDate).getTime() < new Date().getTime() ? 'bg-muted/40 text-muted-foreground line-through' : 'bg-accent/30'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-xs">{stage.name}</span>
                                <span className="text-xs">{stage.statusText || 'Encerra'}: {format(new Date(stage.endDate), "dd/MM HH:mm", { locale: ptBR })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ): (
                 <div className="flex items-center text-xs text-muted-foreground mb-2">
                    <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
                    <span>{format(new Date(auction.auctionDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
            )}
            

            <div className="mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2">
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground">
                  {auction.auctionType === 'TOMADA_DE_PRECOS' ? 'Valor de Referência' : 'A partir de'}
                </p>
                <p className="text-xl font-bold text-primary">
                  R$ {(auction.initialOffer || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button asChild size="sm" className="w-full md:w-auto mt-2 md:mt-0">
                <Link href={`/auctions/${auction.publicId || auction.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> Ver Leilão ({auction.totalLots || 0} Lotes)
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
