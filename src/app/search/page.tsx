
'use client';

import { useState, useEffect, useMemo } from 'react';
import AuctionCard from '@/components/auction-card';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import SidebarFilters, { type ActiveFilters } from '@/components/sidebar-filters'; 
import { sampleAuctions, sampleLots, getUniqueLotLocations, getUniqueSellerNames, slugify } from '@/lib/sample-data';
import { getLotCategories } from '@/app/admin/categories/actions'; // Import category action
import type { Auction, Lot, LotCategory } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, SlidersHorizontal, Loader2, LayoutGrid, List } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const sortOptions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'id_asc', label: 'Nº Item: Menor ao Maior' },
  { value: 'id_desc', label: 'Nº Item: Maior ao Menor' },
  { value: 'endDate_asc', label: 'Data Encerramento: Próximos' },
  { value: 'endDate_desc', label: 'Data Encerramento: Distantes' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
  { value: 'views_desc', label: 'Mais Visitados' },
];

const initialFiltersState: ActiveFilters = {
  modality: 'TODAS',
  category: 'TODAS', // Categoria é o slug ou 'TODAS'
  priceRange: [0, 1000000],
  locations: [],
  sellers: [],
  startDate: undefined,
  endDate: undefined,
  status: [],
};


export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'auctions' | 'lots'>('auctions');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortByAuctions, setSortByAuctions] = useState<string>('relevance');
  const [sortByLots, setSortByLots] = useState<string>('relevance');
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialFiltersState);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [lotCategories, setLotCategories] = useState<LotCategory[]>([]);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [uniqueSellers, setUniqueSellers] = useState<string[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  useEffect(() => {
    async function fetchFilterData() {
      setIsLoadingFilters(true);
      try {
        const categories = await getLotCategories();
        setLotCategories(categories);
        // TODO: Fetch unique locations and sellers from Firestore in the future
        setUniqueLocations(getUniqueLotLocations()); // Still from sample-data
        setUniqueSellers(getUniqueSellerNames());   // Still from sample-data
      } catch (error) {
        console.error("Error fetching filter data:", error);
        // Set empty or fallback data if needed
      } finally {
        setIsLoadingFilters(false);
      }
    }
    fetchFilterData();
  }, []);


  const allLotsWithAuctionData = useMemo(() => {
    return sampleAuctions.flatMap(auction => 
      auction.lots.map(lot => ({ ...lot, auction })) 
    );
  }, []);

  const applySharedFilters = <T extends Auction | Lot>(
    items: T[],
    filters: ActiveFilters,
    itemType: 'auction' | 'lot'
  ): T[] => {
    return items.filter(item => {
      const itemPrice = 'price' in item ? item.price : ('initialOffer' in item ? item.initialOffer : undefined);
      if (itemPrice !== undefined && (itemPrice < filters.priceRange[0] || itemPrice > filters.priceRange[1])) {
        return false;
      }

      if (filters.locations.length > 0) {
        const itemLocation = 'location' in item ? item.location : (itemType === 'auction' ? (item as Auction).vehicleLocation : undefined);
        if (!itemLocation || !filters.locations.includes(itemLocation)) return false;
      }

      if (filters.sellers.length > 0) {
        let sellerName: string | undefined = undefined;
        if ('sellerName' in item && item.sellerName) sellerName = item.sellerName;
        else if ('seller' in item && item.seller) sellerName = item.seller;
        else if ('auctioneer' in item && item.auctioneer) sellerName = item.auctioneer;
        
        if (!sellerName || !filters.sellers.includes(sellerName)) return false;
      }
      
      if (filters.category !== 'TODAS') { // filters.category is now slug
        const itemCategoryName = itemType === 'lot' ? (item as Lot).type : (item as Auction).category;
        if (slugify(itemCategoryName) !== filters.category) return false;
      }

      if (filters.startDate) {
        const itemDate = 'auctionDate' in item ? item.auctionDate : ('endDate' in item ? item.endDate : undefined);
        if (!itemDate || new Date(itemDate) < filters.startDate) return false;
      }
      if (filters.endDate) {
        const itemDate = 'auctionDate' in item ? item.auctionDate : ('endDate' in item ? item.endDate : undefined);
         if (!itemDate || new Date(itemDate) > filters.endDate) return false;
      }
      
      if (filters.status.length > 0) {
        if (!item.status || !filters.status.includes(item.status as string)) return false;
      }
      
      return true;
    });
  };

  const baseFilteredAuctions = useMemo(() => {
    let filtered = sampleAuctions; // Replace with actual fetch if not using sample data
    if (searchTerm) {
      filtered = sampleAuctions.filter(auction =>
        auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (auction.fullTitle && auction.fullTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        auction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return applySharedFilters(filtered, activeFilters, 'auction');
  }, [searchTerm, activeFilters]);

  const baseFilteredLots = useMemo(() => {
    let filtered = allLotsWithAuctionData; // Replace with actual fetch if not using sample data
    if (searchTerm) {
      filtered = allLotsWithAuctionData.filter(lot =>
        lot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lot.description && lot.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        lot.auctionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return applySharedFilters(filtered, activeFilters, 'lot');
  }, [searchTerm, allLotsWithAuctionData, activeFilters]);
  
  const sortedAuctions = useMemo(() => {
    let auctionsToSort = [...baseFilteredAuctions];
    // Sorting logic remains the same
    switch (sortByAuctions) {
      case 'id_asc':
        auctionsToSort.sort((a, b) => (parseInt(a.id.replace(/\D/g,'')) || 0) - (parseInt(b.id.replace(/\D/g,'')) || 0));
        break;
      case 'id_desc':
        auctionsToSort.sort((a, b) => (parseInt(b.id.replace(/\D/g,'')) || 0) - (parseInt(a.id.replace(/\D/g,'')) || 0));
        break;
      case 'endDate_asc':
        auctionsToSort.sort((a, b) => {
            const dateA = a.endDate || (a.auctionStages && a.auctionStages.length > 0 ? a.auctionStages[a.auctionStages.length-1].endDate : a.auctionDate);
            const dateB = b.endDate || (b.auctionStages && b.auctionStages.length > 0 ? b.auctionStages[b.auctionStages.length-1].endDate : b.auctionDate);
            return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
        break;
      case 'endDate_desc':
         auctionsToSort.sort((a, b) => {
            const dateA = a.endDate || (a.auctionStages && a.auctionStages.length > 0 ? a.auctionStages[a.auctionStages.length-1].endDate : a.auctionDate);
            const dateB = b.endDate || (b.auctionStages && b.auctionStages.length > 0 ? b.auctionStages[b.auctionStages.length-1].endDate : b.auctionDate);
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        break;
      case 'price_asc':
        auctionsToSort.sort((a, b) => (a.initialOffer || 0) - (b.initialOffer || 0));
        break;
      case 'price_desc':
        auctionsToSort.sort((a, b) => (b.initialOffer || 0) - (a.initialOffer || 0));
        break;
      case 'views_desc':
        auctionsToSort.sort((a, b) => (b.visits || 0) - (a.visits || 0));
        break;
      case 'relevance':
      default:
        break;
    }
    return auctionsToSort;
  }, [baseFilteredAuctions, sortByAuctions]);

  const sortedLots = useMemo(() => {
    let lotsToSort = [...baseFilteredLots];
    // Sorting logic remains the same
    switch (sortByLots) {
      case 'id_asc':
        lotsToSort.sort((a, b) => (parseInt(a.id.replace(/\D/g,'')) || 0) - (parseInt(b.id.replace(/\D/g,'')) || 0));
        break;
      case 'id_desc':
        lotsToSort.sort((a, b) => (parseInt(b.id.replace(/\D/g,'')) || 0) - (parseInt(a.id.replace(/\D/g,'')) || 0));
        break;
      case 'endDate_asc':
        lotsToSort.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
      case 'endDate_desc':
        lotsToSort.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
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
      case 'relevance':
      default:
        break;
    }
    return lotsToSort;
  }, [baseFilteredLots, sortByLots]);


  const handleFilterSubmit = (filters: ActiveFilters) => {
    setActiveFilters(filters);
    setIsFilterSheetOpen(false);
  };

  const handleFilterReset = () => {
    setActiveFilters(initialFiltersState);
    setIsFilterSheetOpen(false);
  };

  if (isLoadingFilters) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando filtros e dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 font-headline">Navegar e Buscar</h1>
        <p className="text-muted-foreground mb-6">Encontre leilões ou lotes específicos.</p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-6 max-w-3xl mx-auto">
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
                        categories={lotCategories} // Pass fetched categories
                        locations={uniqueLocations}
                        sellers={uniqueSellers}
                        onFilterSubmit={handleFilterSubmit}
                        onFilterReset={handleFilterReset}
                        initialFilters={activeFilters}
                    />
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8">
        <div className="hidden md:block">
            <SidebarFilters 
                categories={lotCategories} // Pass fetched categories
                locations={uniqueLocations}
                sellers={uniqueSellers}
                onFilterSubmit={handleFilterSubmit}
                onFilterReset={handleFilterReset}
                initialFilters={activeFilters}
            />
        </div>
        
        <main className="space-y-6">
            <Tabs value={searchType} onValueChange={(value) => setSearchType(value as 'auctions' | 'lots')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="auctions">Buscar Leilões ({sortedAuctions.length})</TabsTrigger>
                <TabsTrigger value="lots">Buscar Lotes ({sortedLots.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="auctions">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 p-4 bg-card border rounded-lg shadow-sm">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {sortedAuctions.length} leilão{sortedAuctions.length !== 1 ? 's' : ''} {searchTerm && `contendo "${searchTerm}"`}
                    </p>
                    <div className="flex items-center gap-3">
                        <Select value={sortByAuctions} onValueChange={setSortByAuctions}>
                            <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                                <SelectValue placeholder="Ordenar leilões por" />
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
                    </div>
                </div>
                {sortedAuctions.length > 0 ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                    {sortedAuctions.map((auction) => (
                        <AuctionCard key={auction.id} auction={auction} />
                    ))}
                </div>
                ) : (
                <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">Nenhum Leilão Encontrado</h2>
                    <p className="text-muted-foreground mb-4">Tente ajustar seus termos de busca ou filtros.</p>
                    <Button asChild variant="outline">
                    <Link href="/">Ver Todos os Leilões</Link>
                    </Button>
                </div>
                )}
            </TabsContent>
            
            <TabsContent value="lots">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 p-4 bg-card border rounded-lg shadow-sm">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {sortedLots.length} lote{sortedLots.length !== 1 ? 's' : ''} {searchTerm && `contendo "${searchTerm}"`}
                    </p>
                     <div className="flex items-center gap-3">
                        <Select value={sortByLots} onValueChange={setSortByLots}>
                            <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                                <SelectValue placeholder="Ordenar lotes por" />
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
                    </div>
                </div>
                {sortedLots.length > 0 ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'}`}>
                    {sortedLots.map((lot) => (
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
            </Tabs>
        </main>
      </div>
    </div>
  );
}
