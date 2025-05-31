
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Dados de exemplo para o carrossel
const slides = [
  {
    title: 'Luminária de Chão Romanza',
    subtitle: 'Com Cúpula Branca',
    description: 'Luminária de chão com certificação UL.',
    imageUrl: 'https://placehold.co/1200x500.png',
    imageAlt: 'Luminária de Chão Romanza',
    dataAiHint: 'luminaria moderna',
    buttonText: 'Compre Agora',
    buttonLink: '#',
  },
  // Adicione mais slides aqui se desejar um carrossel dinâmico no futuro
];

export default function HeroCarousel() {
  // Para um carrossel estático, pegamos apenas o primeiro slide
  const currentSlide = slides[0];

  return (
    <section className="relative w-full bg-secondary/30 rounded-lg overflow-hidden mb-12 shadow-lg">
      <div className="container mx-auto px-4 py-8 md:py-16 grid md:grid-cols-2 items-center gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-3 font-headline">
            {currentSlide.title}
          </h2>
          <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            {currentSlide.subtitle}
          </h3>
          <p className="text-muted-foreground mb-8 text-lg">
            {currentSlide.description}
          </p>
          <Button size="lg" asChild>
            <a href={currentSlide.buttonLink}>{currentSlide.buttonText}</a>
          </Button>
        </div>
        <div className="relative aspect-[4/3] md:aspect-[16/9]">
          <Image
            src={currentSlide.imageUrl}
            alt={currentSlide.imageAlt}
            fill
            className="object-contain md:object-cover rounded-md"
            data-ai-hint={currentSlide.dataAiHint}
            priority
          />
        </div>
      </div>

      {/* Botões de Navegação (estáticos por enquanto) */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-10 w-10 rounded-full shadow-md"
        aria-label="Slide Anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-10 w-10 rounded-full shadow-md"
        aria-label="Próximo Slide"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Indicadores de Slide (estáticos por enquanto) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full ${
              index === 0 ? 'bg-primary' : 'bg-muted hover:bg-primary/50'
            } transition-colors`}
            aria-label={`Ir para o slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
