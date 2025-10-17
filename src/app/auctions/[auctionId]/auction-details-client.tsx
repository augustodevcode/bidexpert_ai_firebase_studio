// src/app/auctions/[auctionId]/auction-details-client.tsx
/**
 * @fileoverview Componente de cliente que renderiza a página de detalhes de um leilão.
 * Este componente gerencia a interatividade da página, incluindo a busca de lotes,
 * a aplicação de filtros (via SidebarFilters), ordenação e paginação dos resultados.
 * Ele consome dados de leilão, lote e configurações da plataforma para construir uma
 * experiência de navegação rica e responsiva para o usuário final.
 */
'use client'; 
import React from 'react';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Auction, Lot, PlatformSettings, LotCategory, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  FileText, Heart, Eye, ListChecks, MapPin, Gavel, Tag, CalendarDays, SlidersHorizontal, UserCircle, Briefcase, ExternalLink, Pencil
} from 'lucide-react';
import { isPast } from 'date-fns';
import { getAuctionStatusText, slugify, getUniqueLotLocations, getAuctionStatusColor, isValidImageUrl, getActiveStage, getLotPriceForStage } from '@/lib/ui-helpers';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import BidExpertAuctionStagesTimeline from '@/components/auction/auction-stages-timeline';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { ActiveFilters } from '@/components/BidExpertFilter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import dynamic from 'next/dynamic';
import SidebarFiltersSkeleton from '@/components/BidExpertFilterSkeleton';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPermission } from '@/lib/permissions';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';


const BidExpertFilter = dynamic(() => import('@/components/BidExpertFilter'), {
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
  makes: [],
  models: [],
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

  const { userProfileWithPermissions } = useAuth();
  const hasEditPermissions = useMemo(() => 
    hasAnyPermission(userProfileWithPermissions, ['manage_all', 'auctions:update']),
    [userProfileWithPermissions]
  );
  const editUrl = `/admin/auctions/${auction.id}/edit`;

  // State for lot filtering and sorting
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialFiltersState);
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(platformSettings.searchItemsPerPage || 12);
  
  const uniqueLocationsForFilter = useMemo(() => getUniqueLotLocations(auction.lots || []), [auction.lots]);
  const sellersForFilter = useMemo(() => allSellers.filter(seller => seller.name === auction.seller?.name), [allSellers, auction.seller]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFilterSubmit = (filters: ActiveFilters) => {
    setActiveFilters(filters);
    setIsFilterSheetOpen(false); 
    setCurrentPage(1);
  };
  
  const handleFilterReset = () => {
    setActiveFilters(initialFiltersState);
    setIsFilterSheetOpen(false);
    setCurrentPage(1);
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
    if (!platformSettings) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedLots.slice(startIndex, endIndex);
  }, [filteredAndSortedLots, platformSettings, currentPage, itemsPerPage]);


  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };
  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };
  

  const renderGridItem = (lot: Lot) => <BidExpertCard item={lot} type="lot" auction={auction} platformSettings={platformSettings!} />;
  const renderListItem = (lot: Lot) => <BidExpertListItem item={lot} type="lot" auction={auction} platformSettings={platformSettings!} />;
  
  const displayLocation = auction.city && auction.state ? `${auction.city} - ${auction.state}` : auction.state || auction.city || 'Nacional';

  const auctioneerName = auction.auctioneer?.name || auction.auctioneerName;
  const getAuctioneerInitial = () => {
    if (auctioneerName && typeof auctioneerName === 'string') {
      return auctioneerName.charAt(0).toUpperCase();
    }
    return '?';
  };
  const auctioneerInitial = getAuctioneerInitial();

  return (
    <>
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-0">
                <div className="relative aspect-square md:aspect-[3/4] bg-muted">
                  <Image
                      src={auction.imageUrl || 'https://images.unsplash.com/photo-1589307904488-7d60ff29c975?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxsZWlsJUMzJUEzbyUyMGp1ZGljaWFsfGVufDB8fHx8MTc1MTg0NDg4Mnww&ixlib=rb-4.1.0&q=80&w=1080'}
                      alt={auction.title}
                      fill
                      className="object-cover"
                      priority
                      data-ai-hint={auction.dataAiHint || 'imagem leilao'}
                  />
                  <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5 z-10">
                      <Badge variant="outline" className={`bg-background/80 font-semibold ${getAuctionStatusColor(auction.status)}`}>{getAuctionStatusText(auction.status)}</Badge>
                      {auction.isFeaturedOnMarketplace && <Badge className="bg-amber-400 text-amber-900">DESTAQUE</Badge>}
                  </div>
                </div>

                <div className="p-6 flex flex-col">
                  <Badge variant="outline" className="mb-2 w-fit">{auction.auctionType || 'Leilão'}</Badge>
                  <h1 className="text-2xl md:text-3xl font-bold font-headline">{auction.title}</h1>
                  <p className="text-muted-foreground mt-2">{auction.description}</p>
                  
                  <Separator className="my-4"/>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
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

          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 self-start">
            {auctioneer && (
               <Card className="shadow-md">
                  <CardHeader className="text-center">
                      <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-primary/30">
                          <AvatarImage src={auctioneer.logoUrl || `https://placehold.co/80x80.png?text=${auctioneerInitial}`} alt={auctioneerName || ''} data-ai-hint={auctioneer.dataAiHintLogo || 'logo leiloeiro'} />
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
                <BidExpertAuctionStagesTimeline
                    auctionOverallStartDate={new Date(auction.auctionDate as string)}
                    stages={auction.auctionStages || []}
                    variant="extended"
                />
              </CardContent>
            </Card>
             {auction.documentsUrl && (
                  <Card className="shadow-md">
                      <CardHeader className="p-3">
                          <CardTitle className="text-md font-semibold flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" /> Documentos do Leilão</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                          <Button variant="link" asChild className="p-0 h-auto text-primary">
                              <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm">
                                  Ver Edital Completo <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                              </a>
                          </Button>
                      </CardContent>
                  </Card>
              )}
          </div>
        </div>

        <Separator />

        <h2 className="text-2xl font-bold font-headline">Lotes do Leilão ({auction.totalLots || auction.lots?.length || 0})</h2>
        
        <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8 items-start">
           <aside className="hidden md:block sticky top-24 h-fit">
             <BidExpertFilter
               categories={allCategories}
               locations={uniqueLocationsForFilter}
               sellers={sellersForFilter.map(s => s.name)}
               onFilterSubmit={handleFilterSubmit}
               onFilterReset={handleFilterReset}
               initialFilters={activeFilters}
               filterContext="lots"
             />
           </aside>

           <main className="min-w-0 space-y-6 md:ml-4">
            <BidExpertSearchResultsFrame
                items={paginatedLots}
                totalItemsCount={filteredAndSortedLots.length}
                renderGridItem={renderGridItem}
                renderListItem={renderListItem}
                sortOptions={sortOptionsLots}
                initialSortBy={sortBy}
                onSortChange={handleSortChange}
                platformSettings={platformSettings!}
                isLoading={!isClient}
                searchTypeLabel="lotes"
                emptyStateMessage={`Nenhum lote encontrado para o leilão "${auction.title}" com os filtros aplicados.`}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
           </main>
        </div>

      </div>
      {hasEditPermissions && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild className="fixed bottom-16 right-5 z-50 h-14 w-14 rounded-full shadow-lg" size="icon">
                <Link href={editUrl}>
                  <Pencil className="h-6 w-6" />
                  <span className="sr-only">Editar Leilão</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Editar Leilão</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
}
