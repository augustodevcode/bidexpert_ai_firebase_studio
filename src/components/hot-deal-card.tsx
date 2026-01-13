/**
 * @file HotDealCard Component
 * @description Componente que exibe um lote em destaque "Hot Deal" com countdown,
 * galeria de imagens e progresso de vendas. Inspirado no layout MartFury.
 * 
 * Features:
 * - Galeria de imagens com thumbnails verticais
 * - Countdown timer para encerramento
 * - Badge de desconto/economia
 * - Barra de progresso de lances
 * - Rating e status do lote
 * - Navegação em carrossel para múltiplos lotes
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Lot, Auction, PlatformSettings } from '@/types';

interface HotDealCardProps {
  lots: Lot[];
  auctions: Auction[];
  platformSettings: PlatformSettings;
  title?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(endDate: Date | string | null): CountdownValues {
  if (!endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  const difference = new Date(endDate).getTime() - Date.now();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ --';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HotDealCard({
  lots,
  auctions,
  platformSettings,
  title = "Oferta Imperdível de Hoje",
  autoPlay = true,
  autoPlayInterval = 8000,
}: HotDealCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [countdown, setCountdown] = useState<CountdownValues>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const currentLot = lots[currentIndex];
  const currentAuction = currentLot ? auctions.find(a => a.id === currentLot.auctionId) : null;

  // Countdown effect
  useEffect(() => {
    if (!currentLot?.endDate) return;

    const updateCountdown = () => {
      setCountdown(calculateTimeLeft(currentLot.endDate));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [currentLot?.endDate]);

  // Auto-play carrossel
  useEffect(() => {
    if (!autoPlay || lots.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % lots.length);
      setSelectedImageIndex(0);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, lots.length]);

  const scrollPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + lots.length) % lots.length);
    setSelectedImageIndex(0);
  }, [lots.length]);

  const scrollNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % lots.length);
    setSelectedImageIndex(0);
  }, [lots.length]);

  if (!lots || lots.length === 0 || !currentLot) {
    return null;
  }

  // Obter imagens da galeria do lote
  const galleryImages = currentLot.galleryImageUrls?.length
    ? currentLot.galleryImageUrls
    : currentLot.imageUrl
    ? [currentLot.imageUrl]
    : ['/images/placeholder-lot.png'];

  const currentImage = galleryImages[selectedImageIndex] || galleryImages[0];

  // Calcular economia/desconto
  const evaluationValue = currentLot.evaluationValue;
  const currentPrice = currentLot.price;
  const savings = evaluationValue && currentPrice && evaluationValue > currentPrice
    ? evaluationValue - currentPrice
    : null;
  const discountPercentage = evaluationValue && currentPrice && evaluationValue > currentPrice
    ? Math.round(((evaluationValue - currentPrice) / evaluationValue) * 100)
    : null;

  // Calcular progresso de vendas (simulado baseado em views/bids)
  const totalBids = currentLot.bidCount || 0;
  const maxBids = 100; // Valor de referência para 100%
  const salesProgress = Math.min((totalBids / maxBids) * 100, 100);

  // Dados do vendedor/comitente
  const sellerName = currentLot.sellerName || currentAuction?.sellerName || 'Comitente';
  const sellerType = currentAuction?.auctionType === 'JUDICIAL' ? 'Judicial' : 'Extrajudicial';

  // Status do lote
  const isActive = currentLot.status === 'ABERTO_PARA_LANCES';
  const statusText = isActive ? 'Aberto para Lances' : currentLot.status?.replace(/_/g, ' ');

  return (
    <section className="py-8" data-testid="hot-deal-section">
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
            <h3 className="text-xl font-bold font-headline text-foreground flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-destructive rounded-full animate-pulse" />
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollPrev}
                className="h-8 w-8 rounded-full"
                aria-label="Lote anterior"
                data-testid="hot-deal-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {lots.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollNext}
                className="h-8 w-8 rounded-full"
                aria-label="Próximo lote"
                data-testid="hot-deal-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row" data-testid="hot-deal-content">
            {/* Gallery Section */}
            <div className="lg:w-1/2 p-6" data-testid="hot-deal-gallery">
              <div className="flex gap-4">
                {/* Thumbnails Vertical */}
                {galleryImages.length > 1 && (
                  <div className="hidden sm:flex flex-col gap-2 w-16">
                    {galleryImages.slice(0, 5).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={cn(
                          "w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                          selectedImageIndex === idx
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-primary/50"
                        )}
                        data-testid={`hot-deal-thumbnail-${idx}`}
                      >
                        <Image
                          src={img}
                          alt={`Imagem ${idx + 1} de ${currentLot.title}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Image */}
                <div className="flex-1 relative">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                    <Link href={`/lots/${currentLot.id}`} data-testid="hot-deal-image-link">
                      <Image
                        src={currentImage}
                        alt={currentLot.title || 'Lote em destaque'}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                        priority
                      />
                    </Link>
                    
                    {/* Badge de Desconto */}
                    {savings && discountPercentage && (
                      <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-2 rounded-lg shadow-lg">
                        <span className="text-xs font-medium">Economia</span>
                        <br />
                        <span className="text-lg font-bold">{discountPercentage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:w-1/2 p-6 flex flex-col justify-between" data-testid="hot-deal-info">
              {/* Seller/Type Badge */}
              <div className="mb-4">
                <Badge variant="secondary" className="mb-2">
                  {sellerType}
                </Badge>
                <p className="text-sm text-muted-foreground">{sellerName}</p>
              </div>

              {/* Title & Link */}
              <h4 className="text-xl lg:text-2xl font-bold font-headline mb-4">
                <Link 
                  href={`/lots/${currentLot.id}`}
                  className="hover:text-primary transition-colors line-clamp-2"
                  data-testid="hot-deal-title-link"
                >
                  {currentLot.title || 'Lote em Destaque'}
                </Link>
              </h4>

              {/* Price & Rating */}
              <div className="mb-4">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(currentPrice)}
                  </span>
                  {evaluationValue && evaluationValue > (currentPrice || 0) && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatCurrency(evaluationValue)}
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-4 w-4",
                          star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({totalBids} {totalBids === 1 ? 'lance' : 'lances'})
                  </span>
                </div>

                {/* Status */}
                <div className="mt-3">
                  <span className="text-sm text-muted-foreground">Status: </span>
                  <Badge variant={isActive ? "default" : "secondary"} className="ml-1">
                    {statusText}
                  </Badge>
                </div>
              </div>

              {/* Countdown */}
              <div className="mb-6 p-4 bg-muted/50 rounded-lg" data-testid="hot-deal-countdown">
                <p className="text-sm font-semibold text-muted-foreground mb-3">Encerra em:</p>
                <div className="flex gap-3">
                  {[
                    { value: countdown.days, label: 'Dias' },
                    { value: countdown.hours, label: 'Horas' },
                    { value: countdown.minutes, label: 'Min' },
                    { value: countdown.seconds, label: 'Seg' },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center">
                      <div className="bg-background rounded-md px-3 py-2 min-w-[50px] shadow-sm border">
                        <span className="text-xl font-bold text-foreground" data-testid={`countdown-${label.toLowerCase()}`}>
                          {String(value).padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4" data-testid="hot-deal-progress">
                <Progress value={salesProgress} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{totalBids}</strong> lances registrados
                </p>
              </div>

              {/* CTA Button */}
              <Button asChild size="lg" className="w-full">
                <Link href={`/lots/${currentLot.id}`} data-testid="hot-deal-cta">
                  Ver Detalhes e Dar Lance
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
