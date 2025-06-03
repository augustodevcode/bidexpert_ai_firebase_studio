
'use client'; 

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { sampleLots, getUniqueLotLocations, getUniqueSellerNames, slugify, getCategoryAssets } from '@/lib/sample-data'; // Keep sampleLots for now
import { getLotCategories, getLotCategory } from '@/app/admin/categories/actions'; // Import actions
import type { Lot, LotCategory } from '@/types';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import SidebarFilters, { type ActiveFilters } from '@/components/sidebar-filters';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, SlidersHorizontal, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
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
  { value: 'id_desc', label: 'Adicionados Recentemente' } 
];

const initialFiltersState: ActiveFilters = {
  modality: 'TODAS',
  category: 'TODAS', 
  priceRange: [0, 1000000],
  locations: [],
  sellers: [],
  startDate: undefined,
  endDate: undefined,
  status: [],
};

export default function CategoryDisplay({ params }: CategoryDisplayProps) {
  const { categorySlug } = params; 

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isLoading, setIsLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<LotCategory | null>(null);
  const [categoryLots, setCategoryLots] = useState<Lot[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('relevance');
  
  // For SidebarFilters
  const [allCategoriesForFilter, setAllCategoriesForFilter] = useState<LotCategory[]>([]);
  const [uniqueLocationsForFilter, setUniqueLocationsForFilter] = useState<string[]>([]);
  const [uniqueSellersForFilter, setUniqueSellersForFilter] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({...initialFiltersState, category: categorySlug });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch all categories for the filter sidebar
        const allCats = await getLotCategories();
        setAllCategoriesForFilter(allCats);
        
        // Find the current category by slug
        const foundCategory = allCats.find(cat => cat.slug === categorySlug);
        setCurrentCategory(foundCategory || null);

        if (foundCategory) {
          // TODO: Replace sampleLots with actual fetching of lots for this category
          // For now, filter sampleLots by the category name found
          const lotsForCategory = sampleLots.filter(lot => lot.type && slugify(lot.type) === foundCategory.slug);
          setCategoryLots(lotsForCategory);
          setActiveFilters(prev => ({ ...prev, category: foundCategory.slug }));
        } else {
          setCategoryLots([]);
        }
        
        // For now, locations and sellers still come from sample-data
        setUniqueLocationsForFilter(getUniqueLotLocations());
        setUniqueSellersForFilter(getUniqueSellerNames());

      } catch (error) {
        console.error("Error fetching category data:", error);
        setCurrentCategory(null);
        setCategoryLots([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [categorySlug]);
  
  const categoryAssets = useMemo(() => {
    return getCategoryAssets(currentCategory?.name || categorySlug);
  }, [currentCategory, categorySlug]);
  
  const handleFilterSubmit = (filters: ActiveFilters) => {
    setActiveFilters(filters);
    setIsFilterSheetOpen(false); 
    // TODO: Re-fetch or re-filter lots based on new activeFilters
    // For now, we only filter by category on initial load. Advanced filtering will require more logic.
    if (filters.category && filters.category !== 'TODAS') {
         const lotsForCategory = sampleLots.filter(lot => lot.type && slugify(lot.type) === filters.category);
         setCategoryLots(lotsForCategory);
    } else {
        // If "TODAS" is selected, show all sample lots or implement logic for this
        // For now, if currentCategory exists, stick to its lots, otherwise show all for "TODAS"
        if (currentCategory) {
            const lotsForCurrentCategory = sampleLots.filter(lot => lot.type && slugify(lot.type) === currentCategory.slug);
            setCategoryLots(lotsForCurrentCategory);
        } else {
            setCategoryLots(sampleLots); // Example: show all if category is 'TODAS' and no current one.
        }
    }

  };

  const handleFilterReset = () => {
    const resetFilters = {...initialFiltersState, category: currentCategory?.slug || 'TODAS'};
    setActiveFilters(resetFilters);
    // Re-filter based on the original category slug or 'TODAS'
    if (currentCategory) {
      const lotsForCategory = sampleLots.filter(lot => lot.type && slugify(lot.type) === currentCategory.slug);
      setCategoryLots(lotsForCategory);
    } else {
      // If no current category (e.g., slug was invalid), maybe show no lots or all (sampleLots for now)
      setCategoryLots(sampleLots); 
    }
    setIsFilterSheetOpen(false);
  };


  const sortedAndFilteredLots = useMemo(() => {
    // TODO: Implement full filtering based on activeFilters here, not just category.
    // For now, categoryLots is pre-filtered by categorySlug on load.
    // This sorting logic will apply to `categoryLots`.
    let lotsToSort = [...categoryLots];
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
      case 'id_desc': 
        lotsToSort.sort((a, b) => (parseInt(b.id.replace(/\D/g,'')) || 0) - (parseInt(a.id.replace(/\D/g,'')) || 0));
        break;
      case 'relevance':
      default:
        break;
    }
    return lotsToSort;
  }, [categoryLots, sortBy]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando categoria...</p>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Categoria Não Encontrada</h1>
        <p className="text-muted-foreground">A categoria "{categorySlug}" que você está procurando não existe.</p>
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
        <Link href="/search" className="hover:text-primary">Categorias</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground font-medium">{currentCategory.name}</span>
      </div>
      
      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-48 md:h-64 w-full">
          <Image 
            src={categoryAssets.bannerUrl} 
            alt={`Banner ${currentCategory.name}`} 
            fill 
            className="object-cover"
            data-ai-hint={categoryAssets.bannerAiHint}
            priority
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
             <div className="relative h-16 w-16 mb-3">
                 <Image 
                    src={categoryAssets.logoUrl} 
                    alt={`Logo ${currentCategory.name}`} 
                    fill 
                    className="object-contain p-1 bg-white/80 rounded-full"
                    data-ai-hint={categoryAssets.logoAiHint}
                 />
             </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-headline mb-1">{currentCategory.name}</h1>
            {categoryAssets.bannerText && <p className="text-md md:text-lg text-gray-200 max-w-xl">{categoryAssets.bannerText}</p>}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8">
        <aside className="hidden md:block">
          <SidebarFilters 
            categories={allCategoriesForFilter}
            locations={uniqueLocationsForFilter}
            sellers={uniqueSellersForFilter}
            onFilterSubmit={handleFilterSubmit}
            onFilterReset={handleFilterReset}
            initialFilters={activeFilters}
          />
        </aside>

        <main className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card border rounded-lg shadow-sm">
            <p className="text-sm text-muted-foreground">
              Mostrando {sortedAndFilteredLots.length} lote{sortedAndFilteredLots.length !== 1 ? 's' : ''} em <span className="font-semibold text-foreground">{currentCategory.name}</span>
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
                        categories={allCategoriesForFilter}
                        locations={uniqueLocationsForFilter}
                        sellers={uniqueSellersForFilter}
                        onFilterSubmit={handleFilterSubmit}
                        onFilterReset={handleFilterReset}
                        initialFilters={activeFilters}
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
