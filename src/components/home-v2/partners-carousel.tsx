/**
 * @file PartnersCarousel Component
 * @description Horizontal carousel of partner/consignor logos with
 * links to their respective pages.
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import type { PartnerData } from './types';

interface PartnersCarouselProps {
  partners: PartnerData[];
  title?: string;
  subtitle?: string;
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  banco: 'Banco',
  seguradora: 'Seguradora',
  governo: 'Governo',
  leiloeiro: 'Leiloeiro',
  corporacao: 'Corporação',
};

export default function PartnersCarousel({
  partners,
  title = 'Canais e Parceiros',
  subtitle = 'Conheça os comitentes e leiloeiros que confiam em nós',
}: PartnersCarouselProps) {
  if (partners.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-muted/30" data-testid="partners-carousel">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>

        {/* Carousel */}
        <Carousel
          opts={{
            align: 'center',
            loop: true,
          }}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent className="-ml-4">
            {partners.map((partner) => (
              <CarouselItem
                key={partner.id}
                className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5"
              >
                <Link
                  href={partner.href}
                  className="block group"
                  data-testid={`partner-${partner.id}`}
                >
                  <div className={cn(
                    "flex flex-col items-center justify-center p-4 h-32",
                    "bg-card rounded-lg border transition-all duration-200",
                    "hover:shadow-md hover:border-primary/50 hover:-translate-y-1"
                  )}>
                    {partner.logoUrl ? (
                      <div className="relative w-full h-12 mb-2">
                        <Image
                          src={partner.logoUrl}
                          alt={partner.name}
                          fill
                          className="object-contain filter grayscale group-hover:grayscale-0 transition-all"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-xs text-center font-medium line-clamp-1">
                      {partner.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {PARTNER_TYPE_LABELS[partner.type] || partner.type}
                    </span>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12" />
          <CarouselNext className="hidden md:flex -right-12" />
        </Carousel>

        {/* View all link */}
        <div className="text-center mt-6">
          <Link
            href="/sellers"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver todos os parceiros
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
