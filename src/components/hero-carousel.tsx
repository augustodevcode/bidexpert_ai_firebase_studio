// src/components/hero-carousel.tsx
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
    <section className="section-hero-carousel">
      <div className="container-carousel" ref={emblaRef}>
        <div className="list-carousel-slides">
          {slides.map((slide, index) => (
            <div className="item-carousel-slide" key={index}>
              <div className="grid-slide-content">
                <div className="container-slide-text">
                  <h2 className="title-carousel-slide">
                    {slide.title}
                  </h2>
                  <h3 className="subtitle-carousel-slide">
                    {slide.subtitle}
                  </h3>
                  <p className="description-carousel-slide">
                    {slide.description}
                  </p>
                  <Button size="lg" asChild className="btn-slide-action">
                    <a href={slide.buttonLink}>{slide.buttonText}</a>
                  </Button>
                </div>
                <div className="container-slide-image">
                  <Image
                    src={slide.imageUrl}
                    alt={slide.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="img-carousel-slide"
                    data-ai-hint={slide.dataAiHint}
                    priority={index < 2} // Prioritize the first two images
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
        className="btn-carousel-prev"
        aria-label="Slide Anterior"
      >
        <ChevronLeft className="icon-carousel-nav" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={scrollNext}
        className="btn-carousel-next"
        aria-label="Próximo Slide"
      >
        <ChevronRight className="icon-carousel-nav" />
      </Button>

      <div className="container-carousel-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`btn-carousel-dot ${index === selectedIndex ? 'is-selected' : ''}`}
            onClick={() => scrollTo(index)}
            aria-label={`Ir para o slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
