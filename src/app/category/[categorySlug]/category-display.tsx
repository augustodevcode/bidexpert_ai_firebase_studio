
'use client'; 

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getLots } from '@/app/admin/lots/actions'; // Fetch lots via action
import type { Lot, LotCategory, PlatformSettings, ActiveFilters } from '@/types';
import { getUniqueLotLocations, getUniqueSellerNames, slugify, getCategoryAssets } from '@/lib/sample-data';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import SidebarFilters from '@/components/sidebar-filters';
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
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [categoryLots, setCategoryLots] = useState<Lot[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('relevance');
  
  const [allCategoriesForFilter, setAllCategoriesForFilter] = useState<LotCategory[]>([]);
  const [uniqueLocationsForFilter, setUniqueLocationsForFilter] = useState<string[]>([]);
  const [uniqueSellersForFilter, setUniqueSellersForFilter] = useState<string[]>([]);
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({...initialFiltersState, category: categorySlug });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [allCats, settings, allLotsData] = await Promise.all([
            getLotCategories(),
            getPlatformSettings(),
            getLots(),
        ]);
        setAllLots(allLotsData); 
        setAllCategoriesForFilter(allCats);
        setPlatformSettings(settings);
        
        const foundCategory = allCats.find(cat => cat.slug === categorySlug);
        setCurrentCategory(foundCategory || null);

        if (foundCategory) {
          const lotsForCategory = allLotsData.filter(lot => lot.categoryId === foundCategory.id);
          setCategoryLots(lotsForCategory);
          setActiveFilters(prev => ({ ...prev, category: foundCategory.slug }));
        } else {
          setCategoryLots([]);
        }
        
        setUniqueLocationsForFilter(getUniqueLotLocations(allLotsData));
        setUniqueSellersForFilter(getUniqueSellerNames(allLotsData));

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
    
    let lotsToFilter = allLots; // Start with all lots

    // Apply category filter first
    if (filters.category && filters.category !== 'TODAS') {
        const categoryToFilter = allCategoriesForFilter.find(c => c.slug === filters.category);
        if (categoryToFilter) {
            lotsToFilter = allLots.filter(lot => lot.categoryId === categoryToFilter.id);
        } else {
             lotsToFilter = []; // Category not found, show no lots
        }
    } else if (currentCategory && filters.category === 'TODAS') {
         // If "All Categories" is selected on a specific category page, revert to showing all lots on that page
        lotsToFilter = allLots.filter(lot => lot.categoryId === currentCategory.id);
    }
    
    // Apply other filters (this part would be built out further)
    // For now, we'll just set the lots based on category
    setCategoryLots(lotsToFilter);
  };

  const handleFilterReset = () => {
    const resetFilters = {...initialFiltersState, category: currentCategory?.slug || 'TODAS'};
    setActiveFilters(resetFilters);
    if (currentCategory) {
      const lotsForCategory = allLots.filter(lot => lot.categoryId === currentCategory.id);
      setCategoryLots(lotsForCategory);
    } else {
      setCategoryLots(allLots); 
    }
    setIsFilterSheetOpen(false);
  };

  const sortedAndFilteredLots = useMemo(() => {
    let lotsToSort = [...categoryLots];
    switch (sortBy) {
      case 'lotNumber_asc':
        lotsToSort.sort((a, b) => (parseInt(String(a.number || a.id).replace(/\D/g,'')) || 0) - (parseInt(String(b.number || b.id).replace(/\D/g,'')) || 0));
        break;
      case 'lotNumber_desc':
        lotsToSort.sort((a, b) => (parseInt(String(b.number || b.id).replace(/\D/g,'')) || 0) - (parseInt(String(a.number || a.id).replace(/\D/g,'')) || 0));
        break;
      case 'endDate_asc':
        lotsToSort.sort((a, b) => new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime());
        break;
      case 'endDate_desc':
        lotsToSort.sort((a, b) => new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime());
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
        // This is a simplistic sort by ID, assuming higher ID means newer. A createdAt field would be better.
        lotsToSort.sort((a, b) => (b.id > a.id ? 1 : -1));
        break;
      case 'relevance':
      default:
        break;
    }
    return lotsToSort;
  }, [categoryLots, sortBy]);

  if (isLoading || !platformSettings) {
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
        <Link href="/search?type=lots&tab=categories" className="hover:text-primary">Categorias</Link>
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
                <span className="text-xs text-muted-foreground hidden sm:inline">Ver:</span>
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
                  ? <LotCard key={lot.id} lot={lot} platformSettings={platformSettings} />
                  : <LotListItem key={lot.id} lot={lot} platformSettings={platformSettings} />
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
