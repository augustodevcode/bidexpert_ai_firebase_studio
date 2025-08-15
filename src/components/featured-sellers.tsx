'use client';

import * as React from 'react';
import type { SellerProfileInfo } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Building } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface FeaturedSellersProps {
  sellers: SellerProfileInfo[];
}

function SellerCard({ seller }: { seller: SellerProfileInfo }) {
  const sellerInitial = seller.name ? seller.name.charAt(0).toUpperCase() : 'S';
  return (
    <div className="p-1 h-full">
      <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`} className="block h-full">
        <Card className="h-full flex flex-col items-center justify-center p-4 hover:shadow-md transition-shadow duration-200">
          <div className="relative h-16 w-full mb-2">
            <Image
              src={seller.logoUrl || `https://placehold.co/120x60.png?text=${sellerInitial}`}
              alt={`Logo ${seller.name}`}
              fill
              className="object-contain"
              data-ai-hint={seller.dataAiHintLogo || "logo empresa"}
            />
          </div>
          <p className="text-xs text-center font-medium text-muted-foreground group-hover:text-primary transition-colors">
            {seller.name}
          </p>
        </Card>
      </Link>
    </div>
  );
}

export default function FeaturedSellers({ sellers }: FeaturedSellersProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    containScroll: 'trimSnaps',
  });

  const scrollPrev = React.useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  
  if (!sellers || sellers.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold flex items-center"><Building className="mr-3 h-7 w-7 text-primary"/> Vendedores</h2>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={scrollPrev} className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={scrollNext} className="h-8 w-8 rounded-full">
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sellers">
              Ver Todos
            </Link>
          </Button>
        </div>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="flex-[0_0_50%] sm:flex-[0_0_33.33%] md:flex-[0_0_25%] lg:flex-[0_0_20%] xl:flex-[0_0_16.66%]"
            >
              <SellerCard seller={seller} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}