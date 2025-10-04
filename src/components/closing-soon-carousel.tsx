// src/components/closing-soon-carousel.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import type { Lot, Auction, PlatformSettings } from '@/types';
import { differenceInSeconds, isPast, isValid } from 'date-fns';
import UniversalCard from './universal-card';

interface ClosingSoonCarouselProps {
  lots: Lot[];
  auctions: Auction[];
  platformSettings: PlatformSettings;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeRemaining(endDate: Date | string): TimeRemaining | null {
  const end = new Date(endDate);
  if (!isValid(end) || isPast(end)) {
    return null;
  }
  
  const now = new Date();
  const diff = end.getTime() - now.getTime();

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
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(() => calculateTimeRemaining(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeRemaining) {
    return <div className="text-sm font-semibold text-destructive">Encerrado</div>;
  }

  const { days, hours, minutes, seconds } = timeRemaining;

  return (
    <ul className="flex items-center gap-2">
      {days > 0 && (
          <li className="flex flex-col items-center justify-center bg-background rounded-lg px-3 py-2 min-w-[60px] shadow-md">
            <span className="text-2xl font-bold text-destructive">{String(days).padStart(2, '0')}</span>
            <span className="text-xs text-muted-foreground uppercase">Dias</span>
          </li>
      )}
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


export default function ClosingSoonCarousel({ lots, auctions, platformSettings }: ClosingSoonCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
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
            <h2 className="text-3xl font-bold text-foreground mb-1 font-headline flex items-center gap-2">
              <Zap className="h-7 w-7 text-primary" />
              Super Oportunidades
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
            <div className="flex -ml-4">
              {lots.map((lot) => (
                <div key={lot.id} className="flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] min-w-0 pl-4">
                    <UniversalCard
                      item={lot}
                      type="lot"
                      platformSettings={platformSettings}
                      parentAuction={auctions.find(a => a.id === lot.auctionId)}
                    />
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background hover:bg-accent rounded-full shadow-lg w-10 h-10 z-10 hidden md:flex"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background hover:bg-accent rounded-full shadow-lg w-10 h-10 z-10 hidden md:flex"
            aria-label="Próximo"
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
