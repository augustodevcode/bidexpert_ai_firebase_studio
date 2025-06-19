
'use client';

import type { Auction } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Share2, Eye, CalendarDays, Tag, MapPin, ListChecks, Gavel as AuctionTypeIcon, FileText as TomadaPrecosIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import AuctionPreviewModal from './auction-preview-modal';
import { getAuctionStatusText } from '@/lib/sample-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
// A lógica de favoritos para Leilões não foi implementada ainda, será omitida por enquanto.

interface AuctionListItemProps {
  auction: Auction;
}

export default function AuctionListItem({ auction }: AuctionListItemProps) {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [auctionFullUrl, setAuctionFullUrl] = useState<string>(`/auctions/${auction.publicId || auction.id}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuctionFullUrl(`${window.location.origin}/auctions/${auction.publicId || auction.id}`);
    }
  }, [auction.id, auction.publicId]);

  const openPreviewModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPreviewModalOpen(true);
  };

  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch(platform) {
      case 'x': return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp': return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email': return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  };
  
  const auctionTypeDisplay = auction.auctionType === 'TOMADA_DE_PRECOS' 
    ? { label: 'Tomada de Preços', icon: <TomadaPrecosIcon className="h-3.5 w-3.5" /> }
    : { label: auction.auctionType || 'Leilão', icon: <AuctionTypeIcon className="h-3.5 w-3.5" /> };


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
             {/* Badges (Status, Tipo) - Posicionados para não cobrir a imagem principal */}
          </div>

          {/* Content Column */}
          <div className="flex flex-col flex-grow p-4">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex-grow min-w-0">
                <Badge variant="outline" className="text-xs mb-1 py-0.5 px-1.5">{getAuctionStatusText(auction.status)}</Badge>
                <Link href={`/auctions/${auction.publicId || auction.id}`}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2" title={auction.title}>
                    {auction.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={auction.fullTitle || undefined}>
                  {auction.fullTitle || auction.description?.substring(0, 70) + '...'}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1 md:hidden">
                {/* Mobile Actions - Simplified */}
                <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={openPreviewModal}><Eye className="h-4 w-4" /></Button></TooltipTrigger>
                    <TooltipContent><p>Pré-visualizar</p></TooltipContent>
                </Tooltip>
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
                <span className="truncate">{auction.city && auction.state ? `${auction.city} - ${auction.state}` : auction.state || auction.city || 'N/A'}</span>
              </div>
            </div>

            {auction.auctionStages && auction.auctionStages.length > 0 ? (
                <div className="space-y-1 mb-2 max-h-20 overflow-y-auto text-xs">
                    {auction.auctionStages.map((stage, index) => (
                        <div key={index} className={`p-1.5 rounded-md ${new Date(stage.endDate) < new Date() ? 'bg-muted/40 text-muted-foreground line-through' : 'bg-accent/30'}`}>
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
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
                 <Button asChild size="sm" className="flex-1 sm:flex-auto">
                    <Link href={`/auctions/${auction.publicId || auction.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Leilão ({auction.totalLots || 0} Lotes)
                    </Link>
                </Button>
                <div className="hidden md:flex items-center space-x-1">
                    <Tooltip>
                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={openPreviewModal}><Eye className="h-4 w-4" /></Button></TooltipTrigger>
                        <TooltipContent><p>Pré-visualizar</p></TooltipContent>
                    </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      {isPreviewModalOpen && auction.auctionStages && (
        <AuctionPreviewModal
            auction={auction}
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
    </TooltipProvider>
  );
}

