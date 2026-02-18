// src/components/hero-section.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Truck, RefreshCw, Shield, Headphones, Gift } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';

const mainSlides = [
  {
    title: 'LEILÕES',
    subtitle: 'JUDICIAIS E EXTRAJUDICIAIS',
    highlight: 'OPORTUNIDADES ÚNICAS',
    buttonText: 'Ver Leilões',
    buttonLink: '/search?type=auctions',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
    imageAlt: 'Leilões Judiciais',
    badge: 'Leilões Ativos',
  },
  {
    title: 'VEÍCULOS',
    subtitle: 'CARROS, MOTOS E CAMINHÕES',
    highlight: 'ABAIXO DO VALOR DE MERCADO',
    buttonText: 'Explorar Veículos',
    buttonLink: '/search?category=veiculos',
    imageUrl: 'https://images.unsplash.com/photo-1625231334168-35067f8853ed?w=1200&q=80',
    imageAlt: 'Veículos em Leilão',
    badge: 'Novos Lotes',
  },
  {
    title: 'IMÓVEIS',
    subtitle: 'CASAS, APARTAMENTOS E TERRENOS',
    highlight: 'LANCE AGORA',
    buttonText: 'Ver Imóveis',
    buttonLink: '/search?category=imoveis',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
    imageAlt: 'Imóveis em Leilão',
    badge: 'Destaque',
  },
];

const sidePromotions = [
  {
    title: 'Eletrônicos',
    discount: 'ATÉ 60% OFF',
    description: 'Notebooks, TVs, Celulares e mais',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80',
    link: '/search?category=eletronicos',
  },
  {
    title: 'Leilões Judiciais',
    discount: 'LANCE MÍNIMO',
    description: 'Transparência e segurança garantidas',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80',
    link: '/search?type=auctions&auctionType=JUDICIAL',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Leilões Seguros',
    description: 'Plataforma certificada',
  },
  {
    icon: RefreshCw,
    title: 'Lances em Tempo Real',
    description: 'Acompanhe ao vivo',
  },
  {
    icon: Truck,
    title: 'Entrega Facilitada',
    description: 'Logística simplificada',
  },
  {
    icon: Headphones,
    title: 'Suporte 24/7',
    description: 'Atendimento dedicado',
  },
  {
    icon: Gift,
    title: 'Sem Taxas Ocultas',
    description: 'Transparência total',
  },
];

export default function HeroSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  return (
    <div className="wrapper-hero-section" data-ai-id="hero-section">
      {/* Main Hero Banner */}
      <div className="container-hero-main" data-ai-id="hero-main-container">
        <div className="grid-hero-main" data-ai-id="hero-main-grid">
          {/* Main Carousel - Left Side */}
          <div className="wrapper-hero-carousel" data-ai-id="hero-carousel-section">
            <div className="container-carousel-relative" data-ai-id="hero-carousel-container">
              <div className="embla" ref={emblaRef} data-ai-id="hero-embla-root">
                <div className="embla__container flex">
                  {mainSlides.map((slide, index) => (
                    <div className="embla__slide flex-[0_0_100%] min-w-0 relative" key={index} data-ai-id={`hero-slide-${index}`}>
                      <div className="wrapper-hero-slide-content">
                        {/* Background Image */}
                        <div className="wrapper-hero-bg-image" data-ai-id={`hero-slide-bg-${index}`}>
                          <Image
                            src={slide.imageUrl}
                            alt={slide.imageAlt}
                            fill
                            className="img-hero-slide"
                            priority={index === 0}
                            sizes="(max-width: 1024px) 100vw, 66vw"
                          />
                          <div className="overlay-hero-slide" />
                        </div>

                        {/* Content */}
                        <div className="container-hero-slide-text">
                          <div className="wrapper-hero-text-content">
                            {slide.badge && (
                              <span className="badge-hero-slide" data-ai-id={`hero-slide-badge-${index}`}>
                                {slide.badge}
                              </span>
                            )}
                            <h2 className="header-hero-slide-title" data-ai-id={`hero-slide-title-${index}`}>
                              {slide.title}
                            </h2>
                            <h3 className="header-hero-slide-subtitle" data-ai-id={`hero-slide-subtitle-${index}`}>
                              {slide.subtitle}
                            </h3>
                            <p className="text-hero-slide-highlight" data-ai-id={`hero-slide-highlight-${index}`}>
                              {slide.highlight}
                            </p>
                            <Link href={slide.buttonLink} data-ai-id={`hero-slide-link-${index}`}>
                              <Button 
                                size="lg" 
                                className="btn-hero-slide-action"
                                data-ai-id={`hero-slide-button-${index}`}
                              >
                                {slide.buttonText}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollPrev}
                className="btn-hero-carousel-prev"
                aria-label="Previous slide"
                data-ai-id="hero-carousel-prev"
              >
                <ChevronLeft className="icon-hero-carousel-nav" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollNext}
                className="btn-hero-carousel-next"
                aria-label="Next slide"
                data-ai-id="hero-carousel-next"
              >
                <ChevronRight className="icon-hero-carousel-nav" />
              </Button>

              {/* Dots */}
              <div className="wrapper-hero-carousel-dots" data-ai-id="hero-carousel-dots">
                {mainSlides.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "btn-carousel-dot",
                      index === selectedIndex ? "btn-carousel-dot-active" : "btn-carousel-dot-inactive"
                    )}
                    onClick={() => scrollTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    data-ai-id={`hero-carousel-dot-${index}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Side Promotions - Right Side */}
          <div className="wrapper-hero-promotions" data-ai-id="hero-promotions-section">
            {sidePromotions.map((promo, index) => (
              <Link 
                href={promo.link} 
                key={index}
                className="link-hero-promotion"
                data-ai-id={`hero-promotion-${index}`}
              >
                <div className="container-hero-promotion">
                  <Image
                    src={promo.imageUrl}
                    alt={promo.title}
                    fill
                    className="img-hero-promotion"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="overlay-hero-promotion" />
                  
                  {/* Content */}
                  <div className="wrapper-hero-promotion-text">
                    <div className="container-hero-promotion-label">
                      <span className="badge-hero-promotion-discount" data-ai-id={`hero-promotion-discount-${index}`}>
                        {promo.discount}
                      </span>
                      <h3 className="header-hero-promotion-title" data-ai-id={`hero-promotion-title-${index}`}>
                        {promo.title}
                      </h3>
                      <p className="text-hero-promotion-desc" data-ai-id={`hero-promotion-desc-${index}`}>
                        {promo.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Features Bar */}
      <div className="section-hero-features" data-ai-id="hero-features-section">
        <div className="container-hero-features" data-ai-id="hero-features-container">
          <div className="grid-hero-features" data-ai-id="hero-features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="wrapper-hero-feature" data-ai-id={`hero-feature-${index}`}>
                  <div className="wrapper-hero-feature-icon-container">
                    <div className="wrapper-hero-feature-icon">
                      <Icon className="icon-hero-feature" />
                    </div>
                  </div>
                  <div className="wrapper-hero-feature-text">
                    <h4 className="header-hero-feature-title">
                      {feature.title}
                    </h4>
                    <p className="text-hero-feature-desc">
                      {feature.description}
                    </p>
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
