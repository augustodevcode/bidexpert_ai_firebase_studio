// src/app/auctions/[auctionId]/auction-details-client-v2.tsx
/**
 * @fileoverview Página de detalhes de leilão V2 com abas, hero aprimorado e stats.
 * Mantém funcionalidades V1 mas com layout e UX melhorado.
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Auction, Lot, PlatformSettings, LotCategory, SellerProfileInfo, AuctioneerProfileInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  FileText, Heart, MapPin, ListChecks, Briefcase, ExternalLink, Pencil,
  SlidersHorizontal, Loader2, Eye, Share2, ArrowLeft, ArrowRight, X, Facebook,
  MessageSquareText, Mail
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPermission } from '@/lib/permissions';
import { isPast } from 'date-fns';
import { getAuctionStatusText, slugify, getUniqueLotLocations, getAuctionStatusColor, isValidImageUrl, getActiveStage, getLotPriceForStage } from '@/lib/ui-helpers';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';
import type { ActiveFilters } from '@/components/BidExpertFilter';
import SidebarFiltersSkeleton from '@/components/BidExpertFilterSkeleton';
import HeroSection from './components/hero-section';
import AuctionStatsCard from './components/auction-stats-card';
import BidExpertAuctionStagesTimeline from '@/components/auction/BidExpertAuctionStagesTimeline';
import { useFloatingActions } from '@/components/floating-actions/floating-actions-provider';
import GoToLiveAuctionButton from '@/components/auction/go-to-live-auction-button';

const SidebarFilter = dynamic(() => import('@/components/BidExpertFilter'), {
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

interface AuctionDetailsClientV2Props {
  auction: Auction;
  auctioneer: AuctioneerProfileInfo | null;
  platformSettings: PlatformSettings;
  allCategories: LotCategory[];
  allSellers: SellerProfileInfo[];
}

export default function AuctionDetailsClientV2({
  auction,
  auctioneer,
  platformSettings,
  allCategories,
  allSellers,
}: AuctionDetailsClientV2Props) {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorited, setIsFavorited] = useState(false);
  const [lotSearchTerm, setLotSearchTerm] = useState('');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialFiltersState);
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(platformSettings.searchItemsPerPage || 12);

  const { userProfileWithPermissions } = useAuth();
  const { setPageActions } = useFloatingActions();
  const hasEditPermissions = useMemo(
    () => hasAnyPermission(userProfileWithPermissions, ['manage_all', 'auctions:update']),
    [userProfileWithPermissions]
  );

  useEffect(() => {
    if (!hasEditPermissions) {
      setPageActions([]);
      return;
    }

    setPageActions([
      {
        id: 'edit-auction',
        label: 'Editar Leilão',
        href: `/admin/auctions/${auction.id}/edit`,
        icon: Pencil,
        dataAiId: 'floating-action-edit-auction',
      },
    ]);

    return () => setPageActions([]);
  }, [auction.id, hasEditPermissions, setPageActions]);
  const uniqueLocationsForFilter = useMemo(() => getUniqueLotLocations(auction.lots || []), [auction.lots]);
  const sellersForFilter = useMemo(
    () => allSellers.filter(seller => seller.name === auction.seller?.name),
    [allSellers, auction.seller]
  );

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

    if (lotSearchTerm) {
      const term = lotSearchTerm.toLowerCase();
      lotsToProcess = lotsToProcess.filter(lot =>
        lot.title.toLowerCase().includes(term) ||
        (lot.description && lot.description.toLowerCase().includes(term))
      );
    }

    if (activeFilters.category !== 'TODAS') {
      const categoryForFilter = allCategories.find(c => c.slug === activeFilters.category);
      if (categoryForFilter) {
        lotsToProcess = lotsToProcess.filter(
          lot => lot.categoryId === categoryForFilter.id || slugify(lot.type) === categoryForFilter.slug
        );
      }
    }

    if (activeFilters.priceRange[0] > 0 || activeFilters.priceRange[1] < 1000000) {
      lotsToProcess = lotsToProcess.filter(
        lot => lot.price >= activeFilters.priceRange[0] && lot.price <= activeFilters.priceRange[1]
      );
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

    return lotsToProcess.sort((a, b) => {
      const getDateForSort = (date: Date | null | undefined) => {
        return date ? new Date(date).getTime() : 0;
      };

      switch (sortBy) {
        case 'lotNumber_asc':
          return (parseInt(String(a.number || a.id).replace(/\D/g, '')) || 0) - (parseInt(String(b.number || b.id).replace(/\D/g, '')) || 0);
        case 'lotNumber_desc':
          return (parseInt(String(b.number || b.id).replace(/\D/g, '')) || 0) - (parseInt(String(a.number || a.id).replace(/\D/g, '')) || 0);
        case 'endDate_asc':
          return getDateForSort(a.endDate) - getDateForSort(b.endDate);
        case 'endDate_desc':
          return getDateForSort(b.endDate) - getDateForSort(a.endDate);
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
          return getDateForSort(a.endDate) - getDateForSort(b.endDate);
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

  const renderGridItem = (lot: Lot) => (
    <BidExpertCard
      item={lot}
      type="lot"
      platformSettings={platformSettings!}
      parentAuction={auction}
    />
  );

  const renderListItem = (lot: Lot) => (
    <BidExpertListItem
      item={lot}
      type="lot"
      platformSettings={platformSettings!}
      parentAuction={auction}
    />
  );

  // Get location from lot or use a generic location string
  const getLotDisplayLocation = (lot: Lot) => {
    if (lot.stateId) {
      return lot.stateId; // Assuming stateId is the state
    }
    return 'Nacional';
  };
  const auctioneerName = auction.auctioneer?.name || auction.auctioneerName;
  const getAuctioneerInitial = () => {
    if (auctioneerName && typeof auctioneerName === 'string') {
      return auctioneerName.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <>
      <div className="space-y-8">
        {/* Hero Section V2 */}
        <HeroSection
          auction={auction}
          isFavorited={isFavorited}
          onFavorite={() => setIsFavorited(!isFavorited)}
          onShare={() => {/* TODO: Implement share logic */}}
        />

        {/* Stats Card */}
        <AuctionStatsCard auction={auction} />

        {/* Tabs Container */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="lots" className="relative">
              Lotes
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {auction.totalLots || auction.lots?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="qa" className="hidden lg:block">Perguntas</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Sobre o Leilão</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <p>{auction.description || 'Sem descrição disponível'}</p>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Cronograma de Praças
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BidExpertAuctionStagesTimeline
                      auctionOverallStartDate={auction.auctionDate instanceof Date ? auction.auctionDate : new Date(auction.auctionDate || new Date())}
                      stages={auction.auctionStages || []}
                      variant="extended"
                      auction={auction}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <aside className="space-y-6">
                {/* Auctioneer Card */}
                {auctioneer && (
                  <Card className="shadow-md">
                    <CardHeader className="text-center">
                      <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-primary/30">
                        <AvatarImage
                          src={auctioneer.logoUrl || `https://placehold.co/80x80.png?text=${getAuctioneerInitial()}`}
                          alt={auctioneerName || ''}
                          data-ai-hint={auctioneer.dataAiHintLogo || 'logo leiloeiro'}
                        />
                        <AvatarFallback>{getAuctioneerInitial()}</AvatarFallback>
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

                {/* Documents */}
                {auction.documentsUrl && (
                  <Card className="shadow-md">
                    <CardHeader className="p-3">
                      <CardTitle className="text-md font-semibold flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-primary" /> Documentos
                      </CardTitle>
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

                <GoToLiveAuctionButton
                  auction={auction}
                  className="w-full"
                  variant="default"
                  label="Ir para pregão online"
                  dataAiId="auction-details-v2-go-live-btn"
                />
              </aside>
            </div>
          </TabsContent>

          {/* TAB 2: LOTS */}
          <TabsContent value="lots" className="mt-6">
            <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-8 items-start">
              {/* Sidebar Filters (Desktop) */}
              <aside className="hidden md:block sticky top-24 h-fit">
                <SidebarFilter
                  categories={allCategories}
                  locations={uniqueLocationsForFilter}
                  sellers={sellersForFilter.map(s => s.name)}
                  onFilterSubmit={handleFilterSubmit}
                  onFilterReset={handleFilterReset}
                  initialFilters={activeFilters}
                  filterContext="lots"
                />
              </aside>

              {/* Lots Grid/List (Mobile: Filters in Sheet) */}
              <main className="min-w-0 space-y-6 md:ml-4">
                {/* Mobile Filter Button */}
                <div className="md:hidden">
                  <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtros
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full sm:w-80">
                      <SidebarFilter
                        categories={allCategories}
                        locations={uniqueLocationsForFilter}
                        sellers={sellersForFilter.map(s => s.name)}
                        onFilterSubmit={handleFilterSubmit}
                        onFilterReset={handleFilterReset}
                        initialFilters={activeFilters}
                        filterContext="lots"
                      />
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Results */}
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
          </TabsContent>

          {/* TAB 3: INFO */}
          <TabsContent value="info" className="mt-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Informações Legais e Documentação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Leilão</p>
                    <p className="font-semibold">{auction.auctionType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold">{getAuctionStatusText(auction.status) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Leilão</p>
                    <p className="font-semibold">{auction.auctionDate instanceof Date ? auction.auctionDate.toLocaleDateString('pt-BR') : new Date(auction.auctionDate || new Date()).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Lotes</p>
                    <p className="font-semibold">{auction.totalLots || 0}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Documentos</p>
                  {auction.documentsUrl ? (
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                      <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" /> Download Edital
                      </a>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum documento disponível</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Q&A */}
          <TabsContent value="qa" className="mt-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Perguntas e Respostas</CardTitle>
                <CardDescription>Espaço para dúvidas sobre o leilão</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Esta funcionalidade será habilitada em breve. Acompanhe as atualizações!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </>
  );
}
