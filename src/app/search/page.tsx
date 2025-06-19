
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, LayoutGrid, List, SlidersHorizontal, Loader2, Search as SearchIcon, FileText as TomadaPrecosIcon } from 'lucide-react'; // Adicionado SearchIcon
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
import DirectSaleOfferListItem from '@/components/direct-sale-offer-list-item'; // Novo import
import type { Auction, Lot, LotCategory, DirectSaleOffer, DirectSaleOfferType } from '@/types';
import { 
    sampleAuctions,
    sampleLots,
    sampleDirectSaleOffers,
    getUniqueLotLocations, 
    getUniqueSellerNames, 
    slugify,
    sampleLotCategories 
} from '@/lib/sample-data';
import { getLotCategories } from '@/app/admin/categories/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuctionListItem from '@/components/auction-list-item'; 

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

  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [currentSearchType, setCurrentSearchType] = useState<'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos'>( (searchParamsHook.get('type') as any) || 'auctions');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortByState, setSortByState] = useState<string>('relevance'); 
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); 

  const [allCategoriesForFilter, setAllCategoriesForFilter] = useState<LotCategory[]>([]);
  const [uniqueLocationsForFilter, setUniqueLocationsForFilter] = useState<string[]>([]);
  const [uniqueSellersForFilter, setUniqueSellersForFilter] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const allLotsWithAuctionData = useMemo(() => {
    return sampleLots.map(lot => {
      const parentAuction = sampleAuctions.find(auc => auc.id === lot.auctionId);
      return {
        ...lot,
        auctionName: parentAuction?.title || lot.auctionName || "Leilão Desconhecido",
        auctionStatus: parentAuction?.status || lot.status,
        auctionEndDate: parentAuction?.endDate || lot.endDate,
        sellerName: lot.sellerName || parentAuction?.seller,
      };
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setAllCategoriesForFilter(JSON.parse(JSON.stringify(sampleLotCategories)));
    setUniqueLocationsForFilter(getUniqueLotLocations());
    setUniqueSellersForFilter(getUniqueSellerNames());
    setIsLoading(false);
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

    let newSearchType: typeof currentSearchType = 'auctions'; // Default
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

  const applySharedFilters = <T extends Auction | Lot | DirectSaleOffer>(
    items: T[],
    filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' | 'tomada_de_precos' },
    itemTypeContext: 'auction' | 'lot' | 'direct_sale' 
  ): T[] => {
    return items.filter(item => {
        // Search Term
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

        // Category
        if (filters.category !== 'TODAS') {
            const itemCategoryName = 'type' in item && item.type ? item.type : ('category' in item ? item.category : undefined);
            if (!itemCategoryName || slugify(itemCategoryName) !== filters.category) return false;
        }
        
        // Price Range
        const itemPrice = 'price' in item && typeof item.price === 'number' ? item.price : ('initialOffer' in item && typeof item.initialOffer === 'number' ? item.initialOffer : undefined);
        if (itemPrice !== undefined && (itemPrice < filters.priceRange[0] || itemPrice > filters.priceRange[1])) {
            return false;
        }

        // Location
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
        
        // Seller
        if (filters.sellers.length > 0) {
            let sellerName: string | undefined = undefined;
            if ('sellerName' in item && item.sellerName) sellerName = item.sellerName;
            else if ('seller' in item && (item as Auction).seller) sellerName = (item as Auction).seller!;
            else if ('auctioneer' in item && (item as Auction).auctioneer) sellerName = (item as Auction).auctioneer!; 
            if (!sellerName || !filters.sellers.includes(sellerName)) return false;
        }
        
        // Status
        if (filters.status && filters.status.length > 0) {
          if (!item.status || !filters.status.includes(item.status as string)) return false;
        }

        // Modality (for auctions and tomada_de_precos)
        if (itemTypeContext === 'auction' && filters.modality !== 'TODAS') {
          const auctionItem = item as Auction;
          if (!auctionItem.auctionType || auctionItem.auctionType.toUpperCase() !== filters.modality) return false;
        }
        
        // Offer Type (for direct_sale)
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
      items = sampleAuctions.filter(auc => auc.auctionType !== 'TOMADA_DE_PRECOS'); 
      itemTypeForFiltering = 'auction';
    } else if (currentSearchType === 'lots') {
      items = allLotsWithAuctionData;
      itemTypeForFiltering = 'lot';
    } else if (currentSearchType === 'direct_sale') {
      items = sampleDirectSaleOffers;
      itemTypeForFiltering = 'direct_sale';
    } else if (currentSearchType === 'tomada_de_precos') {
      items = sampleAuctions.filter(auc => auc.auctionType === 'TOMADA_DE_PRECOS');
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
        case 'createdAt_desc': // For DirectSaleOffers
            filtered.sort((a,b) => new Date((b as DirectSaleOffer).createdAt).getTime() - new Date((a as DirectSaleOffer).createdAt).getTime());
            break;
        case 'createdAt_asc': // For DirectSaleOffers
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
  }, [searchTerm, activeFilters, sortByState, currentSearchType, allLotsWithAuctionData]);

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
  };
  
  const tabValueForURL = currentSearchType === 'tomada_de_precos' ? 'auctions' : currentSearchType;

  if (isLoading) {
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
                <TabsTrigger value="auctions">Leilões ({currentSearchType === 'auctions' && activeFilters.modality !== 'TOMADA_DE_PRECOS' ? filteredAndSortedItems.length : sampleAuctions.filter(auc => auc.auctionType !== 'TOMADA_DE_PRECOS').length})</TabsTrigger>
                <TabsTrigger value="lots">Lotes ({currentSearchType === 'lots' ? filteredAndSortedItems.length : allLotsWithAuctionData.length})</TabsTrigger>
                <TabsTrigger value="direct_sale">Venda Direta ({currentSearchType === 'direct_sale' ? filteredAndSortedItems.length : sampleDirectSaleOffers.length})</TabsTrigger>
                <TabsTrigger value="tomada_de_precos">Tomada de Preços ({currentSearchType === 'tomada_de_precos' ? filteredAndSortedItems.length : sampleAuctions.filter(auc => auc.auctionType === 'TOMADA_DE_PRECOS').length})</TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 p-4 bg-card border rounded-lg shadow-sm">
                <p className="text-sm text-muted-foreground">
                    Mostrando {filteredAndSortedItems.length} item(ns)
                    {searchTerm && ` contendo "${searchTerm}"`}
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={sortByState} onValueChange={setSortByState}>
                        <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                            <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                        {currentSortOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    {(currentSearchType === 'lots' || currentSearchType === 'direct_sale' || currentSearchType === 'auctions' || currentSearchType === 'tomada_de_precos') && (
                         <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Ver:</span>
                            <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}
                            aria-label="Visualização em Grade"
                            >
                            <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}
                            aria-label="Visualização em Lista"
                            >
                            <List className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <TabsContent value="auctions">
                {filteredAndSortedItems.length > 0 && currentSearchType === 'auctions' ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                        {(filteredAndSortedItems as Auction[]).map((auction) => (
                           viewMode === 'grid'
                            ? <AuctionCard key={auction.id} auction={auction} />
                            : <AuctionListItem key={auction.id} auction={auction} /> 
                        ))}
                    </div>
                ) : currentSearchType === 'auctions' && (
                    <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Nenhum Leilão Encontrado</h2>
                    <p className="text-muted-foreground mb-4">Tente ajustar seus termos de busca ou filtros.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="lots">
                {filteredAndSortedItems.length > 0 && currentSearchType === 'lots' ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {(filteredAndSortedItems as Lot[]).map((lot) => (
                        viewMode === 'grid'
                        ? <LotCard key={`${lot.auctionId}-${lot.id}`} lot={lot} />
                        : <LotListItem key={`${lot.auctionId}-${lot.id}`} lot={lot} />
                    ))}
                </div>
                ) : currentSearchType === 'lots' && (
                 <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Nenhum Lote Encontrado</h2>
                    <p className="text-muted-foreground mb-4">Tente ajustar seus termos de busca ou filtros.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="direct_sale">
                {filteredAndSortedItems.length > 0 && currentSearchType === 'direct_sale' ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {(filteredAndSortedItems as DirectSaleOffer[]).map((offer) => (
                         viewMode === 'grid'
                         ? <DirectSaleOfferCard key={offer.id} offer={offer} />
                         : <DirectSaleOfferListItem key={offer.id} offer={offer} /> 
                    ))}
                </div>
                ) : currentSearchType === 'direct_sale' && (
                 <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Nenhuma Oferta de Venda Direta Encontrada</h2>
                    <p className="text-muted-foreground mb-4">Tente ajustar seus termos de busca ou filtros.</p>
                    </div>
                )}
            </TabsContent>
            
            <TabsContent value="tomada_de_precos">
                {filteredAndSortedItems.length > 0 && currentSearchType === 'tomada_de_precos' ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                        {(filteredAndSortedItems as Auction[]).map((auction) => (
                             viewMode === 'grid'
                             ? <AuctionCard key={auction.id} auction={auction} />
                             : <AuctionListItem key={auction.id} auction={auction} />
                        ))}
                    </div>
                ) : currentSearchType === 'tomada_de_precos' && (
                    <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Nenhuma Tomada de Preços Encontrada</h2>
                    <p className="text-muted-foreground mb-4">Tente ajustar seus termos de busca ou filtros.</p>
                    </div>
                )}
            </TabsContent>

            </Tabs>
             {/* Placeholder for Pagination */}
            <div className="flex justify-center mt-8">
                <Button variant="outline" disabled>Carregar Mais (Paginação Pendente)</Button>
            </div>
        </main>
      </div>
    </div>
  );
}


