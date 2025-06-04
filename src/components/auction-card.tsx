
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auction, AuctionStage as AuctionStageType } from '@/types';
import { Heart, Share2, Eye, CalendarDays, Tag, MapPin, X, Facebook, MessageSquareText, Mail } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu"

interface AuctionStageItemProps {
  stage: AuctionStageType;
  auctionId: string; 
  index: number; 
}

const AuctionStageItem: React.FC<AuctionStageItemProps> = ({ stage, auctionId, index }) => {
  const [clientTimeData, setClientTimeData] = useState<{ formattedDate: string; isPast: boolean } | null>(null);

  useEffect(() => {
    const now = new Date();
    let stageEndDateObj: Date | null = null;
    let isValidDate = false;

    if (stage.endDate) { // Check if stage.endDate exists
        stageEndDateObj = stage.endDate instanceof Date ? stage.endDate : new Date(stage.endDate);
        // Further check if the conversion resulted in a valid date
        if (stageEndDateObj && !isNaN(stageEndDateObj.getTime())) {
            isValidDate = true;
        }
    }

    if (isValidDate && stageEndDateObj) {
        setClientTimeData({
            formattedDate: format(stageEndDateObj, "dd/MM/yyyy HH:mm", { locale: ptBR }),
            isPast: stageEndDateObj < now,
        });
    } else {
        // Handle invalid or missing date
        console.warn(`AuctionStageItem: Invalid or missing endDate for auction stage. Auction ID: ${auctionId}, Stage Name: "${stage.name}". Received endDate:`, stage.endDate);
        setClientTimeData({
            formattedDate: "Data Indisponível",
            isPast: false, 
        });
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [stage.endDate, stage.name, auctionId]); 


  if (!clientTimeData) {
    return (
      <div key={`${auctionId}-stage-loading-${index}`} className="p-2 rounded-md text-sm bg-muted/30 text-muted-foreground animate-pulse">
        <div className="flex justify-between items-center">
          <span className="font-medium">{stage.name}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center text-xs">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            {stage.statusText || 'Encerramento'}:
          </div>
          <span className="text-xs font-semibold">Calculando...</span>
        </div>
      </div>
    );
  }

  const { formattedDate, isPast } = clientTimeData;

  return (
    <div
      key={`${auctionId}-stage-${index}`}
      className={`p-2 rounded-md text-sm ${isPast ? 'bg-muted/30 text-muted-foreground line-through' : 'bg-accent/20'}`}
    >
      <div className="flex justify-between items-center">
        <span className={`font-medium ${isPast ? '' : 'text-accent-foreground/80'}`}>{stage.name}</span>
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <div className="flex items-center text-xs">
            <CalendarDays className={`h-3.5 w-3.5 mr-1.5 ${isPast ? '' : 'text-accent-foreground/70'}`} />
            {stage.statusText || 'Encerramento'}:
        </div>
        <span className={`text-xs font-semibold ${isPast ? '' : 'text-accent-foreground/90'}`}>{formattedDate}</span>
      </div>
    </div>
  );
};


interface AuctionCardProps {
  auction: Auction; 
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [isFavorite, setIsFavorite] = useState(auction.isFavorite || false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [auctionFullUrl, setAuctionFullUrl] = useState<string>(`/auctions/${auction.id}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuctionFullUrl(`${window.location.origin}/auctions/${auction.id}`);
    }
  }, [auction.id]);


  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const openPreviewModal = (e: React.MouseEvent) => {
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
  
  const mainImageUrl = auction.imageUrl || auction.auctioneerLogoUrl || 'https://placehold.co/600x400.png';
  const mainImageAlt = auction.title || 'Imagem do Leilão';
  const mainImageDataAiHint = auction.dataAiHint || 'auction image';

  return (
    <>
      <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg group">
        {auction.fullTitle && (
          <CardHeader className="p-3 bg-primary text-primary-foreground rounded-t-lg">
            <h2 className="text-md font-semibold truncate">{auction.fullTitle}</h2>
          </CardHeader>
        )}
        <div className="relative">
          <Link href={`/auctions/${auction.id}`} className="block">
            <div className="aspect-[16/10] relative bg-muted">
              <Image
                src={mainImageUrl}
                alt={mainImageAlt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                data-ai-hint={mainImageDataAiHint}
              />
              {auction.auctioneerLogoUrl && auction.auctioneerLogoUrl !== auction.imageUrl && (
                <div className="absolute bottom-2 right-2 bg-background/80 p-1.5 rounded-md shadow-md max-w-[100px] max-h-[50px] overflow-hidden">
                  <Image
                    src={auction.auctioneerLogoUrl}
                    alt={auction.auctioneer || 'Logo Comitente'}
                    width={100}
                    height={50}
                    className="object-contain h-full w-full"
                    data-ai-hint="auctioneer logo"
                  />
                </div>
              )}
            </div>
          </Link>
          <div className="absolute top-2 right-2 flex flex-col space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle}>
              <Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
              <span className="sr-only">Favoritar</span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={openPreviewModal}>
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Pré-visualizar</span>
            </Button>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Compartilhar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('x', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <X className="h-4 w-4" /> X (Twitter)
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('facebook', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" /> Facebook
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('whatsapp', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4" /> WhatsApp
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('email', auctionFullUrl, auction.title)} className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4 flex-grow">
          <div className="flex justify-between items-start text-xs text-muted-foreground mb-1">
            <span>ID: {auction.id}</span>
            {auction.auctioneer && <span className="font-semibold text-primary">{auction.auctioneer}</span>}
          </div>
          <Link href={`/auctions/${auction.id}`}>
            <h3 className="text-md font-semibold hover:text-primary transition-colors mb-2 leading-tight min-h-[2.5em] line-clamp-2">
              {auction.title}
            </h3>
          </Link>
          
          {auction.auctionStages && auction.auctionStages.length > 0 ? (
            <div className="space-y-2 mb-3">
              {auction.auctionStages.map((stage, index) => (
                <AuctionStageItem key={`${auction.id}-stage-${index}`} stage={stage} auctionId={auction.id} index={index} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">Total de Lotes: {auction.totalLots}</p>
          )}


        </CardContent>
        <CardFooter className="p-4 border-t flex-col items-start space-y-2">
          <Badge 
            className={`w-full justify-center py-1.5 text-sm font-semibold
              ${auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO' ? 'bg-green-600 hover:bg-green-700' : ''}
              ${auction.status === 'EM_BREVE' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              ${auction.status === 'ENCERRADO' || auction.status === 'FINALIZADO' ? 'bg-gray-500 hover:bg-gray-600' : ''}
              text-white
            `}
          >
            {getAuctionStatusText(auction.status)}
          </Badge>
          {auction.initialOffer && (
            <div className="w-full">
              <p className="text-xs text-muted-foreground">A partir de</p>
              <p className="text-2xl font-bold text-primary">
                R$ {auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
          <Button asChild className="w-full mt-2">
            <Link href={`/auctions/${auction.id}`}>Ver Lotes ({auction.totalLots})</Link>
          </Button>
        </CardFooter>
      </Card>
      {isPreviewModalOpen && auction.auctionStages && auction.auctionStages.length > 0 && ( 
        <AuctionPreviewModal
          auction={auction}
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
    </>
  );
}
