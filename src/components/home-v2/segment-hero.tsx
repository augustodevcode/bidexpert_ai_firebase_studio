/**
 * @file SegmentHero Component
 * @description Hero banner component for segment landing pages with
 * background image, title, subtitle, CTAs, and optional quick filters.
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Play, Filter, MapPin, DollarSign, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SegmentConfig, FilterOptions } from './types';

interface SegmentHeroProps {
  config: SegmentConfig;
  filters?: FilterOptions;
  eventsCount?: number;
  lotsCount?: number;
}

const BRAZILIAN_STATES = [
  { value: 'SP', label: 'São Paulo' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PR', label: 'Paraná' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'BA', label: 'Bahia' },
  { value: 'GO', label: 'Goiás' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'PE', label: 'Pernambuco' },
];

const PRICE_RANGES = [
  { value: '0-50000', label: 'Até R$ 50.000' },
  { value: '50000-100000', label: 'R$ 50.000 - R$ 100.000' },
  { value: '100000-250000', label: 'R$ 100.000 - R$ 250.000' },
  { value: '250000-500000', label: 'R$ 250.000 - R$ 500.000' },
  { value: '500000+', label: 'Acima de R$ 500.000' },
];

export default function SegmentHero({ 
  config, 
  filters,
  eventsCount = 0,
  lotsCount = 0 
}: SegmentHeroProps) {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');

  const buildFilterUrl = () => {
    const params = new URLSearchParams();
    if (selectedState) params.set('state', selectedState);
    if (selectedPrice) params.set('priceRange', selectedPrice);
    if (selectedCondition) params.set('condition', selectedCondition);
    return `/${config.id}?${params.toString()}`;
  };

  return (
    <section className="relative min-h-[420px] md:min-h-[500px] overflow-hidden" data-testid="segment-hero">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <Image
          src={config.heroImage}
          alt={config.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-2xl space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
              {eventsCount > 0 ? `${eventsCount} eventos ativos` : 'Eventos ativos'}
            </Badge>
            {lotsCount > 0 && (
              <Badge variant="outline" className="bg-background/50">
                {lotsCount}+ lotes disponíveis
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            {config.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
            {config.heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" asChild>
              <Link href={`/${config.id}`}>
                Ver todos os eventos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-background/50" asChild>
              <Link href={`/faq#como-funciona-${config.id}`}>
                <Play className="mr-2 h-4 w-4" />
                Como funciona?
              </Link>
            </Button>
          </div>

          {/* Quick filters */}
          <div className="pt-6">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Filtro rápido</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger data-testid="hero-filter-state">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPrice} onValueChange={setSelectedPrice}>
                  <SelectTrigger data-testid="hero-filter-price">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Faixa de preço" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger data-testid="hero-filter-condition">
                    <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seminovo">Seminovo</SelectItem>
                    <SelectItem value="usado">Usado</SelectItem>
                    <SelectItem value="sinistrado">Sinistrado</SelectItem>
                    <SelectItem value="judicial">Judicial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 flex justify-end">
                <Button 
                  size="sm" 
                  className="w-full sm:w-auto"
                  disabled={!selectedState && !selectedPrice && !selectedCondition}
                  asChild
                >
                  <Link href={buildFilterUrl()}>
                    Aplicar filtros
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
