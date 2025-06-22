
'use client';

import * as React from 'react'; // Adicionado import do React
import type { Auction } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CalendarDays, Tag, MapPin, ListChecks, Gavel as AuctionTypeIcon, FileText as TomadaPrecosIcon } from 'lucide-react';
import { format } from 'date-fns';
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
             <Badge 
              className={`absolute top-2 left-2 text-xs px-2 py-1 z-10
                ${auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO' ? 'bg-green-600 text-white' : ''}
                ${auction.status === 'EM_BREVE' ? 'bg-blue-500 text-white' : ''}
                ${auction.status === 'ENCERRADO' || auction.status === 'FINALIZADO' || auction.status === 'CANCELADO' || auction.status === 'SUSPENSO' || auction.status === 'RASCUNHO' || auction.status === 'EM_PREPARACAO' ? 'bg-gray-500 text-white' : ''}
              `}
            >
              {getAuctionStatusText(auction.status)}
            </Badge>
            {auction.auctioneerLogoUrl && (
              <div className="absolute bottom-1 right-1 bg-background/80 p-1 rounded-sm shadow max-w-[80px] max-h-[40px] overflow-hidden">
                <Image
                  src={auction.auctioneerLogoUrl}
                  alt={auction.auctioneer || 'Logo Leiloeiro'}
                  width={80}
                  height={40}
                  className="object-contain h-full w-full"
                  data-ai-hint="auctioneer logo small"
                />
              </div>
            )}
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
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={auction.fullTitle || undefined}>
                  {auction.fullTitle || auction.description?.substring(0, 70) + '...'}
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
            

            <div className="mt-auto flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2">
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground">
                  {auction.auctionType === 'TOMADA_DE_PRECOS' ? 'Valor de Referência' : 'A partir de'}
                </p>
                <p className="text-xl font-bold text-primary">
                  R$ {(auction.initialOffer || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button asChild size="sm" className="w-full sm:w-auto mt-2 sm:mt-0">
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
