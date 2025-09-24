
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';

const slides = [
  {
    title: 'Velocidade e Estilo em Leilão',
    subtitle: 'Seu Próximo Esportivo Está Aqui',
    description: 'Descubra carros esportivos incríveis com preços imperdíveis. Dê seu lance!',
    imageUrl: 'https://images.unsplash.com/photo-1625231334168-35067f8853ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxjYXJybyUyMGVzcG9ydGl2b3xlbnwwfHx8fDE3NTAzNjc4NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    imageAlt: 'Carro Esportivo Vermelho',
    dataAiHint: 'carro esportivo vermelho',
    buttonText: 'Ver Esportivos',
    buttonLink: '/search?category=veiculos',
  },
  {
    title: 'Oportunidades Únicas em Leilão',
    subtitle: 'De Imóveis a Itens Raros',
    description: 'Explore uma vasta gama de produtos em nossos leilões diários. Grandes achados esperam por você.',
    imageUrl: 'https://picsum.photos/seed/hero2/1200/500',
    imageAlt: 'Itens Diversos de Leilão',
    dataAiHint: 'leilao itens diversos',
    buttonText: 'Explorar Leilões',
    buttonLink: '/search?type=auctions',
  },
];

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    onSelect(); // Set initial selected index
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative w-full bg-secondary/30 rounded-lg overflow-hidden mb-12 shadow-lg">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div className="flex-[0_0_100%] min-w-0 relative" key={index}>
              <div className="container mx-auto px-4 py-8 md:py-16 grid md:grid-cols-2 items-center gap-8">
                <div className="text-center md:text-left">
                  <h2 className="text-4xl md:text-5xl font-bold text-primary mb-3 font-headline">
                    {slide.title}
                  </h2>
                  <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                    {slide.subtitle}
                  </h3>
                  <p className="text-muted-foreground mb-8 text-lg">
                    {slide.description}
                  </p>
                  <Button size="lg" asChild>
                    <a href={slide.buttonLink}>{slide.buttonText}</a>
                  </Button>
                </div>
                <div className="relative aspect-[4/3] md:aspect-[16/9]">
                  <Image
                    src={slide.imageUrl}
                    alt={slide.imageAlt}
                    fill
                    className="object-contain md:object-cover rounded-md"
                    data-ai-hint={slide.dataAiHint}
                    priority={index === 0}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-10 w-10 rounded-full shadow-md"
        aria-label="Slide Anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-10 w-10 rounded-full shadow-md"
        aria-label="Próximo Slide"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full ${
              index === selectedIndex ? 'bg-primary' : 'bg-muted hover:bg-primary/50'
            } transition-colors`}
            onClick={() => scrollTo(index)}
            aria-label={`Ir para o slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
