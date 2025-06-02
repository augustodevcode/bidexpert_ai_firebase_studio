
'use client'; // This component handles all client-side logic

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { sampleLots, getCategoryNameFromSlug, getCategoryAssets, getUniqueLotCategories, getUniqueLotLocations, getUniqueSellerNames, slugify } from '@/lib/sample-data';
import type { Lot } from '@/types';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import SidebarFilters from '@/components/sidebar-filters';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, SlidersHorizontal, Loader2, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';

interface CategoryDisplayProps {
  params: {
    categorySlug: string;
  };
}

const sortOptions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'lotNumber_asc', label: 'Nº Lote: Menor ao Maior' },
  { value: 'lotNumber_desc', label: 'Nº Lote: Maior ao Menor' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'views_desc', label: 'Mais Visitados' },
  { value: 'id_desc', label: 'Adicionados Recentemente' } // Simula por ID
];

export default function CategoryDisplay({ params }: CategoryDisplayProps) {
  const { categorySlug } = params; 

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isLoading, setIsLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string | undefined>(undefined);
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('relevance');

  useEffect(() => {
    setIsLoading(true);
    let tempCategoryName: string | undefined = undefined;
    let tempFilteredLots: Lot[] = [];

    if (categorySlug) {
      tempFilteredLots = sampleLots.filter(lot => lot.type && slugify(lot.type) === categorySlug);

      if (tempFilteredLots.length > 0) {
        tempCategoryName = getCategoryNameFromSlug(categorySlug);
        if (!tempCategoryName && tempFilteredLots[0]?.type) {
          tempCategoryName = tempFilteredLots[0].type;
        }
      }
    }

    setCategoryName(tempCategoryName);
    setFilteredLots(tempFilteredLots);
    setIsLoading(false);
  }, [categorySlug]);
  
  const categoryAssets = useMemo(() => {
    return getCategoryAssets(categoryName || categorySlug);
  }, [categoryName, categorySlug]);
  
  const uniqueCategoriesForFilter = useMemo(() => getUniqueLotCategories(), []);
  const uniqueLocationsForFilter = useMemo(() => getUniqueLotLocations(), []);
  const uniqueSellersForFilter = useMemo(() => getUniqueSellerNames(), []);

  const sortedAndFilteredLots = useMemo(() => {
    let lotsToSort = [...filteredLots];
    switch (sortBy) {
      case 'lotNumber_asc':
        lotsToSort.sort((a, b) => (parseInt(a.id.replace(/\D/g,'')) || 0) - (parseInt(b.id.replace(/\D/g,'')) || 0));
        break;
      case 'lotNumber_desc':
        lotsToSort.sort((a, b) => (parseInt(b.id.replace(/\D/g,'')) || 0) - (parseInt(a.id.replace(/\D/g,'')) || 0));
        break;
      case 'endDate_asc':
        lotsToSort.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
      case 'endDate_desc':
        lotsToSort.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
        break;
      case 'price_asc':
        lotsToSort.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        lotsToSort.sort((a, b) => b.price - a.price);
        break;
      case 'views_desc':
        lotsToSort.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'id_desc': // Simula "Adicionados Recentemente"
        lotsToSort.sort((a, b) => (parseInt(b.id.replace(/\D/g,'')) || 0) - (parseInt(a.id.replace(/\D/g,'')) || 0));
        break;
      case 'relevance':
      default:
        // Mantém a ordem original ou pode-se adicionar uma lógica padrão aqui
        break;
    }
    return lotsToSort;
  }, [filteredLots, sortBy]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando categoria...</p>
      </div>
    );
  }

  if (!categoryName) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Categoria Não Encontrada</h1>
        <p className="text-muted-foreground">A categoria "{categorySlug}" que você está procurando não existe ou não possui lotes.</p>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <div className="flex items-center text-sm text-muted-foreground mb-2">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span>Categorias</span>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground font-medium">{categoryName}</span>
      </div>
      
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-48 md:h-64 w-full">
          <Image 
            src={categoryAssets.bannerUrl} 
            alt={`Banner ${categoryName}`} 
            fill 
            className="object-cover"
            data-ai-hint={categoryAssets.bannerAiHint}
            priority
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
             <div className="relative h-16 w-16 mb-3">
                 <Image 
                    src={categoryAssets.logoUrl} 
                    alt={`Logo ${categoryName}`} 
                    fill 
                    className="object-contain p-1 bg-white/80 rounded-full"
                    data-ai-hint={categoryAssets.logoAiHint}
                 />
             </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-headline mb-1">{categoryName}</h1>
            {categoryAssets.bannerText && <p className="text-md md:text-lg text-gray-200 max-w-xl">{categoryAssets.bannerText}</p>}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8">
        <aside className="hidden md:block">
          <SidebarFilters 
            categories={uniqueCategoriesForFilter}
            locations={uniqueLocationsForFilter}
            sellers={uniqueSellersForFilter}
          />
        </aside>

        <main className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card border rounded-lg shadow-sm">
            <p className="text-sm text-muted-foreground">
              Mostrando {sortedAndFilteredLots.length} lote{sortedAndFilteredLots.length !== 1 ? 's' : ''} em <span className="font-semibold text-foreground">{categoryName}</span>
            </p>
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-[85vw] max-w-sm">
                    <div className="p-4 h-full overflow-y-auto">
                      <SidebarFilters 
                        categories={uniqueCategoriesForFilter}
                        locations={uniqueLocationsForFilter}
                        sellers={uniqueSellersForFilter}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Ver:</span>
                <Button
                  variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('card')}
                  aria-label="Visualização em Grade"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                  aria-label="Visualização em Lista"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {sortedAndFilteredLots.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'card' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {sortedAndFilteredLots.map((lot) => (
                viewMode === 'card' 
                  ? <LotCard key={lot.id} lot={lot} />
                  : <LotListItem key={lot.id} lot={lot} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">Nenhum Lote Encontrado</h2>
                <p className="text-muted-foreground">Não há lotes disponíveis nesta categoria no momento ou com os filtros aplicados.</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
