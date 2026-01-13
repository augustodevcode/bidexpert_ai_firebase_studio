/**
 * @file FeaturedEventsSection Component
 * @description Section displaying featured events in a carousel and grid,
 * with filtering options.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import EventCard from './event-card';
import type { FeaturedEvent, SegmentType } from './types';

interface FeaturedEventsSectionProps {
  segmentId: SegmentType;
  events: FeaturedEvent[];
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
}

export default function FeaturedEventsSection({
  segmentId,
  events,
  title = 'Eventos em Destaque',
  subtitle,
  showFilters = true,
}: FeaturedEventsSectionProps) {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  const filteredEvents = events.filter((event) => {
    if (eventTypeFilter !== 'all' && event.eventType !== eventTypeFilter) {
      return false;
    }
    if (periodFilter === '7days') {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return new Date(event.endDate) <= sevenDaysFromNow;
    }
    return true;
  });

  const featuredEvents = filteredEvents.slice(0, 6);
  const listEvents = filteredEvents.slice(6, 12);

  return (
    <section className="py-10 md:py-14 bg-muted/30" data-testid="featured-events-section">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3">
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-[160px]" data-testid="events-filter-type">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="EVENTO_UNICO">Evento Único</SelectItem>
                  <SelectItem value="PRIMEIRA_PRACA">1ª Praça</SelectItem>
                  <SelectItem value="SEGUNDA_PRACA">2ª Praça</SelectItem>
                  <SelectItem value="LEILAO_ONLINE">Leilão Online</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[180px]" data-testid="events-filter-period">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="7days">Encerram em 7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Carousel */}
        {featuredEvents.length > 0 && (
          <div className="mb-8">
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {featuredEvents.map((event) => (
                  <CarouselItem 
                    key={event.id} 
                    className="pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <EventCard event={event} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4" />
              <CarouselNext className="hidden md:flex -right-4" />
            </Carousel>
          </div>
        )}

        {/* List grid */}
        {listEvents.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Próximos eventos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listEvents.map((event) => (
                <EventCard key={event.id} event={event} variant="compact" />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou volte mais tarde.
            </p>
            <Button variant="outline" onClick={() => {
              setEventTypeFilter('all');
              setPeriodFilter('all');
            }}>
              Limpar filtros
            </Button>
          </div>
        )}

        {/* View all link */}
        {filteredEvents.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href={`/${segmentId}/events`}>
                Ver todos os eventos
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
