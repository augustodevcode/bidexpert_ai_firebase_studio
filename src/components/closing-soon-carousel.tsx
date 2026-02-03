/**
 * @fileoverview Carousel da seção Super Oportunidades com rolagem automática configurável.
 */
'use client';

import { useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import type { Lot, Auction, PlatformSettings } from '@/types';
import BidExpertCard from './BidExpertCard';

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
  
  const autoScrollIntervalSeconds = Math.max(
    3,
    Number(platformSettings.marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds ?? 6),
  );
  const autoScrollIntervalMs = autoScrollIntervalSeconds * 1000;

  useEffect(() => {
    if (!emblaApi || !autoScrollIntervalMs) return;
    const intervalId = window.setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, autoScrollIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [emblaApi, autoScrollIntervalMs]);


  return (
    <section className="py-12 bg-secondary/40" data-ai-id="super-opportunities-section">
      <div className="container mx-auto px-4" data-ai-id="super-opportunities-container">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4" data-ai-id="super-opportunities-header">
          <div data-ai-id="super-opportunities-title">
            <h2 className="text-3xl font-bold text-foreground mb-1 font-headline flex items-center gap-2" data-ai-id="super-opportunities-title-text">
              <Zap className="h-7 w-7 text-primary" />
              Super Oportunidades
            </h2>
            <p className="text-muted-foreground" data-ai-id="super-opportunities-subtitle">Lotes em 2ª Praça com até 50% de desconto - Encerrando em breve!</p>
          </div>
        </div>

        <div className="relative -mx-2" data-ai-id="super-opportunities-carousel">
          <div className="overflow-hidden" ref={emblaRef} data-ai-id="super-opportunities-viewport">
            <div className="flex -ml-4" data-ai-id="super-opportunities-track">
              {lots.map((lot) => (
                <div key={lot.id} className="flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] min-w-0 pl-4" data-ai-id="super-opportunities-slide">
                    <BidExpertCard
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
            data-ai-id="super-opportunities-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background hover:bg-accent rounded-full shadow-lg w-10 h-10 z-10 hidden md:flex"
            aria-label="Próximo"
            data-ai-id="super-opportunities-next"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-primary p-4 rounded-lg" data-ai-id="super-opportunities-note">
          <p className="text-sm text-blue-900" data-ai-id="super-opportunities-note-text">
            💡 <strong>2ª Praça:</strong> Lotes que não foram arrematados na primeira etapa retornam com descontos de até 50%!
            Aproveite esta oportunidade única para fazer um excelente negócio.
          </p>
        </div>
      </div>
    </section>
  );
}
