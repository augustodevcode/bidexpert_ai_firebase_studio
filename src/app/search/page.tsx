

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, LayoutGrid, List, SlidersHorizontal, Loader2, Search as SearchIcon, FileText as TomadaPrecosIcon } from 'lucide-react'; // Adicionado SearchIcon
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import type { ActiveFilters } from '@/components/sidebar-filters'; 
import AuctionCard from '@/components/auction-card';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import DirectSaleOfferCard from '@/components/direct-sale-offer-card';
import DirectSaleOfferListItem from '@/components/direct-sale-offer-list-item';
import type { Auction, Lot, LotCategory, DirectSaleOffer, DirectSaleOfferType, PlatformSettings } from '@/types';
import { slugify, getSampleData } from '@/lib/sample-data'; // Changed import
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuctionListItem from '@/components/auction-list-item';
import SearchResultsFrame from '@/components/search-results-frame';
import dynamic from 'next/dynamic';
import SidebarFiltersSkeleton from '@/components/sidebar-filters-skeleton';

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
  startDate: undefined,
  endDate: undefined,
  status: [],
  offerType: 'ALL',
  searchType: 'auctions',
};


export default function SearchPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  // State for fetched data
  const [allData, setAllData] = useState<{
      allAuctions: Auction[];
      allLots: Lot[];
      allDirectSales: DirectSaleOffer[];
      allLotsWithAuctionData: Lot[];
      allCategoriesForFilter: LotCategory[];
      uniqueLocationsForFilter: string[];
      uniqueSellersForFilter: string[];
      platformSettings: PlatformSettings | null;
    } | null>(null);

  // State for UI and Filters
  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [currentSearchType, setCurrentSearchType] = useState<'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos'>( (searchParamsHook.get('type') as any) || 'auctions');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortByState, setSortByState] = useState<string>('relevance');
  
  const [isLoading, setIsLoading] = useState(true);
  
  const searchItemsPerPage = allData?.platformSettings?.searchItemsPerPage || 12;
  const searchLoadMoreCount = allData?.platformSettings?.searchLoadMoreCount || 12;

  const [currentPage, setCurrentPage] = useState(1);
  const [visibleItemCount, setVisibleItemCount] = useState(searchLoadMoreCount);


  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const { 
              sampleAuctions, sampleLots, sampleDirectSaleOffers,
              sampleLotCategories, sampleSellers, samplePlatformSettings
            } = getSampleData();
            
            const locations = new Set<string>();
            [...sampleAuctions, ...sampleLots].forEach(item => {
                if (item.city && item.stateUf) locations.add(`${item.city} - ${item.stateUf}`);
                else if (item.city && (item as Auction).state) locations.add(`${item.city} - ${(item as Auction).state}`);
                else if (item.city) locations.add(item.city);
                else if (item.stateUf) locations.add(item.stateUf);
            });
            const sellerNames = new Set(sampleSellers.map(s => s.name));

            setAllData({
              allAuctions: sampleAuctions,
              allLots: sampleLots,
              allLotsWithAuctionData: sampleLots, // this is already processed in getSampleData
              allDirectSales: sampleDirectSaleOffers,
              allCategoriesForFilter: sampleLotCategories,
              uniqueLocationsForFilter: Array.from(locations).sort(),
              uniqueSellersForFilter: Array.from(sellerNames).sort(),
              platformSettings: samplePlatformSettings
            });

        } catch (error) {
            console.error("Error fetching initial search data:", error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
}, []);


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
    setCurrentPage(1);
    setVisibleItemCount(searchLoadMoreCount);
  }, [searchParamsHook, searchLoadMoreCount]);


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
    setCurrentPage(1); 
    setVisibleItemCount(searchLoadMoreCount);
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
    setCurrentPage(1); 
    setVisibleItemCount(searchLoadMoreCount);
  };

  const filteredAndSortedItems = useMemo(() => {
    if (!allData) return [];

    let itemsToFilter: any[] = [];
    let itemTypeContext: 'auction' | 'lot' | 'direct_sale' = 'auction';

    if (currentSearchType === 'auctions') {
      itemsToFilter = allData.allAuctions.filter(auc => auc.auctionType !== 'TOMADA_DE_PRECOS');
      itemTypeContext = 'auction';
    } else if (currentSearchType === 'lots') {
      itemsToFilter = allData.allLotsWithAuctionData;
      itemTypeContext = 'lot';
    } else if (currentSearchType === 'direct_sale') {
      itemsToFilter = allData.allDirectSales;
      itemTypeContext = 'direct_sale';
    } else if (currentSearchType === 'tomada_de_precos') {
      itemsToFilter = allData.allAuctions.filter(auc => auc.auctionType === 'TOMADA_DE_PRECOS');
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
            else if ('seller' in item && (item as Auction).seller) searchableText += ` ${(item as Auction).seller!.toLowerCase()}`;
            if ('id' in item && item.id) searchableText += ` ${item.id.toLowerCase()}`;
            return searchableText.includes(term);
        });
    }

    // 2. Apply other filters
    let filteredItems = searchedItems.filter(item => {
      if (activeFilters.category !== 'TODAS') {
        const itemCategoryName = 'type' in item && item.type ? item.type : ('category' in item ? item.category : undefined);
        if (!itemCategoryName || slugify(itemCategoryName) !== activeFilters.category) return false;
      }
      const itemPrice = 'price' in item && typeof item.price === 'number' ? item.price : ('initialOffer' in item && typeof item.initialOffer === 'number' ? item.initialOffer : undefined);
      if (itemPrice !== undefined && (itemPrice < activeFilters.priceRange[0] || itemPrice > activeFilters.priceRange[1])) return false;
      if (activeFilters.locations.length > 0) {
        const itemLocationString = ('locationCity' in item && 'locationState' in item && item.locationCity && item.locationState) ? `${item.locationCity} - ${item.locationState}` : ('city' in item && 'state' in item && item.city && item.state) ? `${item.city} - ${item.state}` : ('cityName' in item && 'stateUf' in item && item.cityName && item.stateUf) ? `${item.cityName} - ${item.stateUf}` : undefined;
        if (!itemLocationString || !activeFilters.locations.includes(itemLocationString)) return false;
      }
      if (activeFilters.sellers.length > 0) {
        let sellerName: string | undefined = undefined;
        if ('sellerName' in item && item.sellerName) sellerName = item.sellerName;
        else if ('seller' in item && (item as Auction).seller) sellerName = (item as Auction).seller!;
        if (!sellerName || !activeFilters.sellers.includes(sellerName)) return false;
      }
      if (activeFilters.status && activeFilters.status.length > 0 && (!item.status || !activeFilters.status.includes(item.status as string))) return false;
      if (itemTypeContext === 'auction' && activeFilters.modality !== 'TODAS' && (item as Auction).auctionType?.toUpperCase() !== activeFilters.modality) return false;
      if (itemTypeContext === 'direct_sale' && activeFilters.offerType && activeFilters.offerType !== 'ALL' && (item as DirectSaleOffer).offerType !== activeFilters.offerType) return false;
      return true;
    });

    // 3. Apply sorting
    switch (sortByState) {
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
  }, [searchTerm, activeFilters, sortByState, currentSearchType, allData]);

  const paginatedItems = useMemo(() => {
    if (!allData) return [];
    if (allData.platformSettings?.searchPaginationType === 'numberedPages') {
      const startIndex = (currentPage - 1) * searchItemsPerPage;
      const endIndex = startIndex + searchItemsPerPage;
      return filteredAndSortedItems.slice(startIndex, endIndex);
    } else { 
      return filteredAndSortedItems.slice(0, visibleItemCount);
    }
  }, [filteredAndSortedItems, allData, currentPage, searchItemsPerPage, visibleItemCount]);


  const handleLoadMore = () => {
    setVisibleItemCount(prev => Math.min(prev + searchLoadMoreCount, filteredAndSortedItems.length));
  };

  const handlePageChange = (newPage: number) => {
    if (!allData) return;
    const totalPages = searchItemsPerPage > 0 ? Math.ceil(filteredAndSortedItems.length / searchItemsPerPage) : 1;
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
       window.scrollTo(0, 0);
    }
  };

  const currentSortOptions =
    currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos' ? sortOptionsAuctions :
    currentSearchType === 'lots' ? sortOptionsLots :
    sortOptionsDirectSales;

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
    setCurrentPage(1); 
    setVisibleItemCount(searchLoadMoreCount);
  };

  const renderGridItem = (item: any, index: number): React.ReactNode => {
    if (!allData?.platformSettings) return null;
    if (currentSearchType === 'lots') return <LotCard key={`${(item as Lot).auctionId}-${item.id}-${index}`} lot={item as Lot} platformSettings={allData.platformSettings}/>;
    if (currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos') return <AuctionCard key={`${item.id}-${index}`} auction={item as Auction} />;
    if (currentSearchType === 'direct_sale') return <DirectSaleOfferCard key={`${item.id}-${index}`} offer={item as DirectSaleOffer} />;
    return null;
  };

  const renderListItem = (item: any, index: number): React.ReactNode => {
    if (!allData?.platformSettings) return null;
    if (currentSearchType === 'lots') return <LotListItem key={`${(item as Lot).auctionId}-${item.id}-${index}`} lot={item as Lot} platformSettings={allData.platformSettings}/>;
    if (currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos') return <AuctionListItem key={`${item.id}-${index}`} auction={item as Auction} />;
    if (currentSearchType === 'direct_sale') return <DirectSaleOfferListItem key={`${item.id}-${index}`} offer={item as DirectSaleOffer} />;
    return null;
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

  if (isLoading || !allData) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando dados de busca...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground font-medium">Resultados da Busca</span>
      </div>

      <Card className="shadow-lg overflow-hidden">
        <div className="relative h-48 md:h-56 w-full">
            <img 
                src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxncmFkaWVudCUyMGJsdWV8ZW58MHx8fHwxNzUyMTEyMTYyfDA&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="Banner de Busca" 
                className="object-cover w-full h-full"
                data-ai-hint="gradiente abstrato"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-3xl md:text-4xl font-bold text-white font-headline mb-1">Resultados da Busca</h1>
                <p className="text-md md:text-lg text-gray-200 max-w-xl">Encontre leilões, lotes e ofertas de venda direta.</p>
            </div>
        </div>
      </Card>
      
      <form onSubmit={handleSearchFormSubmit} className="flex flex-col md:flex-row items-center gap-4 mb-6 max-w-3xl mx-auto">
        <div className="relative flex-grow w-full">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Buscar por palavra-chave, ID..."
            className="h-12 pl-12 text-md rounded-lg shadow-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <Button type="submit" className="h-12 w-full md:w-auto">
          <SearchIcon className="mr-2 h-4 w-4 md:hidden" /> Buscar
        </Button>
        <div className="md:hidden w-full">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full h-12">
                <SlidersHorizontal className="mr-2 h-5 w-5" /> Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[85vw] max-w-sm">
                 <div className="p-4 h-full overflow-y-auto">
                    <SidebarFilters
                        categories={allData.allCategoriesForFilter}
                        locations={allData.uniqueLocationsForFilter}
                        sellers={allData.uniqueSellersForFilter}
                        onFilterSubmit={handleFilterSubmit as any}
                        onFilterReset={handleFilterReset}
                        initialFilters={activeFilters as ActiveFilters}
                        filterContext={currentSearchType === 'tomada_de_precos' ? 'auctions' : (currentSearchType  as 'auctions' | 'directSales')}
                    />
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </form>

      <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8">
        <div className="hidden md:block">
             <SidebarFilters
                categories={allData.allCategoriesForFilter}
                locations={allData.uniqueLocationsForFilter}
                sellers={allData.uniqueSellersForFilter}
                onFilterSubmit={handleFilterSubmit as any}
                onFilterReset={handleFilterReset}
                initialFilters={activeFilters as ActiveFilters}
                filterContext={currentSearchType === 'tomada_de_precos' ? 'auctions' : (currentSearchType  as 'auctions' | 'directSales')}
            />
        </div>

        <main className="space-y-6">
            <Tabs value={currentSearchType} onValueChange={(value) => handleSearchTypeChange(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 gap-1 sm:gap-2">
                <TabsTrigger value="auctions">Leilões ({currentSearchType === 'auctions' ? filteredAndSortedItems.length : allData.allAuctions.filter(a=> a.auctionType !== 'TOMADA_DE_PRECOS').length})</TabsTrigger>
                <TabsTrigger value="lots">Lotes ({currentSearchType === 'lots' ? filteredAndSortedItems.length : allData.allLots.length})</TabsTrigger>
                <TabsTrigger value="direct_sale">Venda Direta ({currentSearchType === 'direct_sale' ? filteredAndSortedItems.length : allData.allDirectSales.length})</TabsTrigger>
                <TabsTrigger value="tomada_de_precos">Tomada de Preços ({currentSearchType === 'tomada_de_precos' ? filteredAndSortedItems.length : allData.allAuctions.filter(a => a.auctionType === 'TOMADA_DE_PRECOS').length})</TabsTrigger>
            </TabsList>

            <SearchResultsFrame
              items={paginatedItems}
              totalItemsCount={filteredAndSortedItems.length}
              renderGridItem={renderGridItem}
              renderListItem={renderListItem}
              sortOptions={currentSortOptions}
              initialSortBy={sortByState}
              onSortChange={setSortByState}
              platformSettings={allData.platformSettings}
              isLoading={isLoading}
              searchTypeLabel={getSearchTypeLabel()}
              currentPage={currentPage}
              visibleItemCount={visibleItemCount}
              onPageChange={handlePageChange}
              onLoadMore={handleLoadMore}
            />
            </Tabs>
        </main>
      </div>
    </div>
  );
}

