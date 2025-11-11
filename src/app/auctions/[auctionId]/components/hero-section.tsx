// src/app/auctions/[auctionId]/components/hero-section.tsx
/**
 * @fileoverview Hero section aprimorado para página de detalhe de leilão.
 * Exibe imagem fullwidth, badges, stats rápidas e CTA primária.
 */
'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListChecks, Gavel, TrendingUp, Clock, Heart, Share2 } from 'lucide-react';
import type { Auction } from '@/types';
import { getAuctionStatusText, getAuctionStatusColor } from '@/lib/ui-helpers';
import { useAuctionCountdown } from '../hooks/use-auction-countdown';

interface HeroSectionProps {
  auction: Auction;
  onFavorite?: () => void;
  onShare?: () => void;
  isFavorited?: boolean;
}

export default function HeroSection({ 
  auction, 
  onFavorite, 
  onShare,
  isFavorited = false 
}: HeroSectionProps) {
  const { timeRemaining, isExpiringSoon, stage } = useAuctionCountdown(auction);

  const quickStats = [
    { 
      label: 'Lotes', 
      value: auction.totalLots || auction.lots?.length || 0, 
      icon: ListChecks 
    },
    { 
      label: 'Lance Mín.', 
      value: `R$ ${(auction.initialOffer || 0).toLocaleString('pt-BR')}`, 
      icon: Gavel 
    },
    { 
      label: 'Visitações', 
      value: `${(auction.visits || 0).toLocaleString('pt-BR')}`, 
      icon: TrendingUp 
    },
  ];

  return (
    <div className="relative w-full h-96 md:h-96 lg:h-96 overflow-hidden rounded-lg shadow-lg mb-8 group">
      {/* Background Image */}
      <Image
        src={'https://images.unsplash.com/photo-1589307904488-7d60ff29c975?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'}
        alt={auction.title}
        fill
        className="object-cover"
        priority
        data-ai-hint={auction.dataAiHint || 'imagem leilao hero'}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Top Left: Badges */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
        <Badge 
          className={`font-semibold text-sm bg-background/90 ${getAuctionStatusColor(auction.status)}`}
        >
          {getAuctionStatusText(auction.status)}
        </Badge>
        {auction.auctionType && (
          <Badge variant="outline" className="bg-background/70 text-foreground font-semibold text-sm">
            {auction.auctionType === 'JUDICIAL' ? '⚖️ Judicial' : `📋 ${auction.auctionType}`}
          </Badge>
        )}
        {stage && (
          <Badge variant="secondary" className="bg-amber-500/90 text-white font-semibold text-sm">
            {stage.name}
          </Badge>
        )}
        {auction.isFeaturedOnMarketplace && (
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold animate-pulse text-sm">
            ⭐ DESTAQUE
          </Badge>
        )}
      </div>

      {/* Top Right: Actions */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          size="icon"
          variant="ghost"
          className="bg-background/70 hover:bg-background/90 text-foreground"
          onClick={onFavorite}
          aria-label={isFavorited ? 'Desfavoritar' : 'Favoritar'}
        >
          <Heart 
            className={`h-5 w-5 ${isFavorited ? 'text-red-500 fill-red-500' : ''}`} 
          />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="bg-background/70 hover:bg-background/90 text-foreground"
          onClick={onShare}
          aria-label="Compartilhar"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom: Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
        <div className="space-y-4">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            {auction.title}
          </h1>

          {/* Countdown */}
          <div className={`flex items-center gap-2 text-white text-lg font-semibold drop-shadow-md ${isExpiringSoon ? 'animate-pulse text-red-300' : ''}`}>
            <Clock className="h-5 w-5" />
            <span>
              {timeRemaining}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="text-white text-sm">
                    <p className="text-xs opacity-75">{stat.label}</p>
                    <p className="font-bold">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
