

'use client';
import React from 'react';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Auction, Lot, PlatformSettings, AuctionStage, LotCategory, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import {
  FileText, Heart, Eye, ListChecks, MapPin, Gavel, Tag, CalendarDays, SlidersHorizontal, UserCircle, Briefcase, ExternalLink
} from 'lucide-react';
import { isPast } from 'date-fns';
import { getAuctionStatusText, slugify, getUniqueLotLocations } from '@/lib/sample-data-helpers';
import SearchResultsFrame from '@/components/search-results-frame';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { ActiveFilters } from '@/components/sidebar-filters';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import dynamic from 'next/dynamic';
import SidebarFiltersSkeleton from '@/components/sidebar-filters-skeleton';

const SidebarFilters = dynamic(() => import('@/components/sidebar-filters'), {
  loading: () => <SidebarFiltersSkeleton />,
  ssr: false,
});


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

const initialFiltersState: ActiveFilters = {
  modality: 'TODAS',
  category: 'TODAS', 
  priceRange: [0, 1000000],
  locations: [],
  sellers: [],
  startDate: undefined,
  endDate: undefined,
  status: [],
};


interface AuctionDetailsClientProps {
  auction: Auction;
  auctioneer: AuctioneerProfileInfo | null;
  platformSettings: PlatformSettings;
  allCategories: LotCategory[];
  allSellers: SellerProfileInfo[];
}

export default function AuctionDetailsClient({ auction, auctioneer, platformSettings, allCategories, allSellers }: AuctionDetailsClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [lotSearchTerm, setLotSearchTerm] = useState('');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // State for lot filtering and sorting
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialFiltersState);
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleItemCount, setVisibleItemCount] = useState(platformSettings.searchLoadMoreCount || 12);
  
  const uniqueLocationsForFilter = useMemo(() => getUniqueLotLocations(auction.lots || []), [auction.lots]);
  const sellersForFilter = useMemo(() => allSellers.filter(seller => seller.name === auction.seller), [allSellers, auction.seller]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFilterSubmit = (filters: ActiveFilters) => {
    setActiveFilters(filters);
    setIsFilterSheetOpen(false); 
    setCurrentPage(1);
    setVisibleItemCount(platformSettings.searchLoadMoreCount || 12);
  };
  
  const handleFilterReset = () => {
    setActiveFilters(initialFiltersState);
    setIsFilterSheetOpen(false);
    setCurrentPage(1);
    setVisibleItemCount(platformSettings.searchLoadMoreCount || 12);
  };

  const filteredAndSortedLots = useMemo(() => {
    let lotsToProcess = [...(auction.lots || [])];

    // Filtering
    if (lotSearchTerm) {
      const term = lotSearchTerm.toLowerCase();
      lotsToProcess = lotsToProcess.filter(lot =>
        lot.title.toLowerCase().includes(term) ||
        (lot.description && lot.description.toLowerCase().includes(term))
      );
    }
    
    if (activeFilters.category !== 'TODAS') {
       const categoryForFilter = allCategories.find(c => c.slug === activeFilters.category);
       if(categoryForFilter) {
          lotsToProcess = lotsToProcess.filter(lot => lot.categoryId === categoryForFilter.id || slugify(lot.type) === categoryForFilter.slug);
       }
    }

    if (activeFilters.priceRange[0] > 0 || activeFilters.priceRange[1] < 1000000) {
      lotsToProcess = lotsToProcess.filter(lot => lot.price >= activeFilters.priceRange[0] && lot.price <= activeFilters.priceRange[1]);
    }
    
    if (activeFilters.locations.length > 0) {
      lotsToProcess = lotsToProcess.filter(lot => {
        const lotLocation = `${lot.cityName} - ${lot.stateUf}`;
        return activeFilters.locations.includes(lotLocation);
      });
    }
    
    if (activeFilters.status && activeFilters.status.length > 0) {
      lotsToProcess = lotsToProcess.filter(lot => activeFilters.status.includes(lot.status));
    }


    // Sorting
    return lotsToProcess.sort((a, b) => {
        switch (sortBy) {
            case 'lotNumber_asc':
              return (parseInt(String(a.number || a.id).replace(/\D/g,'')) || 0) - (parseInt(String(b.number || b.id).replace(/\D/g,'')) || 0);
            case 'lotNumber_desc':
              return (parseInt(String(b.number || b.id).replace(/\D/g,'')) || 0) - (parseInt(String(a.number || a.id).replace(/\D/g,'')) || 0);
            case 'endDate_asc':
                return new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime();
            case 'endDate_desc':
                return new Date(b.endDate as string).getTime() - new Date(a.endDate as string).getTime();
            case 'price_asc':
                return a.price - b.price;
            case 'price_desc':
                return b.price - a.price;
            case 'views_desc':
                return (b.views || 0) - (a.views || 0);
            case 'relevance':
            default:
                if (a.status === 'ABERTO_PARA_LANCES' && b.status !== 'ABERTO_PARA_LANCES') return -1;
                if (a.status !== 'ABERTO_PARA_LANCES' && b.status === 'ABERTO_PARA_LANCES') return 1;
                return new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime();
        }
    });
  }, [auction.lots, sortBy, lotSearchTerm, activeFilters, allCategories]);
  
  const paginatedLots = useMemo(() => {
    if (platformSettings.searchPaginationType === 'numberedPages') {
      const startIndex = (currentPage - 1) * (platformSettings.searchItemsPerPage || 12);
      const endIndex = startIndex + (platformSettings.searchItemsPerPage || 12);
      return filteredAndSortedLots.slice(startIndex, endIndex);
    }
    return filteredAndSortedLots.slice(0, visibleItemCount);
  }, [filteredAndSortedLots, currentPage, visibleItemCount, platformSettings]);

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
    setVisibleItemCount(platformSettings.searchLoadMoreCount || 12);
  };
  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const handleLoadMore = () => setVisibleItemCount(prev => Math.min(prev + (platformSettings.searchLoadMoreCount || 12), filteredAndSortedLots.length));

  const renderGridItem = (lot: Lot) => <LotCard lot={lot} auction={auction} platformSettings={platformSettings} />;
  const renderListItem = (lot: Lot) => <LotListItem lot={lot} auction={auction} platformSettings={platformSettings} />;
  
  const displayLocation = auction.city && auction.state ? `${auction.city} - ${auction.state}` : auction.state || auction.city || 'Nacional';

  const auctioneerInitial = auctioneer?.name ? auctioneer.name.charAt(0).toUpperCase() : (auction.auctioneer ? auction.auctioneer.charAt(0).toUpperCase() : '?');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-0">
              <div className="relative aspect-square md:aspect-[3/4] bg-muted">
                <Image
                    src={auction.imageUrl || 'https://placehold.co/400x533.png'}
                    alt={auction.title}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint={auction.dataAiHint || 'imagem leilao'}
                />
                <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5 z-10">
                    <Badge variant="outline" className="bg-background/80 font-semibold">{getAuctionStatusText(auction.status)}</Badge>
                    {auction.isFeaturedOnMarketplace && <Badge className="bg-amber-400 text-amber-900">DESTAQUE</Badge>}
                </div>
              </div>

              <div className="p-6 flex flex-col">
                <Badge variant="outline" className="mb-2 w-fit">{auction.auctionType || 'Leilão'}</Badge>
                <h1 className="text-2xl md:text-3xl font-bold font-headline">{auction.title}</h1>
                <p className="text-muted-foreground mt-2">{auction.description}</p>
                
                <Separator className="my-4"/>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center" title="Categoria">
                        <Tag className="h-4 w-4 mr-2 text-primary"/>
                        <span className="truncate">{auction.category}</span>
                    </div>
                    <div className="flex items-center" title="Localização Principal">
                        <MapPin className="h-4 w-4 mr-2 text-primary"/>
                        <span className="truncate">{displayLocation}</span>
                    </div>
                     <div className="flex items-center" title="Total de Lotes">
                        <ListChecks className="h-4 w-4 mr-2 text-primary"/>
                        <span>{auction.totalLots || 0} Lotes no total</span>
                    </div>
                    <div className="flex items-center" title="Visitas">
                        <Eye className="h-4 w-4 mr-2 text-primary"/>
                        <span>{auction.visits?.toLocaleString('pt-BR') || 0} Visitas</span>
                    </div>
                </div>

                <div className="mt-auto pt-6 flex flex-wrap gap-2">
                    <Button variant="outline">
                        <Heart className="h-4 w-4 mr-2" /> Favoritar Leilão
                    </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          {auctioneer && (
             <Card className="shadow-md">
                <CardHeader className="text-center">
                    <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-primary/30">
                        <AvatarImage src={auctioneer.logoUrl || `https://placehold.co/80x80.png?text=${auctioneerInitial}`} alt={auctioneer.name} data-ai-hint={auctioneer.dataAiHintLogo || "logo leiloeiro"} />
                        <AvatarFallback>{auctioneerInitial}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{auctioneer.name}</CardTitle>
                    <CardDescription className="text-xs">{auctioneer.registrationNumber || 'Leiloeiro Oficial'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={`/auctioneers/${auctioneer.slug || auctioneer.publicId}`}>
                           <Briefcase className="mr-2 h-4 w-4" /> Ver outros leilões
                        </Link>
                    </Button>
                </CardContent>
             </Card>
          )}

          <Card className="shadow-md">
            <CardContent className="p-4 md:p-6">
              <AuctionStagesTimeline 
                  auctionOverallStartDate={new Date(auction.auctionDate as string)}
                  stages={auction.auctionStages || []}
              />
            </CardContent>
          </Card>
           {auction.documentsUrl && (
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Documentos do Leilão</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" asChild className="p-0 h-auto text-primary">
                            <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm">
                                Ver Edital/Documentos <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>

      <Separator />

      <h2 className="text-2xl font-bold font-headline">Lotes do Leilão</h2>
      
      <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
         <aside className="hidden md:block">
           <SidebarFilters
             categories={allCategories}
             locations={uniqueLocationsForFilter}
             sellers={sellersForFilter}
             onFilterSubmit={handleFilterSubmit}
             onFilterReset={handleFilterReset}
             initialFilters={activeFilters}
             filterContext="auctions"
             disableCategoryFilter={true}
           />
         </aside>

         <main>
          <div className="md:hidden mb-4">
              <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtros e Ordenação
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[85vw] max-w-sm">
                    <div className="p-4 h-full overflow-y-auto">
                        <SidebarFilters
                            categories={allCategories}
                            locations={uniqueLocationsForFilter}
                            sellers={sellersForFilter}
                            onFilterSubmit={handleFilterSubmit}
                            onFilterReset={handleFilterReset}
                            initialFilters={activeFilters}
                            filterContext="auctions"
                            disableCategoryFilter={true}
                        />
                    </div>
                </SheetContent>
              </Sheet>
          </div>
          <SearchResultsFrame
              items={paginatedLots}
              totalItemsCount={filteredAndSortedLots.length}
              renderGridItem={renderGridItem}
              renderListItem={renderListItem}
              sortOptions={sortOptionsLots}
              initialSortBy={sortBy}
              onSortChange={handleSortChange}
              platformSettings={platformSettings}
              isLoading={!isClient}
              searchTypeLabel="lotes"
              emptyStateMessage={`Nenhum lote encontrado para o leilão "${auction.title}" com os filtros aplicados.`}
              currentPage={currentPage}
              visibleItemCount={visibleItemCount}
              onPageChange={handlePageChange}
              onLoadMore={handleLoadMore}
          />
         </main>
      </div>

    </div>
  );
}
