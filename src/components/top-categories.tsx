// src/components/top-categories.tsx
'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Car, Laptop, Sofa, Watch, Smartphone, Hammer, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import type { LotCategory } from '@/types';

interface TopCategoriesProps {
  categories: LotCategory[];
}

// Mapeamento de ícones por categoria
const categoryIcons: Record<string, any> = {
  'imoveis': Home,
  'veiculos': Car,
  'eletronicos': Laptop,
  'moveis': Sofa,
  'joias': Watch,
  'telefones': Smartphone,
  'ferramentas': Hammer,
  'default': Package,
};

function getCategoryIcon(slug: string) {
  const Icon = categoryIcons[slug] || categoryIcons['default'];
  return Icon;
}

// Imagens padrão por categoria
const categoryImages: Record<string, string> = {
  'imoveis': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300&q=80',
  'veiculos': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&q=80',
  'eletronicos': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&q=80',
  'moveis': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&q=80',
  'joias': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&q=80',
  'telefones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80',
  'ferramentas': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=300&q=80',
  'default': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&q=80',
};

function getCategoryImage(slug: string, logoUrl?: string | null) {
  if (logoUrl) return logoUrl;
  return categoryImages[slug] || categoryImages['default'];
}

export default function TopCategories({ categories }: TopCategoriesProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Categorias Principais
          </h2>
          <p className="text-gray-600">
            Explore lotes por categoria e encontre as melhores oportunidades
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.slug);
                const imageUrl = getCategoryImage(category.slug, category.logoUrl);

                return (
                  <Link
                    key={category.id}
                    href={`/search?category=${category.slug}`}
                    className="group flex-[0_0_150px] sm:flex-[0_0_180px]"
                  >
                    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full">
                      {/* Image Container */}
                      <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="180px"
                        />
                        
                        {/* Icon Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-3">
                          <div className="bg-white/90 rounded-full p-2">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      {/* Category Name */}
                      <p className="text-center text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {category.name}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-gray-100 rounded-full shadow-lg w-10 h-10 z-10 hidden md:flex"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-gray-100 rounded-full shadow-lg w-10 h-10 z-10 hidden md:flex"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors"
          >
            Ver Todas as Categorias
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
