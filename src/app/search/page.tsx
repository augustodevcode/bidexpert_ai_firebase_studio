
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, LayoutGrid, List, SlidersHorizontal, Loader2, Search as SearchIcon } from 'lucide-react';
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
import { useRouter, useSearchParams } from 'next/navigation';
// Removido: import Breadcrumbs from '@/components/ui/breadcrumbs';

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


const initialFiltersState: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' } = {
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
  const [currentSearchType, setCurrentSearchType] = useState<'auctions' | 'lots' | 'direct_sale'>( (searchParamsHook.get('type') as any) || 'auctions');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortByAuctions, setSortByAuctions] = useState<string>('relevance');
  const [sortByLots, setSortByLots] = useState<string>('relevance');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [activeFilters, setActiveFilters] = useState<ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' }>(() => {
    const initial: typeof initialFiltersState = {...initialFiltersState};
    if (searchParamsHook.get('type')) initial.searchType = searchParamsHook.get('type') as any;
    if (searchParamsHook.get('category')) initial.category = searchParamsHook.get('category')!;
    if (searchParamsHook.get('auctionType')) initial.modality = searchParamsHook.get('auctionType')!.toUpperCase();
    if (searchParamsHook.get('status')) initial.status = [searchParamsHook.get('status')!.toUpperCase()];
    if (searchParamsHook.get('offerType')) initial.offerType = searchParamsHook.get('offerType') as any;
    return initial;
  });
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

  const handleSearchTypeChange = (type: 'auctions' | 'lots' | 'direct_sale') => {
    setCurrentSearchType(type);
    // Reset sort when changing type
    if (type === 'auctions') setSortByAuctions('relevance');
    else if (type === 'lots') setSortByLots('relevance');
    else setSortBy('relevance');
    
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('type', type);
    currentParams.delete('category'); // Reset category when type changes
    router.push(`/search?${currentParams.toString()}`);
  };
  
  const handleFilterSubmit = (filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; }) => {
    setActiveFilters(prev => ({...prev, ...filters, searchType: currentSearchType}));
    setIsFilterSheetOpen(false);
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('category', filters.category);
    if (filters.modality && currentSearchType === 'auctions') currentParams.set('auctionType', filters.modality); else currentParams.delete('auctionType');
    if (filters.offerType && currentSearchType === 'direct_sale') currentParams.set('offerType', filters.offerType); else currentParams.delete('offerType');
    if (filters.status && filters.status.length > 0) currentParams.set('status', filters.status.join(',')); else currentParams.delete('status');
    // Add other filters to params as needed
    router.push(`/search?${currentParams.toString()}`);
  };

  const handleFilterReset = () => {
    const resetFilters: typeof initialFiltersState = {...initialFiltersState, searchType: currentSearchType};
    setActiveFilters(resetFilters);
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.delete('category');
    currentParams.delete('auctionType');
    currentParams.delete('offerType');
    currentParams.delete('status');
    router.push(`/search?${currentParams.toString()}`);
    setIsFilterSheetOpen(false);
  };

  const applySharedFilters = <T extends Auction | Lot | DirectSaleOffer>(
    items: T[],
    filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' },
    itemType: 'auction' | 'lot' | 'direct_sale'
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

        if (itemType === 'auctions' && filters.modality !== 'TODAS') {
          const auctionItem = item as Auction;
          if (!auctionItem.auctionType || auctionItem.auctionType.toUpperCase() !== filters.modality) return false;
        }
        
        if (itemType === 'direct_sale' && filters.offerType && filters.offerType !== 'ALL') {
          const directSaleItem = item as DirectSaleOffer;
          if (directSaleItem.offerType !== filters.offerType) return false;
        }
      
      return true;
    });
  };

  const filteredAndSortedItems = useMemo(() => {
    let items: any[] = [];
    let currentSortByVal = 'relevance';
    let itemType: 'auction' | 'lot' | 'direct_sale' = 'auctions';

    if (currentSearchType === 'auctions') {
      items = sampleAuctions;
      currentSortByVal = sortByAuctions;
      itemType = 'auction';
    } else if (currentSearchType === 'lots') {
      items = allLotsWithAuctionData;
      currentSortByVal = sortByLots;
      itemType = 'lot';
    } else if (currentSearchType === 'direct_sale') {
      items = sampleDirectSaleOffers;
      currentSortByVal = sortBy;
      itemType = 'direct_sale';
    }
    
    let filtered = applySharedFilters(items, activeFilters, itemType);

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
  }, [searchTerm, activeFilters, sortByAuctions, sortByLots, sortBy, currentSearchType, allLotsWithAuctionData]);

  const currentSortOptions = currentSearchType === 'auctions' ? sortOptionsAuctions :
                             currentSearchType === 'lots' ? sortOptionsLots :
                             sortOptionsDirectSales;
  
  const currentSortByState = currentSearchType === 'auctions' ? sortByAuctions :
                            currentSearchType === 'lots' ? sortByLots :
                            sortBy;
  
  const setCurrentSortByState = currentSearchType === 'auctions' ? setSortByAuctions :
                                currentSearchType === 'lots' ? setSortByLots :
                                setSortBy;

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
      {/* Breadcrumbs são movidos para o Header */}
      
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col md:flex-row items-center gap-4 mb-6 max-w-3xl mx-auto">
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
                        filterContext={currentSearchType as 'auctions' | 'directSales'}
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
                filterContext={currentSearchType as 'auctions' | 'directSales'}
            />
        </div>
        
        <main className="space-y-6">
            <Tabs value={currentSearchType} onValueChange={(value) => handleSearchTypeChange(value as 'auctions' | 'lots' | 'direct_sale')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="auctions">Leilões ({currentSearchType === 'auctions' ? filteredAndSortedItems.length : sampleAuctions.length})</TabsTrigger>
                <TabsTrigger value="lots">Lotes ({currentSearchType === 'lots' ? filteredAndSortedItems.length : allLotsWithAuctionData.length})</TabsTrigger>
                <TabsTrigger value="direct_sale">Venda Direta ({currentSearchType === 'direct_sale' ? filteredAndSortedItems.length : sampleDirectSaleOffers.length})</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 p-4 bg-card border rounded-lg shadow-sm">
                <p className="text-sm text-muted-foreground">
                    Mostrando {filteredAndSortedItems.length} item(ns)
                    {searchTerm && ` contendo "${searchTerm}"`}
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={currentSortByState} onValueChange={setCurrentSortByState}>
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
                    {(currentSearchType === 'lots' || currentSearchType === 'direct_sale') && (
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
                {filteredAndSortedItems.length > 0 ? (
                    <div className={`grid gap-6 ${viewMode === 'grid' || currentSearchType === 'auctions' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                        {(filteredAndSortedItems as Auction[]).map((auction) => (
                            <AuctionCard key={auction.id} auction={auction} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Nenhum Leilão Encontrado</h2>
                    <p className="text-muted-foreground mb-4">Tente ajustar seus termos de busca ou filtros.</p>
                    </div>
                )}
            </TabsContent>
            
            <TabsContent value="lots">
                {filteredAndSortedItems.length > 0 ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {(filteredAndSortedItems as Lot[]).map((lot) => (
                        viewMode === 'grid' 
                        ? <LotCard key={`${lot.auctionId}-${lot.id}`} lot={lot} />
                        : <LotListItem key={`${lot.auctionId}-${lot.id}`} lot={lot} />
                    ))}
                </div>
                ) : (
                 <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Nenhum Lote Encontrado</h2>
                    <p className="text-muted-foreground mb-4">Tente ajustar seus termos de busca ou filtros.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="direct_sale">
                {filteredAndSortedItems.length > 0 ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {(filteredAndSortedItems as DirectSaleOffer[]).map((offer) => (
                        <DirectSaleOfferCard key={offer.id} offer={offer} />
                    ))}
                </div>
                ) : (
                 <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Nenhuma Oferta de Venda Direta Encontrada</h2>
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

```
  </change>
  <change>
    <file>/home/user/studio/src/app/auctions/[auctionId]/page.tsx</file>
    <content><![CDATA[
import Image from 'next/image';
import Link from 'next/link';
import { sampleAuctions, sampleLots } from '@/lib/sample-data'; // Usar sampleData
import type { Auction, Lot } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AuctionDetailsClient from './auction-details-client'; // Renomeado para AuctionDetailsClient
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// Removido: import Breadcrumbs from '@/components/ui/breadcrumbs';

async function getAuctionData(id: string): Promise<Auction | undefined> {
  console.log(`[getAuctionData - SampleData Mode] Chamada com ID: ${id}`);
  if (!id) {
    console.warn('[getAuctionData - SampleData Mode] ID do leilão não fornecido ou undefined.');
    return undefined;
  }
  
  const auctionFromSample = sampleAuctions.find(a => a.id === id || a.publicId === id); // Adicionado busca por publicId
  if (!auctionFromSample) {
    console.warn(`[getAuctionData - SampleData Mode] Nenhum leilão encontrado para o ID/PublicID: ${id} em sampleAuctions.`);
    return undefined;
  }

  const auction = { ...auctionFromSample };
  const lotsForAuction = sampleLots.filter(lot => lot.auctionId === auction.id || lot.auctionId === auction.publicId);
  auction.lots = lotsForAuction; 
  auction.totalLots = lotsForAuction.length; 

  console.log(`[getAuctionData - SampleData Mode] Leilão ID ${id} encontrado. Total de lotes: ${lotsForAuction.length}`);
  
  return auction; 
}

export default async function AuctionDetailPage({ params }: { params: { auctionId: string } }) { // Renomeado para AuctionDetailPage
  const auctionIdParam = params.auctionId; 

  if (!auctionIdParam) {
    console.error("[AuctionDetailPage] auctionId está undefined nos params.");
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Erro ao Carregar Leilão</h1>
        <p className="text-muted-foreground">Não foi possível identificar o leilão a ser exibido.</p>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }
  
  const auction = await getAuctionData(auctionIdParam);

  if (!auction) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Leilão Não Encontrado</h1>
        <p className="text-muted-foreground">O leilão que você está procurando (ID: {auctionIdParam}) não existe ou não pôde ser carregado (usando sampleData).</p>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-2 sm:py-8"> 
        {/* Breadcrumbs agora está no Header */}
        <AuctionDetailsClient auction={auction} />
    </div>
  );
}

export async function generateStaticParams() {
  return sampleAuctions.map((auction) => ({
    auctionId: auction.publicId || auction.id, // Prioriza publicId se existir
  }));
}

