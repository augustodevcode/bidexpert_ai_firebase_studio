// src/app/category/[categorySlug]/category-display.tsx
/**
 * @fileoverview Componente de cliente que renderiza o conteúdo de uma página de categoria.
 * É responsável por buscar todos os dados necessários (lotes, categorias, filtros),
 * gerenciar o estado da UI (filtros, ordenação, paginação) e exibir os
 * resultados para a categoria específica definida pelo slug na URL.
 */
'use client'; 

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import type { Lot, LotCategory, PlatformSettings, SellerProfileInfo, Auction } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { ActiveFilters } from '@/components/BidExpertFilter';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame'; 
import dynamic from 'next/dynamic';
import BidExpertFilterSkeleton from '@/components/BidExpertFilterSkeleton';
import { getCategoryAssets } from '@/lib/ui-helpers';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';

const BidExpertFilter = dynamic(() => import('@/components/BidExpertFilter'), {
  loading: () => <BidExpertFilterSkeleton />,
  ssr: false,
});

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
  makes: [],
  models: [],
  startDate: undefined,
  endDate: undefined,
  status: [],
};

export default function CategoryDisplay({ params }: CategoryDisplayProps) {
  const paramsFromHook = useParams();
  const categorySlug = (paramsFromHook.categorySlug as string) || params.categorySlug;

  const [isLoading, setIsLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<LotCategory | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [allLots, setAllLots] = useState<Lot[]>([]); 
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortByState] = useState<string>('relevance');
  
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
        const [categories, platform, lots, sellers, auctions] = await Promise.all([
          getLotCategories(),
          getPlatformSettings(),
          getLots(undefined, true), // Public Call
          getSellers(true), // Public Call
          getAuctions(true), // Public Call
        ]);
        
        setAllAuctions(auctions);
        setAllCategoriesForFilter(categories);
        setPlatformSettings(platform as PlatformSettings);
        setAllLots(lots);

        const foundCategory = categories.find(cat => cat.slug === categorySlug);
        setCurrentCategory(foundCategory || null);

        if (foundCategory) {
          const lotsForCategory = lots.filter(lot => lot.categoryId === foundCategory.id || slugify(lot.type) === foundCategory.slug);
          setFilteredLots(lotsForCategory);
          setActiveFilters((prev: ActiveFilters) => ({ ...prev, category: foundCategory.slug }));
        } else {
          console.warn(`Category with slug '${categorySlug}' not found.`);
          setFilteredLots([]);
        }
        
        const locations = new Set<string>();
        lots.forEach(item => {
            if (item.cityName && item.stateUf) locations.add(`${item.cityName} - ${item.stateUf}`);
        });
        setUniqueLocationsForFilter(Array.from(locations).sort());
        setUniqueSellersForFilter(sellers.map(s => s.name).sort());

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
  
  const handleFilterSubmit = (filters: ActiveFilters) => {
    const fixedCategoryFilter = {...filters, category: categorySlug};
    setActiveFilters(fixedCategoryFilter);
    setIsFilterSheetOpen(false); 
    
    const baseLots = currentCategory 
      ? allLots.filter(lot => lot.categoryId === currentCategory.id || slugify(lot.type) === currentCategory.slug)
      : [];

    const newlyFilteredLots = baseLots.filter(lot => {
      if (lot.price < fixedCategoryFilter.priceRange[0] || lot.price > fixedCategoryFilter.priceRange[1]) {
          return false;
      }
      if (fixedCategoryFilter.locations.length > 0) {
          const lotLocation = `${lot.cityName} - ${lot.stateUf}`;
          if (!fixedCategoryFilter.locations.includes(lotLocation)) return false;
      }
      if (fixedCategoryFilter.sellers.length > 0 && lot.sellerName && !fixedCategoryFilter.sellers.includes(lot.sellerName)) {
          return false;
      }
       if (fixedCategoryFilter.status && fixedCategoryFilter.status.length > 0 && !fixedCategoryFilter.status.includes(lot.status)) {
         return false;
       }
      return true;
    });

    setFilteredLots(newlyFilteredLots);
  };
  
  const handleFilterReset = () => {
    const resetFilters = {...initialFiltersState, category: categorySlug};
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
          return String(b.id).localeCompare(String(a.id));
        case 'relevance':
        default:
          if (a.status === 'ABERTO_PARA_LANCES' && b.status !== 'ABERTO_PARA_LANCES') return -1;
          if (a.status !== 'ABERTO_PARA_LANCES' && b.status === 'ABERTO_PARA_LANCES') return 1;
          return new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime();
      }
    });
  }, [filteredLots, sortBy]);

  const renderGridItem = (item: Lot) => {
    const parentAuction = allAuctions.find(a => a.id === item.auctionId);
    return <BidExpertCard item={item} type="lot" parentAuction={parentAuction} platformSettings={platformSettings!} />;
  };

  const renderListItem = (item: Lot) => {
    const parentAuction = allAuctions.find(a => a.id === item.auctionId);
    return <BidExpertListItem item={item} type="lot" parentAuction={parentAuction} platformSettings={platformSettings!} />;
  };

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
        <p className="text-muted-foreground">A categoria &quot;{categorySlug}&quot; que você está procurando não existe.</p>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }
  
  const bannerUrl = currentCategory.coverImageUrl || getCategoryAssets(currentCategory.name).bannerUrl;
  const bannerAiHint = currentCategory.dataAiHintCover || getCategoryAssets(currentCategory.name).bannerAiHint;

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
            src={bannerUrl} 
            alt={`Banner ${currentCategory.name}`} 
            fill 
            className="object-cover"
            sizes="100vw"
            data-ai-hint={bannerAiHint}
            priority
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white font-headline mb-1">{currentCategory.name}</h1>
            {currentCategory.description && <p className="text-md md:text-lg text-gray-200 max-w-xl">{currentCategory.description}</p>}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8">
        <aside className="hidden md:block sticky top-24 h-fit">
          <BidExpertFilter 
            categories={allCategoriesForFilter}
            locations={uniqueLocationsForFilter}
            sellers={uniqueSellersForFilter}
            onFilterSubmit={handleFilterSubmit as any}
            onFilterReset={handleFilterReset}
            initialFilters={activeFilters as ActiveFilters}
            filterContext="lots"
            disableCategoryFilter={true}
          />
        </aside>

        <main className="min-w-0 space-y-6 md:ml-4">
          <BidExpertSearchResultsFrame
            items={sortedLots}
            totalItemsCount={sortedLots.length}
            renderGridItem={renderGridItem}
            renderListItem={renderListItem}
            sortOptions={sortOptions}
            initialSortBy={sortBy}
            onSortChange={setSortByState}
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="lotes"
            emptyStateMessage={`Nenhum lote encontrado em &quot;${currentCategory.name}&quot; com os filtros aplicados.`}
          />
        </main>
      </div>
    </div>
  );
}
