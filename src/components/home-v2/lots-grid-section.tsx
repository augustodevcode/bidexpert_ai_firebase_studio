/**
 * @file LotsGridSection Component
 * @description Section displaying lots in a grid with filtering sidebar
 * and segment-specific data display.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, Filter, X, SlidersHorizontal, Grid3X3, List, 
  ArrowUpDown, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import BidExpertCard from '@/components/BidExpertCard';
import type { LotCardData, SegmentType, FilterOptions } from './types';
import type { PlatformSettings } from '@/types';

interface LotsGridSectionProps {
  segmentId: SegmentType;
  lots: LotCardData[];
  title?: string;
  subtitle?: string;
  filters?: FilterOptions;
  showFinanceableFilter?: boolean;
  platformSettings: PlatformSettings;
}

export default function LotsGridSection({
  segmentId,
  lots,
  title = 'Lotes em Destaque',
  subtitle,
  filters,
  showFinanceableFilter = false,
  platformSettings,
}: LotsGridSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [financeableOnly, setFinanceableOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFiltersCount = [
    selectedState,
    selectedCondition,
    financeableOnly ? 'financeable' : '',
  ].filter(Boolean).length;

  const filteredLots = lots.filter((lot) => {
    if (selectedState && lot.state !== selectedState) return false;
    if (selectedCondition && lot.condition !== selectedCondition) return false;
    if (financeableOnly && !lot.badges.some(b => b.type === 'FINANCIAVEL')) return false;
    return true;
  });

  const sortedLots = [...filteredLots].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return (a.currentPrice || 0) - (b.currentPrice || 0);
      case 'price-desc':
        return (b.currentPrice || 0) - (a.currentPrice || 0);
      case 'ending-soon':
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case 'bids':
        return (b.bidsCount || 0) - (a.bidsCount || 0);
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSelectedState('');
    setSelectedCondition('');
    setFinanceableOnly(false);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* State filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Estado</Label>
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger data-testid="lots-filter-state">
            <SelectValue placeholder="Todos os estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os estados</SelectItem>
            <SelectItem value="SP">São Paulo</SelectItem>
            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
            <SelectItem value="MG">Minas Gerais</SelectItem>
            <SelectItem value="PR">Paraná</SelectItem>
            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Condition filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Classificação</Label>
        <Select value={selectedCondition} onValueChange={setSelectedCondition}>
          <SelectTrigger data-testid="lots-filter-condition">
            <SelectValue placeholder="Todas as condições" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as condições</SelectItem>
            <SelectItem value="seminovo">Seminovos</SelectItem>
            <SelectItem value="usado">Usados</SelectItem>
            <SelectItem value="sinistrado">Sinistrados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Financeable filter */}
      {showFinanceableFilter && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="financeable"
            checked={financeableOnly}
            onCheckedChange={(checked) => setFinanceableOnly(checked === true)}
            data-testid="lots-filter-financeable"
          />
          <Label
            htmlFor="financeable"
            className="text-sm font-medium cursor-pointer flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Quero financiar
          </Label>
        </div>
      )}

      {/* Clear filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Limpar filtros ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <section className="py-10 md:py-14" data-testid="lots-grid-section">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                  <div className="py-4">
                    <FilterContent />
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" data-testid="lots-sort">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
                <SelectItem value="ending-soon">Encerrando em breve</SelectItem>
                <SelectItem value="bids">Mais lances</SelectItem>
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="hidden sm:flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex gap-6">
          {/* Desktop sidebar filters */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-24 space-y-6 bg-card rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <h3 className="font-medium">Filtros</h3>
              </div>
              <Separator />
              <FilterContent />
            </div>
          </aside>

          {/* Lots grid */}
          <div className="flex-1">
            {sortedLots.length > 0 ? (
              <>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-4'
                }>
                  {sortedLots.map((lot) => (
                    <BidExpertCard
                      key={lot.id}
                      item={lot as any}
                      type="lot"
                      platformSettings={platformSettings}
                      showCountdown
                    />
                  ))}
                </div>

                {/* Load more */}
                <div className="mt-8 text-center">
                  <Button variant="outline" asChild>
                    <Link href={`/${segmentId}/lots`}>
                      Ver todos os lotes
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum lote encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros para ver mais resultados.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
