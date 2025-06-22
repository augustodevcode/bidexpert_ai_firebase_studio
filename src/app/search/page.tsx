

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, LayoutGrid, List, SlidersHorizontal, Loader2, Search as SearchIcon, FileText as TomadaPrecosIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import SidebarFilters, { type ActiveFilters } from '@/components/sidebar-filters';
import AuctionCard from '@/components/auction-card';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import DirectSaleOfferCard from '@/components/direct-sale-offer-card';
import DirectSaleOfferListItem from '@/components/direct-sale-offer-list-item';
import type { Auction, Lot, LotCategory, DirectSaleOffer, DirectSaleOfferType, PlatformSettings } from '@/types';
import { slugify } from '@/lib/sample-data';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuctionListItem from '@/components/auction-list-item';
import SearchResultsFrame from '@/components/search-results-frame';

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
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [allLots, setAllLots] = useState<Lot[]>([]);
  const [allDirectSales, setAllDirectSales] = useState<DirectSaleOffer[]>([]);
  const [allLotsWithAuctionData, setAllLotsWithAuctionData] = useState<Lot[]>([]);


  // State for UI and Filters
  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [currentSearchType, setCurrentSearchType] = useState<'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos'>( (searchParamsHook.get('type') as any) || 'auctions');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortByState, setSortByState] = useState<string>('relevance');
  
  const [allCategoriesForFilter, setAllCategoriesForFilter] = useState<LotCategory[]>([]);
  const [uniqueLocationsForFilter, setUniqueLocationsForFilter] = useState<string[]>([]);
  const [uniqueSellersForFilter, setUniqueSellersForFilter] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  const {
    searchPaginationType = 'loadMore',
    searchItemsPerPage = 12,
    searchLoadMoreCount = 12
  } = platformSettings || {};

  const [currentPage, setCurrentPage] = useState(1);
  const [visibleItemCount, setVisibleItemCount] = useState(searchLoadMoreCount);


  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [
                settings,
                categories,
                auctions,
                lots,
                // directSales, // Add this when you have an action for it
                sellers
            ] = await Promise.all([
                getPlatformSettings(),
                getLotCategories(),
                getAuctions(),
                getLots(),
                // getDirectSales(), 
                getSellers()
            ]);

            setPlatformSettings(settings);
            setAllCategoriesForFilter(categories);
            setAllAuctions(auctions);
            setAllLots(lots);
            // setAllDirectSales(directSales);

            const locations = new Set<string>();
            [...auctions, ...lots].forEach(item => {
                if (item.city && item.stateUf) locations.add(`${item.city} - ${item.stateUf}`);
                else if (item.city) locations.add(item.city);
                else if (item.stateUf) locations.add(item.stateUf);
            });
            setUniqueLocationsForFilter(Array.from(locations).sort());

            const sellerNames = new Set(sellers.map(s => s.name));
            setUniqueSellersForFilter(Array.from(sellerNames).sort());

             const enrichedLots = lots.map(lot => {
                const parentAuction = auctions.find(auc => auc.id === lot.auctionId);
                return {
                    ...lot,
                    auctionName: parentAuction?.title || lot.auctionName || "Leilão Desconhecido",
                    auctionStatus: parentAuction?.status || lot.status,
                    auctionEndDate: parentAuction?.endDate || lot.endDate,
                    sellerName: lot.sellerName || parentAuction?.seller,
                };
            });
            setAllLotsWithAuctionData(enrichedLots);


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

  const applySharedFilters = <T extends Auction | Lot | DirectSaleOffer>(
    items: T[],
    filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos' },
    itemTypeContext: 'auction' | 'lot' | 'direct_sale'
  ): T[] => {
    return items.filter(item => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            let searchableText = item.title.toLowerCase();
            if (item.description) searchableText += ` ${item.description.toLowerCase()}`;
            if ('auctionName' in item && item.auctionName) searchableText += ` ${item.auctionName.toLowerCase()}`;
            if ('sellerName' in item && item.sellerName) searchableText += ` ${item.sellerName.toLowerCase()}`;
            else if ('seller' in item && (item as Auction).seller) searchableText += ` ${(item as Auction).seller!.toLowerCase()}`;
            if ('id' in item && item.id) searchableText += ` ${item.id.toLowerCase()}`;
            if (!searchableText.includes(term)) return false;
        }

        if (filters.category !== 'TODAS') {
            const itemCategoryName = 'type' in item && item.type ? item.type : ('category' in item ? item.category : undefined);
            if (!itemCategoryName || slugify(itemCategoryName) !== filters.category) return false;
        }

        const itemPrice = 'price' in item && typeof item.price === 'number' ? item.price : ('initialOffer' in item && typeof item.initialOffer === 'number' ? item.initialOffer : undefined);
        if (itemPrice !== undefined && (itemPrice < filters.priceRange[0] || itemPrice > filters.priceRange[1])) {
            return false;
        }

        if (filters.locations.length > 0) {
            const itemLocationString =
                'locationCity' in item && 'locationState' in item && item.locationCity && item.locationState ? `${item.locationCity} - ${item.locationState}` :
                ('locationCity' in item && item.locationCity) ? item.locationCity :
                ('locationState' in item && item.locationState) ? item.locationState :
                ('city' in item && 'state' in item && item.city && item.state) ? `${item.city} - ${item.state}` :
                ('city' in item && item.city) ? item.city :
                ('state' in item && item.state) ? item.state :
                ('cityName' in item && 'stateUf' in item && item.cityName && item.stateUf) ? `${item.cityName} - ${item.stateUf}` :
                ('stateUf' in item && item.stateUf) ? item.stateUf :
                ('cityName' in item && item.cityName) ? item.cityName : undefined;
            if (!itemLocationString || !filters.locations.includes(itemLocationString)) return false;
        }

        if (filters.sellers.length > 0) {
            let sellerName: string | undefined = undefined;
            if ('sellerName' in item && item.sellerName) sellerName = item.sellerName;
            else if ('seller' in item && (item as Auction).seller) sellerName = (item as Auction).seller!;
            else if ('auctioneer' in item && (item as Auction).auctioneer) sellerName = (item as Auction).auctioneer!;
            if (!sellerName || !filters.sellers.includes(sellerName)) return false;
        }

        if (filters.status && filters.status.length > 0) {
          if (!item.status || !filters.status.includes(item.status as string)) return false;
        }

        if (itemTypeContext === 'auction' && filters.modality !== 'TODAS') {
          const auctionItem = item as Auction;
          if (!auctionItem.auctionType || auctionItem.auctionType.toUpperCase() !== filters.modality) return false;
        }

        if (itemTypeContext === 'direct_sale' && filters.offerType && filters.offerType !== 'ALL') {
          const directSaleItem = item as DirectSaleOffer;
          if (directSaleItem.offerType !== filters.offerType) return false;
        }

      return true;
    });
  };

  const filteredAndSortedItems = useMemo(() => {
    let items: any[] = [];
    let itemTypeForFiltering: 'auction' | 'lot' | 'direct_sale' = 'auction';
    let currentSortByVal = sortByState;

    if (currentSearchType === 'auctions') {
      items = allAuctions.filter(auc => auc.auctionType !== 'TOMADA_DE_PRECOS');
      itemTypeForFiltering = 'auction';
    } else if (currentSearchType === 'lots') {
      items = allLotsWithAuctionData;
      itemTypeForFiltering = 'lot';
    } else if (currentSearchType === 'direct_sale') {
      items = allDirectSales;
      itemTypeForFiltering = 'direct_sale';
    } else if (currentSearchType === 'tomada_de_precos') {
      items = allAuctions.filter(auc => auc.auctionType === 'TOMADA_DE_PRECOS');
      itemTypeForFiltering = 'auction';
    }

    let filtered = applySharedFilters(items, activeFilters, itemTypeForFiltering);

    switch (currentSortByVal) {
        case 'id_asc':
            filtered.sort((a,b) => (parseInt(String(a.id).replace(/\D/g,'')) || 0) - (parseInt(String(b.id).replace(/\D/g,'')) || 0));
            break;
        case 'id_desc':
            filtered.sort((a,b) => (parseInt(String(b.id).replace(/\D/g,'')) || 0) - (parseInt(String(a.id).replace(/\D/g,'')) || 0));
            break;
        case 'endDate_asc':
            filtered.sort((a, b) => {
                const dateA = (a as Auction | Lot).endDate || ((a as Auction).auctionStages && (a as Auction).auctionStages!.length > 0 ? (a as Auction).auctionStages![(a as Auction).auctionStages!.length-1].endDate : (a as Auction).auctionDate);
                const dateB = (b as Auction | Lot).endDate || ((b as Auction).auctionStages && (b as Auction).auctionStages!.length > 0 ? (b as Auction).auctionStages![(b as Auction).auctionStages!.length-1].endDate : (b as Auction).auctionDate);
                return new Date(dateA).getTime() - new Date(dateB).getTime();
            });
            break;
        case 'endDate_desc':
            filtered.sort((a, b) => {
                const dateA = (a as Auction | Lot).endDate || ((a as Auction).auctionStages && (a as Auction).auctionStages!.length > 0 ? (a as Auction).auctionStages![(a as Auction).auctionStages!.length-1].endDate : (a as Auction).auctionDate);
                const dateB = (b as Auction | Lot).endDate || ((b as Auction).auctionStages && (b as Auction).auctionStages!.length > 0 ? (b as Auction).auctionStages![(b as Auction).auctionStages!.length-1].endDate : (b as Auction).auctionDate);
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
            break;
        case 'price_asc':
             filtered.sort((a, b) => ((a as Lot | DirectSaleOffer).price ?? Infinity) - ((b as Lot | DirectSaleOffer).price ?? Infinity));
            break;
        case 'price_desc':
            filtered.sort((a, b) => ((b as Lot | DirectSaleOffer).price ?? -Infinity) - ((a as Lot | DirectSaleOffer).price ?? -Infinity));
            break;
        case 'views_desc':
            filtered.sort((a, b) => ((b as any).views || 0) - ((a as any).views || 0));
            break;
        case 'createdAt_desc':
            filtered.sort((a,b) => new Date((b as DirectSaleOffer).createdAt).getTime() - new Date((a as DirectSaleOffer).createdAt).getTime());
            break;
        case 'createdAt_asc':
            filtered.sort((a,b) => new Date((a as DirectSaleOffer).createdAt).getTime() - new Date((b as DirectSaleOffer).createdAt).getTime());
            break;
        case 'lotNumber_asc':
            filtered.sort((a,b) => (parseInt(String((a as Lot).number || a.id).replace(/\D/g,'')) || 0) - (parseInt(String((b as Lot).number || b.id).replace(/\D/g,'')) || 0));
            break;
        case 'lotNumber_desc':
            filtered.sort((a,b) => (parseInt(String((b as Lot).number || b.id).replace(/\D/g,'')) || 0) - (parseInt(String((a as Lot).number || a.id).replace(/\D/g,'')) || 0));
            break;
        case 'relevance':
        default:
            break;
    }
    return filtered;
  }, [searchTerm, activeFilters, sortByState, currentSearchType, allAuctions, allLotsWithAuctionData, allDirectSales]);

  const paginatedItems = useMemo(() => {
    if (searchPaginationType === 'numberedPages') {
      const startIndex = (currentPage - 1) * searchItemsPerPage;
      const endIndex = startIndex + searchItemsPerPage;
      return filteredAndSortedItems.slice(startIndex, endIndex);
    } else { 
      return filteredAndSortedItems.slice(0, visibleItemCount);
    }
  }, [filteredAndSortedItems, searchPaginationType, currentPage, searchItemsPerPage, visibleItemCount]);


  const handleLoadMore = () => {
    setVisibleItemCount(prev => Math.min(prev + searchLoadMoreCount, filteredAndSortedItems.length));
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = searchPaginationType === 'numberedPages' && searchItemsPerPage > 0
      ? Math.ceil(filteredAndSortedItems.length / searchItemsPerPage)
      : 1;
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
    if (!platformSettings) return null;
    if (currentSearchType === 'lots') return <LotCard key={`${(item as Lot).auctionId}-${item.id}-${index}`} lot={item as Lot} platformSettings={platformSettings}/>;
    if (currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos') return <AuctionCard key={`${item.id}-${index}`} auction={item as Auction} />;
    if (currentSearchType === 'direct_sale') return <DirectSaleOfferCard key={`${item.id}-${index}`} offer={item as DirectSaleOffer} />;
    return null;
  };

  const renderListItem = (item: any, index: number): React.ReactNode => {
    if (!platformSettings) return null;
    if (currentSearchType === 'lots') return <LotListItem key={`${(item as Lot).auctionId}-${item.id}-${index}`} lot={item as Lot} platformSettings={platformSettings}/>;
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

  if (isLoading || !platformSettings) {
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

      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <SearchIcon className="h-12 w-12 mx-auto text-primary mb-3" />
          <h1 className="text-3xl font-bold font-headline">Resultados da Busca</h1>
          <p className="text-muted-foreground mt-2">
            Encontre leilões, lotes e ofertas de venda direta.
          </p>
        </CardContent>
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
                        categories={allCategoriesForFilter}
                        locations={uniqueLocationsForFilter}
                        sellers={uniqueSellersForFilter}
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
                categories={allCategoriesForFilter}
                locations={uniqueLocationsForFilter}
                sellers={uniqueSellersForFilter}
                onFilterSubmit={handleFilterSubmit as any}
                onFilterReset={handleFilterReset}
                initialFilters={activeFilters as ActiveFilters}
                filterContext={currentSearchType === 'tomada_de_precos' ? 'auctions' : (currentSearchType  as 'auctions' | 'directSales')}
            />
        </div>

        <main className="space-y-6">
            <Tabs value={currentSearchType} onValueChange={(value) => handleSearchTypeChange(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 gap-1 sm:gap-2">
                <TabsTrigger value="auctions">Leilões ({currentSearchType === 'auctions' ? filteredAndSortedItems.length : allAuctions.filter(a=> a.auctionType !== 'TOMADA_DE_PRECOS').length})</TabsTrigger>
                <TabsTrigger value="lots">Lotes ({currentSearchType === 'lots' ? filteredAndSortedItems.length : allLots.length})</TabsTrigger>
                <TabsTrigger value="direct_sale">Venda Direta ({currentSearchType === 'direct_sale' ? filteredAndSortedItems.length : allDirectSales.length})</TabsTrigger>
                <TabsTrigger value="tomada_de_precos">Tomada de Preços ({currentSearchType === 'tomada_de_precos' ? filteredAndSortedItems.length : allAuctions.filter(a => a.auctionType === 'TOMADA_DE_PRECOS').length})</TabsTrigger>
            </TabsList>

            <SearchResultsFrame
              items={paginatedItems}
              totalItemsCount={filteredAndSortedItems.length}
              renderGridItem={renderGridItem}
              renderListItem={renderListItem}
              sortOptions={currentSortOptions}
              initialSortBy={sortByState}
              onSortChange={setSortByState}
              platformSettings={platformSettings}
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

