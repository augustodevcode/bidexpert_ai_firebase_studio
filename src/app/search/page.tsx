
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
    sampleLotCategories // Import sampleLotCategories
} from '@/lib/sample-data';
// No longer need getLotCategories action as we'll use sampleLotCategories
import { useRouter, useSearchParams } from 'next/navigation';


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
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [activeFilters, setActiveFilters] = useState<ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' }>(() => {
    const initial: typeof initialFiltersState = {...initialFiltersState};
    if (searchParamsHook.get('type')) initial.searchType = searchParamsHook.get('type') as any;
    if (searchParamsHook.get('category')) initial.category = searchParamsHook.get('category')!;
    if (searchParamsHook.get('auctionType')) initial.modality = searchParamsHook.get('auctionType')!.toUpperCase();
    if (searchParamsHook.get('status')) initial.status = [searchParamsHook.get('status')!.toUpperCase()];
    return initial;
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [allCategoriesForFilter, setAllCategoriesForFilter] = useState<LotCategory[]>([]);
  const [uniqueLocationsForFilter, setUniqueLocationsForFilter] = useState<string[]>([]);
  const [uniqueSellersForFilter, setUniqueSellersForFilter] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setAllCategoriesForFilter(JSON.parse(JSON.stringify(sampleLotCategories)));
    setUniqueLocationsForFilter(getUniqueLotLocations());
    setUniqueSellersForFilter(getUniqueSellerNames());
    setIsLoading(false);
  }, []);

  const handleSearchTypeChange = (type: 'auctions' | 'lots' | 'direct_sale') => {
    setCurrentSearchType(type);
    setSortBy('relevance'); // Reset sort when changing type
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('type', type);
    router.push(`/search?${currentParams.toString()}`);
  };
  
  const handleFilterSubmit = (filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; }) => {
    setActiveFilters(prev => ({...prev, ...filters, searchType: currentSearchType}));
    setIsFilterSheetOpen(false);
     // Update URL with new filters
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('category', filters.category);
    if (filters.modality) currentParams.set('auctionType', filters.modality); else currentParams.delete('auctionType');
    // Add other filters to params as needed
    router.push(`/search?${currentParams.toString()}`);
  };

  const handleFilterReset = () => {
    const resetFilters: typeof initialFiltersState = {...initialFiltersState, searchType: currentSearchType};
    setActiveFilters(resetFilters);
    // Reset URL params related to filters
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.delete('category');
    currentParams.delete('auctionType');
    // Delete other filter params
    router.push(`/search?${currentParams.toString()}`);
    setIsFilterSheetOpen(false);
  };

  const applySharedFilters = <T extends Auction | Lot | DirectSaleOffer>(
    items: T[],
    filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' },
    itemType: 'auction' | 'lot' | 'direct_sale'
  ): T[] => {
    return items.filter(item => {
        // Search Term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            let searchableText = item.title.toLowerCase();
            if (item.description) searchableText += ` ${item.description.toLowerCase()}`;
            if ('auctionName' in item && item.auctionName) searchableText += ` ${item.auctionName.toLowerCase()}`;
            if ('sellerName' in item && item.sellerName) searchableText += ` ${item.sellerName.toLowerCase()}`;
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

        // Sellers
        if (filters.sellers.length > 0) {
            let sellerName: string | undefined = undefined;
            if ('sellerName' in item && item.sellerName) sellerName = item.sellerName;
            else if ('seller' in item && item.seller) sellerName = item.seller;
            else if ('auctioneer' in item && item.auctioneer) sellerName = item.auctioneer; // Considering auctioneer as a "seller" for filter
            if (!sellerName || !filters.sellers.includes(sellerName)) return false;
        }
        
        // Status (applies to Auction, Lot, DirectSaleOffer)
        if (filters.status && filters.status.length > 0) {
          if (!item.status || !filters.status.includes(item.status as string)) return false;
        }

        // Specific to Auctions (Modality)
        if (itemType === 'auction' && filters.modality !== 'TODAS') {
          const auctionItem = item as Auction;
          if (!auctionItem.auctionType || auctionItem.auctionType.toUpperCase() !== filters.modality) return false;
        }
        
        // Specific to Direct Sales (Offer Type)
        if (itemType === 'direct_sale' && filters.offerType && filters.offerType !== 'ALL') {
          const directSaleItem = item as DirectSaleOffer;
          if (directSaleItem.offerType !== filters.offerType) return false;
        }
      
      return true;
    });
  };

  const filteredAndSortedItems = useMemo(() => {
    let items: any[] = [];
    let currentSortBy = 'relevance';
    let itemType: 'auction' | 'lot' | 'direct_sale' = 'auctions';

    if (currentSearchType === 'auctions') {
      items = sampleAuctions;
      currentSortBy = sortByAuctions;
      itemType = 'auction';
    } else if (currentSearchType === 'lots') {
      items = allLotsWithAuctionData;
      currentSortBy = sortByLots;
      itemType = 'lot';
    } else if (currentSearchType === 'direct_sale') {
      items = sampleDirectSaleOffers;
      currentSortBy = sortBy; // Use a general sortBy for direct sales
      itemType = 'direct_sale';
    }
    
    let filtered = applySharedFilters(items, activeFilters, itemType);

    // Sorting logic
    switch (currentSortBy) {
        case 'id_asc': // Used for Auctions & Lots
            filtered.sort((a,b) => (parseInt(String(a.id).replace(/\D/g,'')) || 0) - (parseInt(String(b.id).replace(/\D/g,'')) || 0));
            break;
        case 'id_desc': // Used for Auctions & Lots
            filtered.sort((a,b) => (parseInt(String(b.id).replace(/\D/g,'')) || 0) - (parseInt(String(a.id).replace(/\D/g,'')) || 0));
            break;
        case 'endDate_asc': // Auctions & Lots
            filtered.sort((a, b) => {
                const dateA = (a as Auction | Lot).endDate || ((a as Auction).auctionStages && (a as Auction).auctionStages!.length > 0 ? (a as Auction).auctionStages![(a as Auction).auctionStages!.length-1].endDate : (a as Auction).auctionDate);
                const dateB = (b as Auction | Lot).endDate || ((b as Auction).auctionStages && (b as Auction).auctionStages!.length > 0 ? (b as Auction).auctionStages![(b as Auction).auctionStages!.length-1].endDate : (b as Auction).auctionDate);
                return new Date(dateA).getTime() - new Date(dateB).getTime();
            });
            break;
        case 'endDate_desc': // Auctions & Lots
            filtered.sort((a, b) => {
                const dateA = (a as Auction | Lot).endDate || ((a as Auction).auctionStages && (a as Auction).auctionStages!.length > 0 ? (a as Auction).auctionStages![(a as Auction).auctionStages!.length-1].endDate : (a as Auction).auctionDate);
                const dateB = (b as Auction | Lot).endDate || ((b as Auction).auctionStages && (b as Auction).auctionStages!.length > 0 ? (b as Auction).auctionStages![(b as Auction).auctionStages!.length-1].endDate : (b as Auction).auctionDate);
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
            break;
        case 'price_asc': // Lots & DirectSales
             filtered.sort((a, b) => ((a as Lot | DirectSaleOffer).price ?? Infinity) - ((b as Lot | DirectSaleOffer).price ?? Infinity));
            break;
        case 'price_desc': // Lots & DirectSales
            filtered.sort((a, b) => ((b as Lot | DirectSaleOffer).price ?? -Infinity) - ((a as Lot | DirectSaleOffer).price ?? -Infinity));
            break;
        case 'views_desc': // Auctions, Lots, DirectSales
            filtered.sort((a, b) => ((b as any).views || 0) - ((a as any).views || 0));
            break;
        case 'createdAt_desc': // DirectSales
            filtered.sort((a,b) => new Date((b as DirectSaleOffer).createdAt).getTime() - new Date((a as DirectSaleOffer).createdAt).getTime());
            break;
        case 'createdAt_asc': // DirectSales
            filtered.sort((a,b) => new Date((a as DirectSaleOffer).createdAt).getTime() - new Date((b as DirectSaleOffer).createdAt).getTime());
            break;
        case 'lotNumber_asc': // Lots
            filtered.sort((a,b) => (parseInt(String((a as Lot).number || a.id).replace(/\D/g,'')) || 0) - (parseInt(String((b as Lot).number || b.id).replace(/\D/g,'')) || 0));
            break;
        case 'lotNumber_desc': // Lots
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
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground font-medium">Busca Avançada</span>
      </div>
      
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
                        onFilterSubmit={handleFilterSubmit}
                        onFilterReset={handleFilterReset}
                        initialFilters={activeFilters}
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
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                initialFilters={activeFilters}
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
    <file>/home/user/studio/src/app/auctions/[auctionId]/lots/[lotId]/lot-detail-client.tsx</file>
    <content><![CDATA[
'use client';
    
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Lot, Auction, BidInfo, SellerProfileInfo, Review, LotQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Printer, Share2, ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Search, Key, Info,
    Tag, CalendarDays, Clock, Users, DollarSign, MapPin, Car, Settings, ThumbsUp,
    ShieldCheck, HelpCircle, ShoppingCart, Heart, X, Facebook, Mail, MessageSquareText, Gavel, ImageOff, Loader2, FileText, ThumbsDown, MessageCircle, Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addRecentlyViewedId } from '@/lib/recently-viewed-store';
import { useToast } from '@/hooks/use-toast';
    
import { isLotFavoriteInStorage, addFavoriteLotIdToStorage, removeFavoriteLotIdFromStorage } from '@/lib/favorite-store';
import { useAuth } from '@/contexts/auth-context';
import { getAuctionStatusText, getLotStatusColor, sampleAuctions } from '@/lib/sample-data';
// Using sample data for bids, reviews, questions as per request
import { getBidsForLot, getReviewsForLot, createReview, getQuestionsForLot, askQuestionOnLot, placeBidOnLot } from './actions'; 
import { auth } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LotDescriptionTab from '@/components/auction/lot-description-tab';
import LotSpecificationTab from '@/components/auction/lot-specification-tab';
import LotSellerTab from '@/components/auction/lot-seller-tab';
import LotReviewsTab from '@/components/auction/lot-reviews-tab';
import LotQuestionsTab from '@/components/auction/lot-questions-tab';
import LotPreviewModal from '@/components/lot-preview-modal';
import { hasPermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
    
const SUPER_TEST_USER_EMAIL_FOR_BYPASS = 'admin@bidexpert.com.br'.toLowerCase();
const SUPER_TEST_USER_UID_FOR_BYPASS = 'SUPER_TEST_USER_UID_PLACEHOLDER_AUG';
const SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS = 'Administrador BidExpert (Super Test)';
    
interface LotDetailClientContentProps {
  lot: Lot;
  auction: Auction;
  sellerName?: string | null;
  lotIndex?: number;
  previousLotId?: string;
  nextLotId?: string;
  totalLotsInAuction?: number;
}
    
export default function LotDetailClientContent({
  lot: initialLot,
  auction,
  sellerName: initialSellerName,
  lotIndex,
  previousLotId,
  nextLotId,
  totalLotsInAuction
}: LotDetailClientContentProps) {
  const [lot, setLot] = useState<Lot>(initialLot);
  const [isLotFavorite, setIsLotFavorite] = useState(false);
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState('');
  const { userProfileWithPermissions, loading: authLoading } = useAuth(); 
  const [lotBids, setLotBids] = useState<BidInfo[]>([]);
  const [lotReviews, setLotReviews] = useState<Review[]>([]);
  const [lotQuestions, setLotQuestions] = useState<LotQuestion[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmountInput, setBidAmountInput] = useState<string>('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    
  const gallery = useMemo(() => {
    if (!lot) return [];
    const mainImage = typeof lot.imageUrl === 'string' && lot.imageUrl.trim() !== '' ? [lot.imageUrl] : [];
    const galleryImages = (lot.galleryImageUrls || []).filter(url => typeof url === 'string' && url.trim() !== '');
    const combined = [...mainImage, ...galleryImages];
    const uniqueUrls = Array.from(new Set(combined.filter(Boolean)));
    return uniqueUrls.length > 0 ? uniqueUrls : ['https://placehold.co/800x600.png?text=Imagem+Indisponivel'];
  }, [lot]);
    
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
    if (lot?.id) {
      addRecentlyViewedId(lot.id);
      setIsLotFavorite(isLotFavoriteInStorage(lot.id));
      setCurrentImageIndex(0);
    
      const fetchDataForTabs = async () => {
        setIsLoadingData(true);
        try {
          console.log(`[LotDetailClient] Fetching tab data for lot ID: ${lot.id}`);
          const [bids, reviews, questions] = await Promise.all([
            getBidsForLot(lot.id),
            getReviewsForLot(lot.id),
            getQuestionsForLot(lot.id)
          ]);
          console.log(`[LotDetailClient] Bids fetched: ${bids.length}, Reviews: ${reviews.length}, Questions: ${questions.length}`);
          setLotBids(bids);
          setLotReviews(reviews);
          setLotQuestions(questions);
        } catch (error: any) {
          console.error("[LotDetailClient] Error fetching data for tabs:", error);
          toast({ title: "Erro", description: "Não foi possível carregar todos os dados do lote.", variant: "destructive" });
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchDataForTabs();
    }
  }, [lot, toast]); // Removed fetchDataForTabs from dependency array as it's defined inside
    
    
  const lotTitle = `${lot?.year || ''} ${lot?.make || ''} ${lot?.model || ''} ${lot?.series || lot?.title}`.trim();
  const lotLocation = lot?.cityName && lot?.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot?.stateUf || lot?.cityName || 'Não informado';
    
  const isEffectivelySuperTestUser = userProfileWithPermissions?.email?.toLowerCase() === SUPER_TEST_USER_EMAIL_FOR_BYPASS;
  const hasAdminRights = userProfileWithPermissions && hasPermission(userProfileWithPermissions, 'manage_all');
  const isUserHabilitado = userProfileWithPermissions?.habilitationStatus === 'HABILITADO';
    
  const canUserBid = 
    (isEffectivelySuperTestUser || hasAdminRights || (userProfileWithPermissions && isUserHabilitado)) && 
    lot?.status === 'ABERTO_PARA_LANCES';
    
  const canUserReview = !!userProfileWithPermissions;
    
  const canUserAskQuestion = 
    isEffectivelySuperTestUser || hasAdminRights || (userProfileWithPermissions && isUserHabilitado);
    
  const handleToggleFavorite = () => {
    if (!lot || !lot.id) return;
    const newFavoriteState = !isLotFavorite;
    setIsLotFavorite(newFavoriteState);
    
    if (newFavoriteState) {
      addFavoriteLotIdToStorage(lot.id);
    } else {
      removeFavoriteLotIdFromStorage(lot.id);
    }
    
    toast({
      title: newFavoriteState ? "Adicionado aos Favoritos" : "Removido dos Favoritos",
      description: `O lote "${lotTitle}" foi ${newFavoriteState ? 'adicionado à' : 'removido da'} sua lista.`,
    });
  };
    
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };
    
  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch(platform) {
      case 'x':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  };
    
  const bidIncrement = (lot?.price || 0) > 10000 ? 500 : ((lot?.price || 0) > 1000 ? 100 : 50);
  const nextMinimumBid = (lot?.price || 0) + bidIncrement;
    
  const handlePlaceBid = async () => {
    setIsPlacingBid(true);
    
    let userIdForBid: string | undefined = userProfileWithPermissions?.uid;
    let displayNameForBid: string | undefined = userProfileWithPermissions?.fullName || userProfileWithPermissions?.email?.split('@')[0];

    if (isEffectivelySuperTestUser && !userIdForBid) {
        userIdForBid = userProfileWithPermissions?.uid || SUPER_TEST_USER_UID_FOR_BYPASS; 
        displayNameForBid = userProfileWithPermissions?.fullName || SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
    }
    
    if (!userIdForBid) {
      toast({ title: "Ação Requerida", description: "Você precisa estar logado e com perfil carregado para dar um lance.", variant: "destructive" });
      setIsPlacingBid(false);
      return;
    }
    if (!displayNameForBid) displayNameForBid = 'Usuário Anônimo';
    
    const amountToBid = parseFloat(bidAmountInput);
    if (isNaN(amountToBid) || amountToBid <= 0) {
      toast({ title: "Erro no Lance", description: "Por favor, insira um valor de lance válido.", variant: "destructive" });
      setIsPlacingBid(false);
      return;
    }
    
    try {
      console.log(`[LotDetailClient] Placing bid for lot ${lot.id} by user ${userIdForBid} with amount ${amountToBid}`);
      const result = await placeBidOnLot(lot.id, lot.auctionId, userIdForBid!, displayNameForBid!, amountToBid);
      console.log(`[LotDetailClient] placeBidOnLot result:`, result);

      if (result.success && result.updatedLot && result.newBid) {
        setLot(prevLot => ({ ...prevLot!, ...result.updatedLot }));
        setLotBids(prevBids => [result.newBid!, ...prevBids].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setBidAmountInput('');
        toast({ title: "Lance Enviado!", description: result.message });
      } else {
        toast({ title: "Erro ao Dar Lance", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro Inesperado", description: error.message || "Ocorreu um erro ao processar seu lance.", variant: "destructive" });
    } finally {
      setIsPlacingBid(false);
    }
  };
    
  const currentBidLabel = lot?.bidsCount && lot.bidsCount > 0 ? "Lance Atual" : "Lance Inicial";
  const currentBidValue = lot?.price || 0;
    
  if (!lot || !auction) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <p className="text-muted-foreground">Carregando detalhes do lote...</p>
      </div>
    );
  }
    
  const nextImage = () => setCurrentImageIndex((prev) => (gallery.length > 0 ? (prev + 1) % gallery.length : 0));
  const prevImage = () => setCurrentImageIndex((prev) => (gallery.length > 0 ? (prev - 1 + gallery.length) % gallery.length : 0));
    
  const actualLotNumber = lot.number || lot.id;
  const displayLotPosition = lotIndex !== undefined && lotIndex !== -1 ? lotIndex + 1 : 'N/A';
  const displayTotalLots = totalLotsInAuction || auction.totalLots || 'N/A';
    
  const handleNewReview = async (rating: number, comment: string) => {
    let userIdForReview: string | undefined = userProfileWithPermissions?.uid;
    let displayNameForReview: string | undefined = userProfileWithPermissions?.fullName || userProfileWithPermissions?.email?.split('@')[0];

    if (isEffectivelySuperTestUser && !userIdForReview) {
        userIdForReview = userProfileWithPermissions?.uid || SUPER_TEST_USER_UID_FOR_BYPASS; 
        displayNameForReview = userProfileWithPermissions?.fullName || SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
    }

    if (!userIdForReview) {
      toast({ title: "Login Necessário", description: "Você precisa estar logado para enviar uma avaliação.", variant: "destructive" });
      return false;
    }
    if (!displayNameForReview) displayNameForReview = 'Usuário Anônimo';
    
    console.log(`[LotDetailClient] Submitting review for lot ${lot.id} by user ${userIdForReview}`);
    const result = await createReview(lot.id, userIdForReview, displayNameForReview, rating, comment);
    console.log(`[LotDetailClient] createReview result:`, result);

    if (result.success) {
      toast({ title: "Avaliação Enviada", description: result.message });
      const updatedReviews = await getReviewsForLot(lot.id);
      setLotReviews(updatedReviews);
      return true;
    } else {
      toast({ title: "Erro ao Enviar Avaliação", description: result.message, variant: "destructive" });
      return false;
    }
  };
    
  const handleNewQuestion = async (questionText: string) => {
    let userIdForQuestion: string | undefined = userProfileWithPermissions?.uid;
    let displayNameForQuestion: string | undefined = userProfileWithPermissions?.fullName || userProfileWithPermissions?.email?.split('@')[0];

    if (isEffectivelySuperTestUser && !userIdForQuestion) {
        userIdForQuestion = userProfileWithPermissions?.uid || SUPER_TEST_USER_UID_FOR_BYPASS; 
        displayNameForQuestion = userProfileWithPermissions?.fullName || SUPER_TEST_USER_DISPLAYNAME_FOR_BYPASS;
    }

    if (!userIdForQuestion) {
      toast({ title: "Login Necessário", description: "Você precisa estar logado para enviar uma pergunta.", variant: "destructive" });
      return false;
    }
     if (!isUserHabilitado && !hasAdminRights && !isEffectivelySuperTestUser) {
      toast({ title: "Habilitação Necessária", description: "Você precisa estar habilitado para fazer perguntas.", variant: "destructive" });
      return false;
    }
    if (!displayNameForQuestion) displayNameForQuestion = 'Usuário Anônimo';
    
    console.log(`[LotDetailClient] Submitting question for lot ${lot.id} by user ${userIdForQuestion}`);
    const result = await askQuestionOnLot(lot.id, userIdForQuestion, displayNameForQuestion, questionText);
    console.log(`[LotDetailClient] askQuestionOnLot result:`, result);

    if (result.success) {
      toast({ title: "Pergunta Enviada", description: result.message });
      const updatedQuestions = await getQuestionsForLot(lot.id);
      setLotQuestions(updatedQuestions);
      return true;
    } else {
      toast({ title: "Erro ao Enviar Pergunta", description: result.message, variant: "destructive" });
      return false;
    }
  };
    
 return (
    <>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
            <div className="flex-grow">
                <h1 className="text-2xl md:text-3xl font-bold font-headline text-left">{lotTitle}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs px-2 py-0.5 ${getLotStatusColor(lot.status)}`}>
                        {getAuctionStatusText(lot.status)}
                    </Badge>
                </div>
            </div>
            <div className="flex items-center space-x-2 flex-wrap justify-start sm:justify-end mt-2 sm:mt-0">
                    <Button variant="outline" size="icon" onClick={handlePrint} aria-label="Imprimir"><Printer className="h-4 w-4" /></Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Compartilhar"><Share2 className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><a href={getSocialLink('x', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><X className="h-4 w-4" /> X (Twitter)</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('facebook', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><Facebook className="h-4 w-4" /> Facebook</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('whatsapp', currentUrl, lotTitle)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer"><MessageSquareText className="h-4 w-4" /> WhatsApp</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={getSocialLink('email', currentUrl, lotTitle)} className="flex items-center gap-2 cursor-pointer"><Mail className="h-4 w-4" /> Email</a></DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
                
                        <Button variant="outline" size="icon" asChild aria-label="Voltar para o leilão"><Link href={`/auctions/${auction.id}`}><ArrowLeft className="h-4 w-4" /></Link></Button>
            </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">Lote Nº: {actualLotNumber}</span>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild={!!previousLotId} disabled={!previousLotId} aria-label="Lote Anterior">{previousLotId ? <Link href={`/auctions/${auction.id}/lots/${previousLotId}`}><ChevronLeft className="h-4 w-4" /></Link> : <ChevronLeft className="h-4 w-4"/>}</Button>
                    <span className="text-sm text-muted-foreground mx-1">Lote {displayLotPosition} de {displayTotalLots}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild={!!nextLotId} disabled={!nextLotId} aria-label="Próximo Lote">{nextLotId ? <Link href={`/auctions/${auction.id}/lots/${nextLotId}`}><ChevronRight className="h-4 w-4" /></Link> : <ChevronRight className="h-4 w-4" />}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-lg">
                <CardContent className="p-4">
                    <div className="relative aspect-[16/9] w-full bg-muted rounded-md overflow-hidden mb-4">
                    {gallery.length > 0 && gallery[currentImageIndex] ? (
                        <Image src={gallery[currentImageIndex]} alt={`Imagem ${currentImageIndex + 1} de ${lot.title}`} fill className="object-contain" data-ai-hint={lot.dataAiHint || "imagem principal lote"} priority={currentImageIndex === 0} unoptimized={gallery[currentImageIndex]?.startsWith('https://placehold.co')}/>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><ImageOff className="h-16 w-16 mb-2" /><span>Imagem principal não disponível</span></div>
                    )}
                    {gallery.length > 1 && (
                        <><Button variant="outline" size="icon" onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Imagem Anterior"><ChevronLeft className="h-5 w-5" /></Button>
                        <Button variant="outline" size="icon" onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-9 w-9 rounded-full shadow-md" aria-label="Próxima Imagem"><ChevronRight className="h-5 w-5" /></Button></>
                    )}
                    </div>
                    {gallery.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                        {gallery.map((url, index) => (<button key={index} className={`relative aspect-square bg-muted rounded overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/50'}`} onClick={() => setCurrentImageIndex(index)} aria-label={`Ver imagem ${index + 1}`}><Image src={url} alt={`Miniatura ${index + 1}`} fill className="object-cover" data-ai-hint={lot.dataAiHint || 'imagem galeria carro'} unoptimized={url.startsWith('https://placehold.co')}/></button>))}
                    </div>
                    )}
                    {gallery.length === 0 && (<p className="text-sm text-center text-muted-foreground py-4">Nenhuma imagem na galeria.</p>)}
                    <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                    {lot.hasKey && <span className="flex items-center"><Key className="h-4 w-4 mr-1 text-primary"/> Chave Presente</span>}
                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary"/> Localização: {lotLocation}</span>
                    </div>
                </CardContent>
                </Card>
                
                <Card className="shadow-lg">
                <CardContent className="p-0 sm:p-2 md:p-4">
                    <Tabs defaultValue="description" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-4">
                        <TabsTrigger value="description">Descrição</TabsTrigger>
                        <TabsTrigger value="specification">Especificações</TabsTrigger>
                        <TabsTrigger value="seller">Comitente</TabsTrigger>
                        <TabsTrigger value="reviews">Avaliações</TabsTrigger>
                        <TabsTrigger value="questions">Perguntas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="description"><LotDescriptionTab lot={lot} /></TabsContent>
                    <TabsContent value="specification"><LotSpecificationTab lot={lot} /></TabsContent>
                    <TabsContent value="seller"><LotSellerTab sellerName={initialSellerName || auction.seller || "Não Informado"} sellerId={lot.sellerId} auctionSellerName={auction.seller} /></TabsContent>
                    <TabsContent value="reviews"><LotReviewsTab lot={lot} reviews={lotReviews} isLoading={isLoadingData} onNewReview={handleNewReview} canUserReview={canUserReview} /></TabsContent>
                    <TabsContent value="questions"><LotQuestionsTab lot={lot} questions={lotQuestions} isLoading={isLoadingData} onNewQuestion={handleNewQuestion} canUserAskQuestion={canUserAskQuestion} /></TabsContent>
                    </Tabs>
                </CardContent>
                </Card>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24">
                <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl">Informações do Lance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm">
                        <p className="text-muted-foreground">{currentBidLabel}:</p>
                        <p className="text-2xl font-bold text-primary">
                            R$ {currentBidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    {canUserBid ? (
                    <div className="space-y-2">
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input type="number" placeholder={`Mínimo R$ ${nextMinimumBid.toLocaleString('pt-BR')}`} value={bidAmountInput} onChange={(e) => setBidAmountInput(e.target.value)} className="pl-9 h-11 text-base" min={nextMinimumBid} step={bidIncrement} disabled={isPlacingBid} />
                        </div>
                        <Button onClick={handlePlaceBid} disabled={isPlacingBid || !bidAmountInput} className="w-full h-11 text-base">
                        {isPlacingBid ? <Loader2 className="animate-spin" /> : `Dar Lance (R$ ${parseFloat(bidAmountInput || '0').toLocaleString('pt-BR') || nextMinimumBid.toLocaleString('pt-BR') })`}
                        </Button>
                    </div>
                    ) : (
                    <div className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md">
                        <p>{lot.status !== 'ABERTO_PARA_LANCES' ? `Lances para este lote estão ${getAuctionStatusText(lot.status).toLowerCase()}.` : (userProfileWithPermissions ? 'Você precisa estar habilitado para dar lances.' : 'Você precisa estar logado para dar lances.')}</p>
                        {!userProfileWithPermissions && <Link href={`/auth/login?redirect=/auctions/${auction.id}/lots/${lot.id}`} className="text-primary hover:underline font-medium">Faça login ou registre-se.</Link>}
                    </div>
                    )}
                    <Button variant="outline" className="w-full" onClick={handleToggleFavorite}>
                    <Heart className={`mr-2 h-4 w-4 ${isLotFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    {isLotFavorite ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
                    </Button>
                </CardContent>
                </Card>

                <Card className="shadow-md">
                <CardHeader><CardTitle className="text-xl flex items-center">Informações da Venda <Info className="h-4 w-4 ml-2 text-muted-foreground" /></CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                    {Object.entries({
                    "Filial de Venda:": lot.sellingBranch || auction.sellingBranch,
                    "Localização do Veículo:": lot.vehicleLocationInBranch || lotLocation,
                    "Data e Hora do Leilão (Lote):": lot.lotSpecificAuctionDate ? format(new Date(lot.lotSpecificAuctionDate), "dd/MM/yyyy HH:mm'h'", { locale: ptBR }) : 'N/A',
                    "Pista/Corrida #:": lot.laneRunNumber,
                    "Corredor/Vaga:": lot.aisleStall,
                    "Valor Real em Dinheiro (VCV):": lot.actualCashValue,
                    "Custo Estimado de Reparo:": lot.estimatedRepairCost,
                    "Vendedor:": lot.sellerName || auction.seller || initialSellerName,
                    "Documento (Título/Venda):": lot.titleInfo,
                    "Marca do Documento:": lot.titleBrand,
                    }).map(([key, value]) => value ? <div key={key}><span className="font-medium text-foreground">{key}</span> <span className="text-muted-foreground">{String(value)}</span></div> : null)}
                </CardContent>
                </Card>

                <Card className="shadow-md">
                <CardHeader><CardTitle className="text-xl flex items-center">Histórico de Lances</CardTitle></CardHeader>
                <CardContent>
                    {isLoadingData ? (
                        <div className="flex items-center justify-center h-20"> <Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : lotBids.length > 0 ? (
                        <ul className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2">
                            {lotBids.slice(0, 5).map(bid => (
                                <li key={bid.id} className="flex justify-between items-center p-2 bg-secondary/40 rounded-md">
                                    <div>
                                        <span className="font-medium text-foreground">{bid.bidderDisplay}</span>
                                        <span className="text-xs text-muted-foreground ml-2">({bid.timestamp ? format(new Date(bid.timestamp), "dd/MM HH:mm:ss", { locale: ptBR }) : 'Data Indisponível'})</span>
                                    </div>
                                    <span className="font-semibold text-primary">R$ {bid.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </li>
                            ))}
                            {lotBids.length > 5 && <p className="text-xs text-center mt-2 text-muted-foreground">...</p>}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-3">Nenhum lance registrado para este lote ainda.</p>
                    )}
                </CardContent>
                </Card>
            </div>
            </div>
        </div>
      <LotPreviewModal
        lot={lot}
        auction={auction}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </>
 );
}
    