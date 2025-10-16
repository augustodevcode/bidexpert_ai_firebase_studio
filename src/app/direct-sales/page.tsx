// src/app/direct-sales/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, LayoutGrid, List, SlidersHorizontal, Loader2, Search as SearchIcon, FileText as TomadaPrecosIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import type { ActiveFilters } from '@/components/BidExpertFilter'; 
import type { DirectSaleOffer, LotCategory, DirectSaleOfferType, PlatformSettings, SellerProfileInfo } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchResultsFrame from '@/components/search-results-frame';
import dynamic from 'next/dynamic';
import BidExpertFilterSkeleton from '@/components/BidExpertFilterSkeleton';
import { getLotCategories as getCategories } from '@/app/admin/categories/actions';
import { getDirectSaleOffers } from '@/app/direct-sales/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import UniversalCard from '@/components/universal-card';
import UniversalListItem from '@/components/universal-list-item';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';


const BidExpertFilter = dynamic(() => import('@/components/BidExpertFilter'), {
  loading: () => <BidExpertFilterSkeleton />,
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


const initialFiltersState: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL' } = {
  modality: 'TODAS', 
  category: 'TODAS', 
  priceRange: [0, 1000000],
  locations: [],
  sellers: [],
  makes: [],
  models: [],
  startDate: undefined,
  endDate: undefined,
  status: ['ACTIVE'], 
  offerType: 'ALL',
};


export default function DirectSalesPage() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  
  const [allOffers, setAllOffers] = useState<DirectSaleOffer[]>([]);
  const [allCategoriesForFilter, setAllCategoriesForFilter] = useState<LotCategory[]>([]);
  const [uniqueLocationsForFilter, setUniqueLocationsForFilter] = useState<string[]>([]);
  const [uniqueSellersForFilter, setUniqueSellersForFilter] = useState<string[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortByState] = useState<string>('relevance');
  
  const [activeFilters, setActiveFilters] = useState<ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL' }>(() => {
    const initial: typeof initialFiltersState = {...initialFiltersState};
    if (searchParamsHook.get('category')) initial.category = searchParamsHook.get('category')!;
    if (searchParamsHook.get('offerType')) initial.offerType = searchParamsHook.get('offerType') as any;
    if (searchParamsHook.get('status')) initial.status = [searchParamsHook.get('status')!.toUpperCase()];
    return initial;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterDataLoading, setIsFilterDataLoading] = useState(true);

  useEffect(() => {
    async function fetchSharedData() {
      setIsFilterDataLoading(true);
      try {
        const [categories, offers, sellers, settings] = await Promise.all([
          getCategories(),
          getDirectSaleOffers(),
          getSellers(),
          getPlatformSettings(),
        ]);
        
        setAllOffers(offers);
        setAllCategoriesForFilter(categories);
        setPlatformSettings(settings as PlatformSettings);

        const locations = new Set<string>();
        offers.forEach(offer => {
          if (offer.locationCity && offer.locationState) locations.add(`${offer.locationCity} - ${offer.locationState}`);
          else if (offer.locationCity) locations.add(offer.locationCity);
          else if (offer.locationState) locations.add(offer.locationState);
        });
        setUniqueLocationsForFilter(Array.from(locations).sort());
        
        setUniqueSellersForFilter(sellers.map(s => s.name).sort());

      } catch (error) {
        console.error("Error fetching data for direct sales:", error);
      } finally {
        setIsFilterDataLoading(false);
        setIsLoading(false);
      }
    }
    fetchSharedData();
  }, []);
  
  const handleFilterSubmit = (filters: ActiveFilters & { offerType?: DirectSaleOfferType | 'ALL'; }) => {
    setActiveFilters(prev => ({...prev, ...filters}));
    setIsFilterSheetOpen(false); 
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    currentParams.set('category', filters.category);
    if (filters.offerType) currentParams.set('offerType', filters.offerType); else currentParams.delete('offerType');
    if (filters.status && filters.status.length > 0) currentParams.set('status', filters.status.join(',')); else currentParams.delete('status');
    router.push(`/direct-sales?${currentParams.toString()}`);
  };

  const handleFilterReset = () => {
    setActiveFilters({...initialFiltersState});
    router.push('/direct-sales');
    setIsFilterSheetOpen(false);
  };

  const filteredAndSortedOffers = useMemo(() => {
    let offers = allOffers.filter(offer => {
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const searchableText = `${offer.title.toLowerCase()} ${offer.description?.toLowerCase() || ''} ${offer.sellerName?.toLowerCase() || ''} ${offer.id}`;
          if (!searchableText.includes(term)) return false;
      }
      if (activeFilters.category !== 'TODAS' && slugify(offer.category || '') !== activeFilters.category) {
        return false;
      }
      if (offer.price !== undefined && offer.price !== null && (offer.price < activeFilters.priceRange[0] || offer.price > activeFilters.priceRange[1])) {
        return false;
      }
      if (activeFilters.locations.length > 0) {
        const offerLoc = offer.locationCity && offer.locationState ? `${offer.locationCity} - ${offer.locationState}` : offer.locationState || offer.locationCity;
        if (!offerLoc || !activeFilters.locations.includes(offerLoc)) return false;
      }
      if (activeFilters.sellers.length > 0 && !activeFilters.sellers.includes(offer.sellerName)) {
        return false;
      }
       if (activeFilters.status && activeFilters.status.length > 0 && (!offer.status || !activeFilters.status.includes(offer.status as string))) {
         return false;
       }
      if (activeFilters.offerType && activeFilters.offerType !== 'ALL' && offer.offerType !== activeFilters.offerType) {
        return false;
      }
      return true;
    });

    switch (sortBy) {
      case 'createdAt_desc': offers.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()); break;
      case 'createdAt_asc': offers.sort((a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime()); break;
      case 'price_asc': offers.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)); break;
      case 'price_desc': offers.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity)); break;
      case 'views_desc': offers.sort((a, b) => (b.views || 0) - (a.views || 0)); break;
      default: break;
    }
    return offers;
  }, [searchTerm, activeFilters, sortBy, allOffers]);
  
  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentParams = new URLSearchParams(Array.from(searchParamsHook.entries()));
    if (searchTerm.trim()) {
        currentParams.set('term', searchTerm.trim());
    } else {
        currentParams.delete('term');
    }
    router.push(`/direct-sales?${currentParams.toString()}`);
  };

  const renderGridItem = (item: DirectSaleOffer) => <UniversalCard item={item} type="direct_sale" platformSettings={platformSettings!} />;
  const renderListItem = (item: DirectSaleOffer) => <UniversalListItem item={item} type="direct_sale" platformSettings={platformSettings!} />;

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
        <span className="text-foreground font-medium">Venda Direta</span>
      </div>

      <Card className="shadow-lg p-6 bg-secondary/30">
        <div className="text-center mb-6">
          <ShoppingCart className="h-12 w-12 mx-auto text-primary mb-3" />
          <h1 className="text-3xl font-bold font-headline">Ofertas de Venda Direta</h1>
          <p className="text-muted-foreground mt-2">
            Encontre produtos e serviços com preço fixo ou envie sua proposta.
          </p>
        </div>
        <form onSubmit={handleSearchFormSubmit} className="flex flex-col md:flex-row items-center gap-4 w-full max-w-2xl mx-auto">
            <div className="relative flex-grow w-full">
                <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Buscar ofertas por palavra-chave..."
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
             <BidExpertFilter
                categories={allCategoriesForFilter}
                locations={uniqueLocationsForFilter}
                sellers={uniqueSellersForFilter}
                onFilterSubmit={handleFilterSubmit as any}
                onFilterReset={handleFilterReset}
                initialFilters={activeFilters as ActiveFilters}
                filterContext="directSales"
            />
        </aside>
        
        <main className="min-w-0 space-y-6 md:ml-4">
            <SearchResultsFrame
              items={filteredAndSortedOffers}
              totalItemsCount={filteredAndSortedOffers.length}
              renderGridItem={renderGridItem}
              renderListItem={renderListItem}
              sortOptions={sortOptionsDirectSales}
              initialSortBy={sortBy}
              onSortChange={setSortByState}
              platformSettings={platformSettings}
              isLoading={isLoading}
              searchTypeLabel="ofertas"
              emptyStateMessage="Nenhuma oferta de venda direta encontrada com os filtros aplicados."
            />
        </main>
      </div>
    </div>
  );
}
