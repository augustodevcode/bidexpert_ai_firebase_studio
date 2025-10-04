// src/components/closing-soon-carousel.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import type { Lot, Auction, PlatformSettings } from '@/types';
import UniversalCard from './universal-card';
import LotCountdown from './lot-countdown';

interface ClosingSoonCarouselProps {
  lots: Lot[];
  auctions: Auction[];
  platformSettings: PlatformSettings;
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
               <LotCountdown endDate={closestEndDate} status='ABERTO_PARA_LANCES' className="text-destructive"/>
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
                      showCountdown={true}
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
