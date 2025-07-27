
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auction, AuctionStage as AuctionStageType } from '@/types';
import { Heart, Share2, Eye, CalendarDays, Tag, MapPin, X, Facebook, MessageSquareText, Mail, Gavel as AuctionTypeIcon, FileText as TomadaPrecosIcon, Pencil, Clock, Users, Star, ListChecks, CheckSquare } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AuctionPreviewModal from './auction-preview-modal';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EntityEditMenu from './entity-edit-menu';
import AuctionStagesTimeline from './auction/auction-stages-timeline'; // Importando o componente de timeline
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


interface AuctionCardProps {
  auction: Auction;
  onUpdate?: () => void;
}

export default function AuctionCard({ auction, onUpdate }: AuctionCardProps) {
  const [isFavorite, setIsFavorite] = React.useState(auction.isFavorite || false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState(false);
  const [auctionFullUrl, setAuctionFullUrl] = React.useState<string>(`/auctions/${auction.publicId || auction.id}`);

  const soldLotsCount = React.useMemo(() => {
    if (!auction.lots || auction.lots.length === 0) return 0;
    return auction.lots.filter(lot => lot.status === 'VENDIDO').length;
  }, [auction.lots]);

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


  React.useEffect(() => {
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
  
  const mainImageUrl = auction.imageUrl || 'https://placehold.co/600x400.png';
  const mainImageAlt = auction.title || 'Imagem do Leilão';
  const mainImageDataAiHint = auction.dataAiHint || 'auction image';
  const sellerLogoUrl = auction.seller?.logoUrl;
  const sellerSlug = auction.seller?.slug;
  const sellerName = auction.seller?.name;


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
  
  const getStatusDisplay = () => {
    if (auction.status === 'ENCERRADO' || auction.status === 'FINALIZADO') {
      if (soldLotsCount > 0) {
        return { text: `Vendido (${soldLotsCount}/${auction.totalLots})`, className: 'bg-green-600 text-white' };
      }
      return { text: 'Finalizado (Sem Venda)', className: 'bg-gray-500 text-white' };
    }
    if (auction.status === 'ABERTO_PARA_LANCES' || auction.status === 'ABERTO') {
      return { text: getAuctionStatusText(auction.status), className: 'bg-green-600 text-white' };
    }
    if (auction.status === 'EM_BREVE') {
      return { text: getAuctionStatusText(auction.status), className: 'bg-blue-500 text-white' };
    }
    return { text: getAuctionStatusText(auction.status), className: 'bg-gray-500 text-white' };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <TooltipProvider>
      <>
        <Card data-ai-id={`auction-card-${auction.id}`} className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg group">
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
                  data-ai-id="auction-card-main-image"
                />
                 {sellerLogoUrl && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href={sellerSlug ? `/sellers/${sellerSlug}` : '#'} onClick={(e) => e.stopPropagation()} className="absolute bottom-2 right-2 z-10">
                                <Avatar className="h-12 w-12 border-2 bg-background border-border shadow-md" data-ai-id="auction-card-seller-logo">
                                    <AvatarImage src={sellerLogoUrl} alt={sellerName || "Logo Comitente"} data-ai-hint={auction.seller?.dataAiHintLogo || 'logo comitente'} />
                                    <AvatarFallback>{sellerName ? sellerName.charAt(0) : 'C'}</AvatarFallback>
                                </Avatar>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Comitente: {sellerName}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
              </div>
            </Link>
             <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10" data-ai-id="auction-card-badges">
                <Badge className={`text-xs px-2 py-1 ${statusDisplay.className}`}>
                    {statusDisplay.text}
                </Badge>
            </div>
             <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10" data-ai-id="auction-card-mental-triggers">
                {mentalTriggers.map(trigger => (
                    <Badge key={trigger} variant="secondary" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-300">
                        {trigger.startsWith('ENCERRA') && <Clock className="h-3 w-3 mr-0.5" />}
                        {trigger === 'ALTA DEMANDA' && <Users className="h-3 w-3 mr-0.5" />}
                        {trigger === 'DESTAQUE' && <Star className="h-3 w-3 mr-0.5" />}
                        {trigger}
                    </Badge>
                ))}
            </div>
            <div className="absolute bottom-2 left-1/2 z-20 flex w-full -translate-x-1/2 transform-gpu flex-row items-center justify-center space-x-1.5 opacity-0 transition-all duration-300 group-hover:-translate-y-0 group-hover:opacity-100 translate-y-4">
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
                <DropdownMenuContent align="end" className="w-56">
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
              <span className="truncate" title={`ID: ${auction.publicId || auction.id}`} data-ai-id="auction-card-public-id">ID: {auction.publicId || auction.id}</span>
              {auctionTypeDisplay && (
                <div className="flex items-center gap-1" data-ai-id="auction-card-type">
                    {auctionTypeDisplay.icon}
                    <span>{auctionTypeDisplay.label}</span>
                </div>
                )}
            </div>
            <Link href={`/auctions/${auction.publicId || auction.id}`}>
              <h3 data-ai-id="auction-card-title" className="text-md font-semibold hover:text-primary transition-colors mb-2 leading-tight min-h-[2.5em] line-clamp-2">
                {auction.title}
              </h3>
            </Link>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground mb-2" data-ai-id="auction-card-counters">
                <div className="flex items-center" title={`${auction.totalLots || 0} Lotes`}>
                    <ListChecks className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-primary/80" />
                    <span className="truncate">{auction.totalLots || 0} Lotes</span>
                </div>
                 <div className="flex items-center" title={`${auction.visits || 0} Visitas`}>
                    <Eye className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-primary/80" />
                    <span className="truncate">{auction.visits || 0} Visitas</span>
                </div>
                 <div className="flex items-center" title={`${auction.totalHabilitatedUsers || 0} Usuários Habilitados`}>
                    <Users className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-primary/80" />
                    <span className="truncate">{auction.totalHabilitatedUsers || 0} Habilitados</span>
                </div>
            </div>
            
            {auction.auctionStages && auction.auctionStages.length > 0 ? (
                <div className="space-y-1 mb-3 text-xs" data-ai-id="auction-card-timeline">
                    <AuctionStagesTimeline auctionOverallStartDate={new Date(auction.auctionDate as string)} stages={auction.auctionStages} />
                </div>
            ) : null}


          </CardContent>
          <CardFooter className="p-4 border-t flex-col items-start space-y-2">
            {auction.initialOffer && (
              <div className="w-full" data-ai-id="auction-card-initial-offer">
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
        {isPreviewModalOpen && (
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
