// src/app/search/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, LayoutGrid, List, SlidersHorizontal, Loader2, Search as SearchIcon, FileText as TomadaPrecosIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import type { ActiveFilters } from '@/components/sidebar-filters'; 
import type { Auction, Lot, LotCategory, DirectSaleOffer, DirectSaleOfferType, PlatformSettings, SellerProfileInfo, VehicleMake, VehicleModel } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchResultsFrame from '@/components/search-results-frame';
import dynamic from 'next/dynamic';
import SidebarFiltersSkeleton from '@/components/sidebar-filters-skeleton';
import { getLotCategories as getCategories } from '@/app/admin/categories/actions';
import { getDirectSaleOffers } from '@/app/direct-sales/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getVehicleMakes } from '@/app/admin/vehicle-makes/actions';
import { getVehicleModels } from '@/app/admin/vehicle-models/actions';
import UniversalListItem from '@/components/universal-list-item';
import UniversalCard from '@/components/universal-card';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';


const SidebarFilters = dynamic(() => import('@/components/sidebar-filters'), {
  loading: () => <SidebarFiltersSkeleton />,
  ssr: false,
});

const sortOptionsAuctions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'visits_desc', label: 'Mais Visitados' },
  { value: 'id_desc', label: 'Adicionados Recentemente' }
];

const sortOptionsLots = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'lotNumber_asc', label: 'Nº Lote: Menor ao Maior' },
  { value: 'lotNumber_desc', label: 'Nº Lote: Maior ao Menor' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'views_desc', label: 'Mais Visitados' },
];

const sortOptionsDirectSales = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'createdAt_desc', label: 'Mais Recentes' },
  { value: 'createdAt_asc', label: 'Mais Antigos' },
  { value: 'price_asc', label: 'Preço: Menor para Maior (Compra Já)' },
  { value: 'price_desc', label: 'Preço: Maior para Menor (Compra Já)' },
  { value: 'views_desc', label: 'Mais Visitados' },
];


const initialFiltersState: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos' } = {
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
  offerType: 'ALL',
  searchType: 'auctions',
};


export default function SearchPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  
  // State for different data types
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [allDirectSales, setAllDirectSales] = useState<DirectSaleOffer[]>([]);
  
  // State for shared filter data
  const [allCategoriesForFilter, setAllCategoriesForFilter] = useState<LotCategory[]>([]);
  const [uniqueLocationsForFilter, setUniqueLocationsForFilter] = useState<string[]>([]);
  const [uniqueSellersForFilter, setUniqueSellersForFilter] = useState<string[]>([]);
  const [allMakesForFilter, setAllMakesForFilter] = useState<VehicleMake[]>([]);
  const [allModelsForFilter, setAllModelsForFilter] = useState<VehicleModel[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // State for UI and Filters
  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [currentSearchType, setCurrentSearchType] = useState<'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos'>( (searchParamsHook.get('type') as any) || 'auctions');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortByState] = useState<string>('relevance');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterDataLoading, setIsFilterDataLoading] = useState(true);
  

  // Effect to fetch shared data for filters once
  useEffect(() => {
    async function fetchSharedData() {
      setIsFilterDataLoading(true);
      try {
        const [categories, offers, sellers, settings, makes, models] = await Promise.all([
          getCategories(),
          getDirectSaleOffers(),
          getSellers(),
          getPlatformSettings(),
          getVehicleMakes(),
          getVehicleModels()
        ]);
        
        setAllDirectSales(offers);
        setAllCategoriesForFilter(categories);
        setPlatformSettings(settings as PlatformSettings);
        setAllMakesForFilter(makes);
        setAllModelsForFilter(models);

        const locations = new Set<string>();
        offers.forEach(offer => {
          if (offer.locationCity && offer.locationState) locations.add(`${offer.locationCity} - ${offer.locationState}`);
          else if (offer.locationCity) locations.add(offer.locationCity);
          else if (offer.locationState) locations.add(offer.locationState);
        });
        setUniqueLocationsForFilter(Array.from(locations).sort());
        
        setUniqueSellersForFilter(sellers.map(s => s.name).sort());

      } catch (error) {
        console.error("Error fetching shared filter data:", error);
      } finally {
        setIsFilterDataLoading(false);
        setIsLoading(false);
      }
    }
    fetchSharedData();
  }, []);
  
  // Effect to fetch main content data based on the active tab
  useEffect(() => {
    async function fetchContentData() {
      setIsLoading(true);
      let locations = new Set<string>();

      try {
        switch (currentSearchType) {
          case 'auctions':
          case 'tomada_de_precos':
            const auctions = await getAuctions();
            setAllAuctions(auctions);
            auctions.forEach(item => {
                if ('city' in item && 'state' in item && item.city && item.state) locations.add(`${item.city} - ${item.state}`);
            });
            break;
          case 'lots':
            const lots = await getLots();
            setAllLots(lots);
            lots.forEach(item => {
                if (item.cityName && item.stateUf) locations.add(`${item.cityName} - ${item.stateUf}`);
            });
            break;
          case 'direct_sale':
            const directSales = await getDirectSaleOffers();
            setAllDirectSales(directSales);
            directSales.forEach(item => {
                if (item.locationCity && item.locationState) locations.add(`${item.locationCity} - ${item.locationState}`);
            });
            break;
        }
        if (uniqueLocationsForFilter.length === 0 && locations.size > 0) {
            setUniqueLocationsForFilter(Array.from(locations).sort());
        }
      } catch (error) {
        console.error(`Error fetching data for tab ${currentSearchType}:`, error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContentData();
  }, [currentSearchType, uniqueLocationsForFilter.length]);


  const [activeFilters, setActiveFilters] = useState<ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos' }>(() => {
    const initial: typeof initialFiltersState = {...initialFiltersState, searchType: 'auctions'};
    const typeParam = searchParamsHook.get('type') as typeof currentSearchType | null;
    const auctionTypeFromQuery = searchParamsHook.get('auctionType');

    if (typeParam) {
        if (typeParam === 'auctions' && auctionTypeFromQuery === 'TOMADA_DE_PRECOS') {
            initial.searchType = 'tomada_de_precos';
            initial.modality = 'TOMADA_DE_PRECOS';
        } else {
            initial.searchType = typeParam;
        }
    } else if (auctionTypeFromQuery === 'TOMADA_DE_PRECOS') {
        initial.searchType = 'tomada_de_precos';
        initial.modality = 'TOMADA_DE_PRECOS';
    }

    if (searchParamsHook.get('category')) initial.category = searchParamsHook.get('category')!;

    if (auctionTypeFromQuery && initial.searchType !== 'tomada_de_precos') {
        initial.modality = auctionTypeFromQuery.toUpperCase();
    }

    if (searchParamsHook.get('status')) initial.status = [searchParamsHook.get('status')!.toUpperCase()];
    else initial.status = (initial.searchType === 'direct_sale' || initial.searchType === 'tomada_de_precos') ? ['ACTIVE'] : [];

    if (searchParamsHook.get('offerType')) initial.offerType = searchParamsHook.get('offerType') as any;

    return initial;
  });


  useEffect(() => {
    const typeFromParams = searchParamsHook.get('type') as typeof currentSearchType | null;
    const auctionTypeFromParams = searchParamsHook.get('auctionType');

    let newSearchType: typeof currentSearchType = 'auctions'; 
    if (typeFromParams) {
        if (typeFromParams === 'auctions' && auctionTypeFromParams === 'TOMADA_DE_PRECOS') {
            newSearchType = 'tomada_de_precos';
        } else {
            newSearchType = typeFromParams;
        }
    } else if (auctionTypeFromParams === 'TOMADA_DE_PRECOS') {
        newSearchType = 'tomada_de_precos';
    }
    setCurrentSearchType(newSearchType);
  }, [searchParamsHook]);


  const handleSearchTypeChange = (type: 'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos') => {
    setCurrentSearchType(type);
    setSortByState('relevance');

    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    const categoryParam = currentParams.get('category') || 'TODAS';

    if (type === 'tomada_de_precos') {
        currentParams.set('type', 'auctions');
        currentParams.set('auctionType', 'TOMADA_DE_PRECOS');
        setActiveFilters(prev => ({ ...initialFiltersState, searchType: 'tomada_de_precos', modality: 'TOMADA_DE_PRECOS', category: categoryParam, status: ['ACTIVE'] }));
    } else {
        currentParams.set('type', type);
        currentParams.delete('auctionType');
        setActiveFilters(prev => ({ ...initialFiltersState, searchType: type, category: categoryParam, status: type === 'direct_sale' ? ['ACTIVE'] : []}));
    }
    router.push(`/search?${currentParams.toString()}`);
  };

  const handleFilterSubmit = (filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; }) => {
    setActiveFilters(prev => ({...prev, ...filters, searchType: currentSearchType}));
    setIsFilterSheetOpen(false); 
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('type', currentSearchType === 'tomada_de_precos' ? 'auctions' : currentSearchType);

    currentParams.set('category', filters.category);

    if (currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos') {
        currentParams.set('auctionType', currentSearchType === 'tomada_de_precos' ? 'TOMADA_DE_PRECOS' : filters.modality);
    } else {
        currentParams.delete('auctionType');
    }

    if (currentSearchType === 'direct_sale' && filters.offerType) {
        currentParams.set('offerType', filters.offerType);
    } else {
        currentParams.delete('offerType');
    }

    if (filters.status && filters.status.length > 0) {
        currentParams.set('status', filters.status.join(','));
    } else {
        currentParams.delete('status');
    }
    router.push(`/search?${currentParams.toString()}`);
  };

  const handleFilterReset = () => {
    const resetFilters: typeof initialFiltersState = {...initialFiltersState, searchType: currentSearchType};
    if (currentSearchType === 'tomada_de_precos') {
        resetFilters.modality = 'TOMADA_DE_PRECOS';
        resetFilters.status = ['ACTIVE'];
    } else if (currentSearchType === 'direct_sale') {
        resetFilters.status = ['ACTIVE'];
    }
    setActiveFilters(resetFilters);
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.delete('category');
    if (currentSearchType !== 'tomada_de_precos') currentParams.delete('auctionType');
    currentParams.delete('offerType');
    currentParams.delete('status');
    currentParams.set('type', currentSearchType === 'tomada_de_precos' ? 'auctions' : currentSearchType);
    if (currentSearchType === 'tomada_de_precos') currentParams.set('auctionType','TOMADA_DE_PRECOS');
    if (currentSearchType === 'direct_sale' || currentSearchType === 'tomada_de_precos') currentParams.set('status', 'ACTIVE');


    router.push(`/search?${currentParams.toString()}`);
    setIsFilterSheetOpen(false);
  };

  const filteredAndSortedItems = useMemo(() => {
    let itemsToFilter: any[] = [];
    let itemTypeContext: 'auction' | 'lot' | 'direct_sale' = 'auction';

    if (currentSearchType === 'auctions') {
      itemsToFilter = allAuctions.filter(auc => auc.auctionType !== 'TOMADA_DE_PRECOS');
      itemTypeContext = 'auction';
    } else if (currentSearchType === 'lots') {
      itemsToFilter = allLots;
      itemTypeContext = 'lot';
    } else if (currentSearchType === 'direct_sale') {
      itemsToFilter = allDirectSales;
      itemTypeContext = 'direct_sale';
    } else if (currentSearchType === 'tomada_de_precos') {
      itemsToFilter = allAuctions.filter(auc => auc.auctionType === 'TOMADA_DE_PRECOS');
      itemTypeContext = 'auction';
    }

    // 1. Apply Search Term first
    let searchedItems = itemsToFilter;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        searchedItems = itemsToFilter.filter(item => {
            let searchableText = item.title.toLowerCase();
            if (item.description) searchableText += ` ${item.description.toLowerCase()}`;
            if ('auctionName' in item && item.auctionName) searchableText += ` ${item.auctionName.toLowerCase()}`;
            if ('sellerName' in item && item.sellerName) searchableText += ` ${item.sellerName.toLowerCase()}`;
            else if ('seller' in item && (item as Auction).seller) searchableText += ` ${(item as Auction).seller!.name.toLowerCase()}`;
            if ('id' in item && item.id) searchableText += ` ${item.id.toLowerCase()}`;
            return searchableText.includes(term);
        });
    }

    // 2. Apply other filters
    let filteredItems = searchedItems.filter(item => {
      if (activeFilters.category !== 'TODAS') {
        const itemCategoryName = 'type' in item && item.type ? item.type : ('category' in item ? item.category?.name : undefined);
        const category = allCategoriesForFilter.find(c => c.slug === activeFilters.category);
        if (!itemCategoryName || !category || (item.categoryId !== category.id && slugify(itemCategoryName) !== category.slug)) return false;
      }
      const itemPrice = 'price' in item && typeof item.price === 'number' ? item.price : ('initialOffer' in item && typeof item.initialOffer === 'number' ? item.initialOffer : undefined);
      if (itemPrice !== undefined && (itemPrice < activeFilters.priceRange[0] || itemPrice > activeFilters.priceRange[1])) {
        return false;
      }
      if (activeFilters.locations.length > 0) {
        const itemLocationString = ('locationCity' in item && 'locationState' in item && item.locationCity && item.locationState) ? `${item.locationCity} - ${item.locationState}` : ('city' in item && 'state' in item && item.city && item.state) ? `${item.city} - ${item.state}` : ('cityName' in item && 'stateUf' in item && item.cityName && item.stateUf) ? `${item.cityName} - ${item.stateUf}` : undefined;
        if (!itemLocationString || !activeFilters.locations.includes(itemLocationString)) return false;
      }
      if (activeFilters.sellers.length > 0) {
        let sellerName: string | undefined = undefined;
        if ('sellerName' in item && item.sellerName) sellerName = item.sellerName;
        else if ('seller' in item && (item as Auction).seller) sellerName = (item as Auction).seller!.name;
        if (!sellerName || !activeFilters.sellers.includes(sellerName)) return false;
      }
       if (activeFilters.status && activeFilters.status.length > 0) {
          if (!item.status || !activeFilters.status.includes(item.status as string)) return false;
      }
      if (itemTypeContext === 'auction' && activeFilters.modality !== 'TODAS' && (item as Auction).auctionType?.toUpperCase() !== activeFilters.modality) return false;
      if (itemTypeContext === 'direct_sale' && activeFilters.offerType && activeFilters.offerType !== 'ALL' && (item as DirectSaleOffer).offerType !== activeFilters.offerType) return false;
      return true;
    });

    // 3. Apply sorting
    switch (sortBy) {
        case 'id_desc':
            filteredItems.sort((a,b) => String(b.id).localeCompare(String(a.id)));
            break;
        case 'endDate_asc':
            filteredItems.sort((a, b) => new Date((a as any).endDate).getTime() - new Date((b as any).endDate).getTime());
            break;
        case 'endDate_desc':
            filteredItems.sort((a, b) => new Date((b as any).endDate).getTime() - new Date((a as any).endDate).getTime());
            break;
        case 'price_asc':
             filteredItems.sort((a, b) => ((a as any).price ?? Infinity) - ((b as any).price ?? Infinity));
            break;
        case 'price_desc':
            filteredItems.sort((a, b) => ((b as any).price ?? -Infinity) - ((a as any).price ?? -Infinity));
            break;
        case 'views_desc':
            filteredItems.sort((a, b) => ((b as any).views || 0) - ((a as any).views || 0));
            break;
        case 'createdAt_desc':
            filteredItems.sort((a,b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
            break;
        case 'lotNumber_asc':
            filteredItems.sort((a,b) => (parseInt(String((a as Lot).number || a.id).replace(/\D/g,'')) || 0) - (parseInt(String((b as Lot).number || b.id).replace(/\D/g,'')) || 0));
            break;
        case 'relevance':
        default:
            break;
    }
    return filteredItems;
  }, [searchTerm, activeFilters, sortBy, currentSearchType, allAuctions, allLots, allDirectSales, allCategoriesForFilter]);

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('type', currentSearchType === 'tomada_de_precos' ? 'auctions' : currentSearchType);
    if (currentSearchType === 'tomada_de_precos') currentParams.set('auctionType', 'TOMADA_DE_PRECOS');

    if (searchTerm.trim()) {
        currentParams.set('term', searchTerm.trim());
    } else {
        currentParams.delete('term');
    }
    router.push(`/search?${currentParams.toString()}`);
  };

  const renderGridItem = (item: any, index: number): React.ReactNode => {
    if (!platformSettings) return null;
    let itemType: 'auction' | 'lot' | 'direct_sale' = currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos' ? 'auction' : currentSearchType;
    
    return (
        <UniversalCard
            key={`${itemType}-${item.id}-${index}`}
            item={item}
            type={itemType as 'auction' | 'lot'}
            platformSettings={platformSettings}
            parentAuction={itemType === 'lot' ? allAuctions.find(a => a.id === item.auctionId) : undefined}
        />
    );
  };

  const renderListItem = (item: any, index: number): React.ReactNode => {
     if (!platformSettings) return null;
     let itemType: 'auction' | 'lot' | 'direct_sale' = currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos' ? 'auction' : currentSearchType;

     return (
        <UniversalListItem
            key={`${itemType}-list-${item.id}-${index}`}
            item={item}
            type={itemType}
            platformSettings={platformSettings}
            parentAuction={itemType === 'lot' ? allAuctions.find(a => a.id === item.auctionId) : undefined}
        />
    );
  };

  const getSearchTypeLabel = () => {
    switch(currentSearchType) {
        case 'auctions': return 'leilões';
        case 'lots': return 'lotes';
        case 'direct_sale': return 'ofertas';
        case 'tomada_de_precos': return 'tomadas de preços';
        default: return 'itens';
    }
  }

  const currentSortOptions =
    currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos' ? sortOptionsAuctions :
    currentSearchType === 'lots' ? sortOptionsLots :
    sortOptionsDirectSales;


  if (isFilterDataLoading || !platformSettings) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground font-medium">Busca</span>
      </div>

      <Card className="shadow-lg p-6 bg-secondary/30">
        <div className="text-center mb-6">
          <ShoppingCart className="h-12 w-12 mx-auto text-primary mb-3" />
          <h1 className="text-3xl font-bold font-headline">Explore & Encontre</h1>
          <p className="text-muted-foreground mt-2">
            Use nossa busca avançada para encontrar leilões, lotes e ofertas de venda direta.
          </p>
        </div>
        <form onSubmit={handleSearchFormSubmit} className="flex flex-col md:flex-row items-center gap-4 w-full max-w-2xl mx-auto">
            <div className="relative flex-grow w-full">
                <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Buscar por palavra-chave..."
                className="h-12 pl-12 text-md rounded-lg shadow-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button type="submit" className="h-12 w-full md:w-auto">
              <SearchIcon className="mr-2 h-4 w-4 md:hidden" /> Buscar
            </Button>
        </form>
      </Card>
      
      <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8">
        <aside className="hidden md:block sticky top-24 h-fit">
             <SidebarFilters
                categories={allCategoriesForFilter}
                locations={uniqueLocationsForFilter}
                sellers={uniqueSellersForFilter}
                onFilterSubmit={handleFilterSubmit as any}
                onFilterReset={handleFilterReset}
                initialFilters={activeFilters as ActiveFilters}
                filterContext={currentSearchType === 'tomada_de_precos' ? 'auctions' : (currentSearchType  as 'auctions' | 'directSales')}
                makes={allMakesForFilter}
                models={allModelsForFilter}
            />
        </aside>
        
        <main className="min-w-0 space-y-6 md:ml-4">
            <Tabs value={currentSearchType} onValueChange={(value) => handleSearchTypeChange(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 gap-1 sm:gap-2">
                <TabsTrigger value="auctions">Leilões ({currentSearchType === 'auctions' ? filteredAndSortedItems.length : allAuctions.filter(a=> a.auctionType !== 'TOMADA_DE_PRECOS').length})</TabsTrigger>
                <TabsTrigger value="lots">Lotes ({currentSearchType === 'lots' ? filteredAndSortedItems.length : allLots.length})</TabsTrigger>
                <TabsTrigger value="direct_sale">Venda Direta ({currentSearchType === 'direct_sale' ? filteredAndSortedItems.length : allDirectSales.length})</TabsTrigger>
                <TabsTrigger value="tomada_de_precos">Tomada de Preços ({currentSearchType === 'tomada_de_precos' ? filteredAndSortedItems.length : allAuctions.filter(a => a.auctionType === 'TOMADA_DE_PRECOS').length})</TabsTrigger>
            </TabsList>

            <SearchResultsFrame
              items={filteredAndSortedItems}
              totalItemsCount={filteredAndSortedItems.length}
              renderGridItem={renderGridItem}
              renderListItem={renderListItem}
              sortOptions={currentSortOptions}
              initialSortBy={sortBy}
              onSortChange={setSortByState}
              platformSettings={platformSettings}
              isLoading={isLoading}
              searchTypeLabel={getSearchTypeLabel()}
              emptyStateMessage="Nenhum item encontrado com os filtros aplicados."
              onItemsPerPageChange={setItemsPerPage}
            />
            </Tabs>
        </main>
      </div>
    </div>
  );
}
