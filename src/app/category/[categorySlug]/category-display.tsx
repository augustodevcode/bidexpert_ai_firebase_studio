
'use client'; 

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getLots } from '@/app/admin/lots/actions'; // Fetch lots via action
import type { Lot, LotCategory, PlatformSettings } from '@/types';
import { getUniqueLotLocations, getUniqueSellerNames, slugify, getCategoryAssets } from '@/lib/sample-data';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import SidebarFilters from '@/components/sidebar-filters';
import type { ActiveFilters } from '@/components/sidebar-filters';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, SlidersHorizontal, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import SearchResultsFrame from '@/components/search-results-frame'; // Import SearchResultsFrame

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

  const [isLoading, setIsLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<LotCategory | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [allLots, setAllLots] = useState<Lot[]>([]); // Store all lots once
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]); // Lots to display after filtering

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('relevance');
  
  // States for filter options
  const [allCategoriesForFilter, setAllCategoriesForFilter] = useState<LotCategory[]>([]);
  const [uniqueLocationsForFilter, setUniqueLocationsForFilter] = useState<string[]>([]);
  const [uniqueSellersForFilter, setUniqueSellersForFilter] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({...initialFiltersState, category: categorySlug });


  useEffect(() => {
    async function fetchData() {
      if (!categorySlug || categorySlug === 'undefined') {
        console.error("Category slug is invalid:", categorySlug);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [allCats, settings, allLotsData] = await Promise.all([
            getLotCategories(),
            getPlatformSettings(),
            getLots(),
        ]);
        
        setAllCategoriesForFilter(allCats);
        setPlatformSettings(settings);
        setAllLots(allLotsData);

        const foundCategory = allCats.find(cat => cat.slug === categorySlug);
        setCurrentCategory(foundCategory || null);

        if (foundCategory) {
          const lotsForCategory = allLotsData.filter(lot => lot.categoryId === foundCategory.id || slugify(lot.type) === foundCategory.slug);
          setFilteredLots(lotsForCategory);
          setActiveFilters((prev: ActiveFilters) => ({ ...prev, category: foundCategory.slug }));
        } else {
          console.warn(`Category with slug '${categorySlug}' not found.`);
          setFilteredLots([]);
        }
        
        setUniqueLocationsForFilter(getUniqueLotLocations(allLotsData));
        setUniqueSellersForFilter(getUniqueSellerNames(allLotsData));

      } catch (error) {
        console.error("Error fetching category data:", error);
        setCurrentCategory(null);
        setFilteredLots([]);
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
    
    // Start with the lots for the current category page
    const baseLots = currentCategory 
      ? allLots.filter(lot => lot.categoryId === currentCategory.id || slugify(lot.type) === currentCategory.slug)
      : allLots;

    // Apply additional filters
    const newlyFilteredLots = baseLots.filter(lot => {
      // Price Range
      if (lot.price < filters.priceRange[0] || lot.price > filters.priceRange[1]) {
          return false;
      }
      // Locations
      if (filters.locations.length > 0) {
          const lotLocation = `${lot.cityName} - ${lot.stateUf}`;
          if (!filters.locations.includes(lotLocation)) return false;
      }
      // Sellers
      if (filters.sellers.length > 0 && lot.sellerName && !filters.sellers.includes(lot.sellerName)) {
          return false;
      }
      // Status
       if (filters.status && filters.status.length > 0 && !filters.status.includes(lot.status)) {
         return false;
       }
      return true;
    });

    setFilteredLots(newlyFilteredLots);
  };

  const handleFilterReset = () => {
    // Reset filters but keep the current page's category context
    const resetFilters = {...initialFiltersState, category: currentCategory?.slug || 'TODAS'};
    setActiveFilters(resetFilters);

    if (currentCategory) {
      const lotsForCategory = allLots.filter(lot => lot.categoryId === currentCategory.id || slugify(lot.type) === currentCategory.slug);
      setFilteredLots(lotsForCategory);
    } else {
      setFilteredLots([]); 
    }
    setIsFilterSheetOpen(false);
  };

  const sortedLots = useMemo(() => {
    return [...filteredLots].sort((a, b) => {
      switch (sortBy) {
        case 'lotNumber_asc':
          return (parseInt(String(a.number || a.id).replace(/\D/g,'')) || 0) - (parseInt(String(b.number || b.id).replace(/\D/g,'')) || 0);
        case 'lotNumber_desc':
          return (parseInt(String(b.number || b.id).replace(/\D/g,'')) || 0) - (parseInt(String(a.number || a.id).replace(/\D/g,'')) || 0);
        case 'endDate_asc':
          return new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime();
        case 'endDate_desc':
          return new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime();
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'views_desc':
          return (b.views || 0) - (a.views || 0);
        case 'id_desc': 
          return b.id.localeCompare(a.id);
        case 'relevance':
        default:
          if (a.status === 'ABERTO_PARA_LANCES' && b.status !== 'ABERTO_PARA_LANCES') return -1;
          if (a.status !== 'ABERTO_PARA_LANCES' && b.status === 'ABERTO_PARA_LANCES') return 1;
          return new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime();
      }
    });
  }, [filteredLots, sortBy]);

  const renderGridItem = (item: Lot) => <LotCard lot={item} platformSettings={platformSettings!} />;
  const renderListItem = (item: Lot) => <LotListItem lot={item} platformSettings={platformSettings!} />;

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
            disableCategoryFilter={true}
          />
        </aside>

        <main>
          <SearchResultsFrame
            items={sortedLots}
            totalItemsCount={sortedLots.length}
            renderGridItem={renderGridItem}
            renderListItem={renderListItem}
            sortOptions={sortOptions}
            initialSortBy={sortBy}
            onSortChange={setSortBy}
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="lotes"
            emptyStateMessage={`Nenhum lote encontrado em "${currentCategory.name}" com os filtros aplicados.`}
          />
        </main>
      </div>
    </div>
  );
}

