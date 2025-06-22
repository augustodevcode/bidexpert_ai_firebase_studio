
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auction, AuctionStage as AuctionStageType } from '@/types';
import { Heart, Share2, Eye, CalendarDays, Tag, MapPin, X, Facebook, MessageSquareText, Mail, Gavel as AuctionTypeIcon, FileText as TomadaPrecosIcon, Pencil } from 'lucide-react';
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
import EntityEditMenu from './entity-edit-menu'; // Import the new component

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

    if (stage.endDate) { 
        stageEndDateObj = stage.endDate instanceof Date ? stage.endDate : new Date(stage.endDate);
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
        console.warn(`AuctionStageItem: Invalid or missing endDate for auction stage. Auction ID: ${auctionId}, Stage Name: "${stage.name}". Received endDate:`, stage.endDate);
        setClientTimeData({
            formattedDate: "Data Indisponível",
            isPast: false, 
        });
    }
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
  onUpdate?: () => void;
}

export default function AuctionCard({ auction, onUpdate }: AuctionCardProps) {
  const [isFavorite, setIsFavorite] = useState(auction.isFavorite || false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [auctionFullUrl, setAuctionFullUrl] = useState<string>(`/auctions/${auction.publicId || auction.id}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAuctionFullUrl(`${window.location.origin}/auctions/${auction.publicId || auction.id}`);
    }
  }, [auction.id, auction.publicId]);


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

  const getAuctionTypeDisplay = (type?: Auction['auctionType']) => {
    if (!type) return null;
    switch(type) {
      case 'JUDICIAL': return { label: 'Judicial', icon: <AuctionTypeIcon className="h-3 w-3"/> };
      case 'EXTRAJUDICIAL': return { label: 'Extrajudicial', icon: <AuctionTypeIcon className="h-3 w-3"/> };
      case 'PARTICULAR': return { label: 'Particular', icon: <AuctionTypeIcon className="h-3 w-3"/> };
      case 'TOMADA_DE_PRECOS': return { label: 'Tomada de Preços', icon: <TomadaPrecosIcon className="h-3 w-3"/> };
      default: return null;
    }
  };

  const auctionTypeDisplay = getAuctionTypeDisplay(auction.auctionType);

  return (
    <TooltipProvider>
      <>
        <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg group">
          <div className="relative">
            <Link href={`/auctions/${auction.publicId || auction.id}`} className="block">
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
             <Badge 
              className={`absolute top-2 left-2 text-xs px-2 py-1 z-10
                ${auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO' ? 'bg-green-600 text-white' : ''}
                ${auction.status === 'EM_BREVE' ? 'bg-blue-500 text-white' : ''}
                ${auction.status === 'ENCERRADO' || auction.status === 'FINALIZADO' || auction.status === 'CANCELADO' || auction.status === 'SUSPENSO' || auction.status === 'RASCUNHO' || auction.status === 'EM_PREPARACAO' ? 'bg-gray-500 text-white' : ''}
              `}
            >
              {getAuctionStatusText(auction.status)}
            </Badge>
            <div className="absolute top-2 right-2 flex flex-col space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle} aria-label={isFavorite ? "Desfavoritar" : "Favoritar"}>
                    <Heart className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isFavorite ? "Desfavoritar" : "Favoritar"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={openPreviewModal} aria-label="Pré-visualizar">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Pré-visualizar</p></TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" aria-label="Compartilhar">
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent><p>Compartilhar</p></TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('x', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                      <X className="h-3.5 w-3.5" /> X (Twitter)
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('facebook', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                      <Facebook className="h-3.5 w-3.5" /> Facebook
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('whatsapp', auctionFullUrl, auction.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                      <MessageSquareText className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={getSocialLink('email', auctionFullUrl, auction.title)} className="flex items-center gap-2 text-xs">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <EntityEditMenu
                entityType="auction"
                entityId={auction.id}
                publicId={auction.publicId}
                currentTitle={auction.title}
                isFeatured={auction.isFeaturedOnMarketplace || false}
                onUpdate={onUpdate}
              />
            </div>
          </div>

          <CardContent className="p-4 flex-grow">
            <div className="flex justify-between items-start text-xs text-muted-foreground mb-1">
              <span>ID: {auction.publicId || auction.id}</span>
              {auctionTypeDisplay && (
                <div className="flex items-center gap-1">
                    {auctionTypeDisplay.icon}
                    <span>{auctionTypeDisplay.label}</span>
                </div>
                )}
            </div>
            <Link href={`/auctions/${auction.publicId || auction.id}`}>
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
            {auction.initialOffer && (
              <div className="w-full">
                <p className="text-xs text-muted-foreground">
                  {auction.auctionType === 'TOMADA_DE_PRECOS' ? 'Valor de Referência' : 'A partir de'}
                </p>
                <p className="text-2xl font-bold text-primary">
                  R$ {auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
            <Button asChild className="w-full mt-2">
              <Link href={`/auctions/${auction.publicId || auction.id}`}>Ver Lotes ({auction.totalLots})</Link>
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
    </TooltipProvider>
  );
}
