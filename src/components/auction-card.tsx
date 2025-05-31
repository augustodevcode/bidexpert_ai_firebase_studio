
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Auction, AuctionStage } from '@/types';
import { Heart, Share2, Eye, CalendarDays, Tag, MapPin, X, Facebook, MessageSquareText, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import AuctionPreviewModal from './auction-preview-modal'; // Assuming this will be created
import { getAuctionStatusText } from '@/lib/sample-data';

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const [isFavorite, setIsFavorite] = useState(auction.isFavorite || false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const now = new Date();

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if inside a Link
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // Add logic to persist favorite state, e.g., API call
  };

  const openPreviewModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPreviewModalOpen(true);
  };
  
  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', auctionUrl: string, auctionTitle: string) => {
    const encodedUrl = encodeURIComponent(auctionUrl);
    const encodedTitle = encodeURIComponent(auctionTitle);
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
  const auctionFullUrl = typeof window !== 'undefined' ? `${window.location.origin}/auctions/${auction.id}` : `/auctions/${auction.id}`;


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
            <div className="aspect-[16/10] relative">
              <Image
                src={auction.imageUrl}
                alt={auction.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                data-ai-hint={auction.dataAiHint || 'auction item'}
              />
              {auction.auctioneerLogoUrl && (
                <div className="absolute bottom-2 right-2 bg-background/80 p-1.5 rounded-md shadow-md max-w-[100px] max-h-[50px] overflow-hidden">
                  <Image
                    src={auction.auctioneerLogoUrl}
                    alt={auction.auctioneerName || 'Logo Comitente'}
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
            {auction.auctioneerName && <span className="font-semibold text-primary">{auction.auctioneerName}</span>}
          </div>
          <Link href={`/auctions/${auction.id}`}>
            <h3 className="text-md font-semibold hover:text-primary transition-colors mb-2 leading-tight min-h-[2.5em] line-clamp-2">
              {auction.title}
            </h3>
          </Link>
          
          <div className="space-y-2 mb-3">
            {auction.auctionStages.map((stage, index) => {
              const isPast = new Date(stage.endDate) < now;
              const stageDate = format(new Date(stage.endDate), "dd/MM/yyyy HH:mm", { locale: ptBR });
              return (
                <div 
                  key={index} 
                  className={`p-2 rounded-md text-sm ${isPast ? 'bg-muted/50 text-muted-foreground line-through' : 'bg-accent/20'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${isPast ? '' : 'text-accent-foreground/80'}`}>{stage.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center text-xs">
                       <CalendarDays className={`h-3.5 w-3.5 mr-1.5 ${isPast ? '' : 'text-accent-foreground/70'}`} />
                       {stage.statusText || 'Encerramento'}:
                    </div>
                    <span className={`text-xs font-semibold ${isPast ? '' : 'text-accent-foreground/90'}`}>{stageDate}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </CardContent>
        <CardFooter className="p-4 border-t flex-col items-start space-y-2">
          <Badge 
            className={`w-full justify-center py-1.5 text-sm font-semibold
              ${auction.status === 'ABERTO_PARA_LANCES' ? 'bg-green-600 hover:bg-green-700' : ''}
              ${auction.status === 'EM_BREVE' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              ${auction.status === 'ENCERRADO' || auction.status === 'FINALIZADO' ? 'bg-gray-500 hover:bg-gray-600' : ''}
              text-white
            `}
          >
            {getAuctionStatusText(auction.status)}
          </Badge>
          <div className="w-full">
            <p className="text-xs text-muted-foreground">Oferta Inicial</p>
            <p className="text-2xl font-bold text-primary">
              R$ {auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Button asChild className="w-full mt-2">
            <Link href={`/auctions/${auction.id}`}>Ver Detalhes</Link>
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
  );
}

// DropdownMenu components needed for share functionality
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
