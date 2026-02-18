
// src/app/search/page.tsx
'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, LayoutGrid, List, SlidersHorizontal, Loader2, Search as SearchIcon, FileText as TomadaPrecosIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import type { ActiveFilters } from '@/components/BidExpertFilter';
import type { Auction, Lot, LotCategory, DirectSaleOffer, DirectSaleOfferType, PlatformSettings, SellerProfileInfo } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import dynamic from 'next/dynamic';
import BidExpertFilterSkeleton from '@/components/BidExpertFilterSkeleton';
import { getLotCategories as getCategories } from '@/app/admin/categories/actions';
import { getDirectSaleOffers } from '@/app/direct-sales/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';


const BidExpertFilter = dynamic(() => import('@/components/BidExpertFilter'), {
  loading: () => <BidExpertFilterSkeleton />,
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
  { value: 'discount_desc', label: '🔥 Maior Deságio (%)' },
  { value: 'discount_asc', label: 'Menor Deságio (%)' },
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
  { value: 'price_desc', label: 'Preço: Maior para Maior (Compra Já)' },
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
  praça: 'todas',
};


function SearchPageContent() {
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
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // State for UI and Filters
  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [currentSearchType, setCurrentSearchType] = useState<'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos'>((searchParamsHook.get('type') as any) || 'auctions');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortByState] = useState<string>('relevance');

  const [activeFilters, setActiveFilters] = useState<ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos' }>(() => {
    const initial: typeof initialFiltersState = { ...initialFiltersState, searchType: 'auctions' };
    const typeParam = searchParamsHook.get('type') as typeof currentSearchType | null;
    const auctionTypeFromQuery = searchParamsHook.get('auctionType');

    let newSearchType: 'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos' = 'auctions'; // Valor padrão
    if (typeParam) {
      if (typeParam === 'auctions' && auctionTypeFromQuery === 'TOMADA_DE_PRECOS') {
        newSearchType = 'tomada_de_precos';
      } else {
        newSearchType = typeParam;
      }
    } else if (auctionTypeFromQuery === 'TOMADA_DE_PRECOS') {
      newSearchType = 'tomada_de_precos';
    }

    if (searchParamsHook.get('category')) initial.category = searchParamsHook.get('category')!;
    if (searchParamsHook.get('offerType')) initial.offerType = searchParamsHook.get('offerType') as any;
    if (searchParamsHook.get('status')) initial.status = [searchParamsHook.get('status')!.toUpperCase()];

    initial.searchType = newSearchType;
    return initial;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isFilterDataLoading, setIsFilterDataLoading] = useState(true);

  // Fetch data on mount with limits to avoid infinite loading (FIX 5.29 CRÍTICO)
  useEffect(() => {
    async function fetchAllData() {
      setIsFilterDataLoading(true);
      setIsLoading(true);
      try {
        // Phase 1: Fetch critical UI data first (filters + settings)
        const [categories, sellers, settings] = await Promise.all([
          getCategories(),
          getSellers(true),
          getPlatformSettings(),
        ]);
        setAllCategoriesForFilter(categories);
        setPlatformSettings(settings as PlatformSettings);
        setUniqueSellersForFilter(sellers.map(s => s.name).sort());
        setIsFilterDataLoading(false);

        // Phase 2: Fetch actual data with limits to prevent timeout
        const [offers, auctions, lots] = await Promise.all([
          getDirectSaleOffers().catch(() => []),
          getAuctions(true, 200).catch(() => []),
          getLots(undefined, true, 200).catch(() => []),
        ]);

        // Set data states
        setAllDirectSales(offers);
        setAllAuctions(auctions);
        setAllLots(lots);

        // Build locations from all data sources
        const locations = new Set<string>();
        offers.forEach(offer => {
          if (offer.locationCity && offer.locationState) locations.add(`${offer.locationCity} - ${offer.locationState}`);
          else if (offer.locationCity) locations.add(offer.locationCity);
          else if (offer.locationState) locations.add(offer.locationState);
        });
        auctions.forEach(item => {
          if ('city' in item && 'state' in item && item.city && item.state) locations.add(`${item.city} - ${item.state}`);
        });
        lots.forEach(item => {
          if (item.cityName && item.stateUf) locations.add(`${item.cityName} - ${item.stateUf}`);
        });
        setUniqueLocationsForFilter(Array.from(locations).sort());

      } catch (error) {
        console.error("Error fetching search data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllData();
  }, []);


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
      setActiveFilters(prev => ({ ...initialFiltersState, searchType: type, category: categoryParam, status: type === 'direct_sale' ? ['ACTIVE'] : [] }));
    }
    router.push(`/search?${currentParams.toString()}`);
  };

  const handleFilterSubmit = (filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; }) => {
    setActiveFilters(prev => ({ ...prev, ...filters, searchType: currentSearchType }));
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
    const resetFilters: typeof initialFiltersState = { ...initialFiltersState, searchType: currentSearchType };
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
    if (currentSearchType === 'tomada_de_precos') currentParams.set('auctionType', 'TOMADA_DE_PRECOS');
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
        if ('id' in item && item.id) searchableText += ` ${String(item.id).toLowerCase()}`;
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

      // Filtro de praças para leilões
      if ((itemTypeContext === 'auction' || itemTypeContext === 'tomada_de_precos') && activeFilters.praça && activeFilters.praça !== 'todas') {
        const stagesCount = (item as Auction).auctionStages?.length || 0;
        if (activeFilters.praça === 'unica' && stagesCount !== 1) return false;
        if (activeFilters.praça === 'multiplas' && stagesCount <= 1) return false;
      }

      return true;
    });

    // 3. Apply sorting
    // Helper: compute discount % for lots (GAP 1.1 - Filtro Deságio)
    const getDiscountPct = (item: any): number => {
      const eval_ = Number(item.evaluationValue || item.marketValue || 0);
      const price = Number(item.initialOffer || item.price || 0);
      if (eval_ > 0 && price > 0 && price < eval_) return ((eval_ - price) / eval_) * 100;
      return 0;
    };

    switch (sortBy) {
      case 'discount_desc':
        filteredItems.sort((a, b) => getDiscountPct(b) - getDiscountPct(a));
        break;
      case 'discount_asc':
        filteredItems.sort((a, b) => getDiscountPct(a) - getDiscountPct(b));
        break;
      case 'id_desc':
        filteredItems.sort((a, b) => String(b.id).localeCompare(String(a.id)));
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
        filteredItems.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
        break;
      case 'lotNumber_asc':
        filteredItems.sort((a, b) => (parseInt(String((a as Lot).number || a.id).replace(/\D/g, '')) || 0) - (parseInt(String((b as Lot).number || b.id).replace(/\D/g, '')) || 0));
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
    if (searchTerm.trim()) {
      currentParams.set('term', searchTerm.trim());
    } else {
      currentParams.delete('term');
    }
    router.push(`/search?${currentParams.toString()}`);
  };

  const renderGridItem = (item: any, index: number): React.ReactNode => {
    if (!platformSettings) return null;
    let itemType: 'auction' | 'lot' | 'direct_sale' = currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos' ? 'auction' : currentSearchType === 'lots' ? 'lot' : currentSearchType;

    return (
      <BidExpertCard
        key={`${itemType}-${item.id}-${index}`}
        item={item}
        type={itemType}
        platformSettings={platformSettings}
        parentAuction={itemType === 'lot' ? allAuctions.find(a => a.id === item.auctionId) : undefined}
      />
    );
  };

  const renderListItem = (item: any, index: number): React.ReactNode => {
    if (!platformSettings) return null;
    let itemType: 'auction' | 'lot' | 'direct_sale' = currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos' ? 'auction' : currentSearchType === 'lots' ? 'lot' : currentSearchType;

    return (
      <BidExpertListItem
        key={`${itemType}-list-${item.id}-${index}`}
        item={item}
        type={itemType as 'auction' | 'lot' | 'direct_sale'}
        platformSettings={platformSettings}
        parentAuction={itemType === 'lot' ? allAuctions.find(a => a.id === item.auctionId) : undefined}
      />
    );
  };

  const getSearchTypeLabel = () => {
    switch (currentSearchType) {
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
      <div className="wrapper-search-loading-full" data-ai-id="search-page-loading">
        <Loader2 className="icon-search-loading-spinner-large" />
      </div>
    );
  }

  return (
    <div className="container-search-page" data-ai-id="search-page-main">
      <Card className="card-search-header" data-ai-id="search-page-header-card">
        <div className="wrapper-search-title-section" data-ai-id="search-page-title-wrapper">
          <h1 className="header-search-page-title" data-ai-id="search-page-title">Busca Avançada</h1>
          <p className="text-search-page-subtitle" data-ai-id="search-page-subtitle">
            Encontre leilões, lotes e ofertas de venda direta.
          </p>
        </div>
        <form onSubmit={handleSearchFormSubmit} className="form-search-advanced" data-ai-id="search-page-form">
          <div className="wrapper-search-input-with-icon" data-ai-id="search-page-input-wrapper">
            <SearchIcon className="icon-search-input-prefix" />
            <Input
              type="search"
              placeholder="O que você está procurando?"
              className="input-search-advanced"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-ai-id="search-page-input"
            />
          </div>
          <Button type="submit" className="btn-search-submit-advanced" data-ai-id="search-page-submit">
            <SearchIcon className="icon-search-btn-mobile" /> Buscar
          </Button>
        </form>
      </Card>

      <Tabs value={currentSearchType} onValueChange={(value) => handleSearchTypeChange(value as any)} className="wrapper-search-tabs" data-ai-id="search-page-tabs">
        <TabsList className="list-search-tabs" data-ai-id="search-page-tabs-list">
          <TabsTrigger value="auctions" className="trigger-search-tab" data-ai-id="tab-auctions">Leilões ({allAuctions.filter(a => a.auctionType !== 'TOMADA_DE_PRECOS').length})</TabsTrigger>
          <TabsTrigger value="lots" className="trigger-search-tab" data-ai-id="tab-lots">Lotes ({allLots.length})</TabsTrigger>
          <TabsTrigger value="direct_sale" className="trigger-search-tab" data-ai-id="tab-direct-sale">Venda Direta ({allDirectSales.length})</TabsTrigger>
          <TabsTrigger value="tomada_de_precos" className="trigger-search-tab" data-ai-id="tab-tomada-precos">Tomada de Preços ({allAuctions.filter(a => a.auctionType === 'TOMADA_DE_PRECOS').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid-search-layout" data-ai-id="search-page-layout">
        <aside className="wrapper-search-sidebar" data-ai-id="search-page-sidebar">
          <BidExpertFilter
            categories={allCategoriesForFilter}
            locations={uniqueLocationsForFilter}
            sellers={uniqueSellersForFilter}
            onFilterSubmit={handleFilterSubmit as any}
            onFilterReset={handleFilterReset}
            initialFilters={activeFilters as ActiveFilters}
            filterContext={currentSearchType as 'auctions' | 'directSales' | 'lots' | 'tomada_de_precos'}
          />
        </aside>

        <main className="wrapper-search-results-main" data-ai-id="search-page-results">
          <BidExpertSearchResultsFrame
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
          />
        </main>
      </div>
    </div>
  );
}

function SearchPageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}
