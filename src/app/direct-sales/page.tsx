
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, LayoutGrid, List, SlidersHorizontal, Loader2, Search as SearchIcon } from 'lucide-react'; // Adicionado SearchIcon
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import type { ActiveFilters } from '@/components/sidebar-filters'; 
import DirectSaleOfferCard from '@/components/direct-sale-offer-card';
import type { DirectSaleOffer, LotCategory, DirectSaleOfferType } from '@/types';
import { 
    sampleDirectSaleOffers,
    getUniqueLotLocations, 
    getUniqueSellerNames, 
    slugify,
    sampleLotCategories 
} from '@/lib/sample-data';
import { getLotCategories } from '@/app/admin/categories/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import SidebarFiltersSkeleton from '@/components/sidebar-filters-skeleton';

const SidebarFilters = dynamic(() => import('@/components/sidebar-filters'), {
  loading: () => <SidebarFiltersSkeleton />,
  ssr: false,
});

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
  status: ['ACTIVE'], 
  offerType: 'ALL',
  searchType: 'direct_sale', // Default for this page
};


export default function DirectSalesPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('relevance');
  
  const [allCategoriesForFilter, setAllCategoriesForFilter] = useState<LotCategory[]>([]);
  const [uniqueLocationsForFilter, setUniqueLocationsForFilter] = useState<string[]>([]);
  const [uniqueSellersForFilter, setUniqueSellersForFilter] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; searchType?: 'auctions' | 'lots' | 'direct_sale' }>(() => {
    const initial: typeof initialFiltersState = {...initialFiltersState, searchType: 'direct_sale'};
    if (searchParamsHook.get('category')) initial.category = searchParamsHook.get('category')!;
    if (searchParamsHook.get('offerType')) initial.offerType = searchParamsHook.get('offerType') as any;
    if (searchParamsHook.get('status')) initial.status = [searchParamsHook.get('status')!.toUpperCase()]; else initial.status = ['ACTIVE'];
    return initial;
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const categories = await getLotCategories(); // Using admin categories for now
        setAllCategoriesForFilter(categories);

        const locations = new Set<string>();
        sampleDirectSaleOffers.forEach(offer => {
          if (offer.locationCity && offer.locationState) locations.add(`${offer.locationCity} - ${offer.locationState}`);
          else if (offer.locationCity) locations.add(offer.locationCity);
          else if (offer.locationState) locations.add(offer.locationState);
        });
        setUniqueLocationsForFilter(Array.from(locations).sort());
        
        // Using a simplified version for sellers for direct sales, assuming sellerName is primary
        const sellers = new Set<string>();
        sampleDirectSaleOffers.forEach(offer => {
            if (offer.sellerName) sellers.add(offer.sellerName);
        });
        setUniqueSellersForFilter(Array.from(sellers).sort());

      } catch (error) {
        console.error("Error fetching filter data for direct sales:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);
  
  const handleFilterSubmit = (filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; }) => {
    setActiveFilters(prev => ({...prev, ...filters, searchType: 'direct_sale'}));
    setIsFilterSheetOpen(false);
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('type', 'direct_sale'); // Ensure type is set
    currentParams.set('category', filters.category);
    if (filters.offerType) currentParams.set('offerType', filters.offerType); else currentParams.delete('offerType');
    if (filters.status && filters.status.length > 0) currentParams.set('status', filters.status.join(',')); else currentParams.delete('status');
    router.push(`/direct-sales?${currentParams.toString()}`);
  };

  const handleFilterReset = () => {
    const resetFilters: typeof initialFiltersState = {...initialFiltersState, searchType: 'direct_sale'};
    setActiveFilters(resetFilters);
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('type', 'direct_sale');
    currentParams.delete('category');
    currentParams.delete('offerType');
    currentParams.set('status', 'ACTIVE'); // Default status
    router.push(`/direct-sales?${currentParams.toString()}`);
    setIsFilterSheetOpen(false);
  };

  const filteredAndSortedOffers = useMemo(() => {
    let offers = sampleDirectSaleOffers.filter(offer => {
      // Search Term
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          let searchableText = offer.title.toLowerCase();
          if (offer.description) searchableText += ` ${offer.description.toLowerCase()}`;
          if (offer.sellerName) searchableText += ` ${offer.sellerName.toLowerCase()}`;
          if (offer.id) searchableText += ` ${offer.id.toLowerCase()}`;
          if (!searchableText.includes(term)) return false;
      }
      // Category
      if (activeFilters.category !== 'TODAS' && slugify(offer.category) !== activeFilters.category) {
        return false;
      }
      // Price Range (only for BUY_NOW or if price is defined)
      if (offer.price !== undefined && (offer.price < activeFilters.priceRange[0] || offer.price > activeFilters.priceRange[1])) {
        return false;
      }
      // Location
      if (activeFilters.locations.length > 0) {
        const offerLoc = offer.locationCity && offer.locationState ? `${offer.locationCity} - ${offer.locationState}` : offer.locationState || offer.locationCity;
        if (!offerLoc || !activeFilters.locations.includes(offerLoc)) return false;
      }
      // Seller
      if (activeFilters.sellers.length > 0 && !activeFilters.sellers.includes(offer.sellerName)) {
        return false;
      }
      // Status
      if (activeFilters.status && activeFilters.status.length > 0) {
          if (!offer.status || !activeFilters.status.includes(offer.status as string)) return false;
      }
      // Offer Type
      if (activeFilters.offerType && activeFilters.offerType !== 'ALL' && offer.offerType !== activeFilters.offerType) {
        return false;
      }
      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'createdAt_desc':
        offers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'createdAt_asc':
        offers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price_asc':
        offers.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case 'price_desc':
        offers.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
        break;
      case 'views_desc':
        offers.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      default: // relevance (no specific sort or by ID as fallback)
        offers.sort((a,b) => a.id.localeCompare(b.id));
        break;
    }
    return offers;
  }, [searchTerm, activeFilters, sortBy]);

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('type', 'direct_sale');
    if (searchTerm.trim()) {
        currentParams.set('term', searchTerm.trim());
    } else {
        currentParams.delete('term');
    }
    router.push(`/direct-sales?${currentParams.toString()}`);
  };

  if (isLoading) {
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
        <span className="text-foreground font-medium">Venda Direta</span>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-6 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-primary mb-3" />
          <h1 className="text-3xl font-bold font-headline">Ofertas de Venda Direta</h1>
          <p className="text-muted-foreground mt-2">
            Encontre produtos e serviços com preço fixo ou envie sua proposta.
          </p>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSearchFormSubmit} className="flex flex-col md:flex-row items-center gap-4 mb-6 max-w-3xl mx-auto">
        <div className="relative flex-grow w-full">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Buscar por palavra-chave, ID da oferta..."
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
                        filterContext="directSales"
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
                filterContext="directSales"
            />
        </div>
        
        <main className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card border rounded-lg shadow-sm">
                <p className="text-sm text-muted-foreground">
                    {filteredAndSortedOffers.length} oferta(s) encontrada(s)
                    {searchTerm && ` contendo "${searchTerm}"`}
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                            <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                        {sortOptionsDirectSales.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    {/* View mode toggle can be added here if needed */}
                </div>
            </div>

            {filteredAndSortedOffers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedOffers.map((offer) => (
                <DirectSaleOfferCard key={offer.id} offer={offer} />
                ))}
            </div>
            ) : (
            <Card>
                <CardContent className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">Nenhuma Oferta de Venda Direta Encontrada</h2>
                <p className="text-muted-foreground mb-4">Tente ajustar seus termos de busca ou filtros.</p>
                </CardContent>
            </Card>
            )}
            {/* Placeholder for Pagination */}
            <div className="flex justify-center mt-8">
            <Button variant="outline" disabled>Carregar Mais (Paginação Pendente)</Button>
            </div>
        </main>
      </div>
    </div>
  );
}
