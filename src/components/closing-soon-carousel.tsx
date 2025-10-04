// src/components/closing-soon-carousel.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import type { Lot } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ClosingSoonCarouselProps {
  lots: Lot[];
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeRemaining(endDate: Date | string): TimeRemaining {
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

function GlobalCountdown({ endDate }: { endDate: Date | string }) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(endDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  const { days, hours, minutes, seconds } = timeRemaining;

  return (
    <ul className="flex items-center gap-2">
      <li className="flex flex-col items-center justify-center bg-background rounded-lg px-3 py-2 min-w-[60px] shadow-md">
        <span className="text-2xl font-bold text-destructive">{String(days).padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground uppercase">Dias</span>
      </li>
      <li className="flex flex-col items-center justify-center bg-background rounded-lg px-3 py-2 min-w-[60px] shadow-md">
        <span className="text-2xl font-bold text-destructive">{String(hours).padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground uppercase">Hrs</span>
      </li>
      <li className="flex flex-col items-center justify-center bg-background rounded-lg px-3 py-2 min-w-[60px] shadow-md">
        <span className="text-2xl font-bold text-destructive">{String(minutes).padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground uppercase">Min</span>
      </li>
      <li className="flex flex-col items-center justify-center bg-background rounded-lg px-3 py-2 min-w-[60px] shadow-md">
        <span className="text-2xl font-bold text-destructive">{String(seconds).padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground uppercase">Seg</span>
      </li>
    </ul>
  );
}

function LotCard({ lot }: { lot: Lot }) {
  const imageUrl = lot.imageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80';
  const currentPrice = lot.price || lot.initialPrice || 0;
  
  const discount = lot.initialPrice && currentPrice < lot.initialPrice
    ? Math.round(((lot.initialPrice - currentPrice) / lot.initialPrice) * 100)
    : lot.discountPercentage || 0;

  return (
    <div className="flex-[0_0_240px] p-2">
      <Card
        className="group relative overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      >
        <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`} className="block">
          <CardContent className="p-0">
            <div className="relative h-40 bg-muted overflow-hidden">
              <Image
                src={imageUrl}
                alt={lot.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="220px"
              />
              {discount > 0 && (
                <Badge variant="destructive" className="absolute top-2 left-2 animate-pulse">
                  -{discount}%
                </Badge>
              )}
            </div>
            <div className="p-3 space-y-2">
              <div>
                {lot.initialPrice && currentPrice < lot.initialPrice && (
                  <div className="text-xs text-muted-foreground line-through">
                    R$ {lot.initialPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
                <div className="text-lg font-bold text-primary">
                  R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[40px]">
                {lot.title}
              </h3>
              {(lot.cityName || lot.stateUf) && (
                <div className="text-xs text-muted-foreground">
                  📍 {lot.cityName}{lot.stateUf && ` - ${lot.stateUf}`}
                </div>
              )}
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}

export default function ClosingSoonCarousel({ lots }: ClosingSoonCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  if (!lots || lots.length === 0) {
    return null;
  }

  const closestEndDate = lots.reduce((closest, lot) => {
    if (!lot.endDate) return closest;
    if (!closest) return lot.endDate;
    return new Date(lot.endDate) < new Date(closest) ? lot.endDate : closest;
  }, lots[0]?.endDate);

  return (
    <section className="py-12 bg-secondary/40">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1 font-headline">
              ⚡ Super Oportunidades
            </h2>
            <p className="text-muted-foreground">Lotes em 2ª Praça com até 50% de desconto - Encerrando em breve!</p>
          </div>
          
          {closestEndDate && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground uppercase">Encerra em:</span>
              <GlobalCountdown endDate={closestEndDate} />
            </div>
          )}
        </div>

        <div className="relative -mx-2">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-2">
              {lots.map((lot) => (
                <LotCard key={lot.id} lot={lot} />
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background hover:bg-accent rounded-full shadow-lg w-10 h-10 z-10 hidden md:flex"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background hover:bg-accent rounded-full shadow-lg w-10 h-10 z-10 hidden md:flex"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-primary p-4 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 <strong>2ª Praça:</strong> Lotes que não foram arrematados na primeira etapa retornam com descontos de até 50%!
            Aproveite esta oportunidade única para arrematar com preços ainda mais vantajosos.
          </p>
        </div>
      </div>
    </section>
  );
}
