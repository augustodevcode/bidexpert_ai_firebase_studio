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
    <div className="w-full bg-gradient-to-b from-gray-50 to-white">
      {/* Main Hero Banner */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Carousel - Left Side */}
          <div className="lg:col-span-8">
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white">
              <div className="embla" ref={emblaRef}>
                <div className="embla__container flex">
                  {mainSlides.map((slide, index) => (
                    <div className="embla__slide flex-[0_0_100%] min-w-0 relative" key={index}>
                      <div className="relative h-[400px] md:h-[500px] bg-gradient-to-r from-blue-50 to-purple-50">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                          <Image
                            src={slide.imageUrl}
                            alt={slide.imageAlt}
                            fill
                            className="object-cover opacity-90"
                            priority={index === 0}
                            sizes="(max-width: 1024px) 100vw, 66vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="relative h-full flex items-center">
                          <div className="px-8 md:px-16 max-w-2xl">
                            {slide.badge && (
                              <span className="inline-block px-4 py-1 bg-blue-500 text-white text-sm font-medium rounded-full mb-4">
                                {slide.badge}
                              </span>
                            )}
                            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-2">
                              {slide.title}
                            </h2>
                            <h3 className="text-2xl md:text-4xl font-semibold text-gray-700 mb-2">
                              {slide.subtitle}
                            </h3>
                            <p className="text-3xl md:text-5xl font-bold text-green-600 mb-6">
                              {slide.highlight}
                            </p>
                            <Link href={slide.buttonLink}>
                              <Button 
                                size="lg" 
                                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
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
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full shadow-lg w-12 h-12 z-10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full shadow-lg w-12 h-12 z-10"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              {/* Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {mainSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === selectedIndex 
                        ? 'bg-yellow-500 w-8' 
                        : 'bg-white/60 hover:bg-white/80'
                    }`}
                    onClick={() => scrollTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Side Promotions - Right Side */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {sidePromotions.map((promo, index) => (
              <Link 
                href={promo.link} 
                key={index}
                className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all bg-white flex-1"
              >
                <div className="relative h-[190px] md:h-[240px]">
                  <Image
                    src={promo.imageUrl}
                    alt={promo.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-center">
                    <div className="relative">
                      <span className="inline-block px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full mb-2">
                        {promo.discount}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                        {promo.title}
                      </h3>
                      <p className="text-sm text-gray-200">
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
      <div className="bg-white border-t border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center gap-3 group">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                      <Icon className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
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
