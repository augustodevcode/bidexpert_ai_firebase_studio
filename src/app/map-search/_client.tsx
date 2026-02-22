'use client';

import { Suspense, useState, useEffect, useMemo, useCallback, useDeferredValue, useRef, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { LatLngBounds } from 'leaflet';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Minimize2, Compass, Zap, Signal, Filter, MapPin, Tag, DollarSign, X } from 'lucide-react';
import MapSearchSidebar from '@/components/map-search-sidebar';
import type { Lot, Auction, PlatformSettings, DirectSaleOffer } from '@/types';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getDirectSaleOffers } from '@/app/direct-sales/actions';
import {
  resolveDatasetFromParam,
  selectDatasetItems,
  filterBySearchTerm,
  filterByVisibleIds,
  type MapSearchDataset,
} from '@/app/map-search/map-search-logic';
import { describeRelativeTimestamp, persistMapCacheSnapshot, readMapCacheSnapshot } from '@/app/map-search/map-search-cache';

const MapSearchComponent = dynamic(() => import('@/components/map-search-component'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-lg" />,
});

const DEFAULT_CENTER: [number, number] = [-14.235, -51.9253];

const DATASET_METADATA: Record<MapSearchDataset, { label: string; helper: string }> = {
  lots: { label: 'Lotes em Leilão', helper: 'Todos os lotes ativos dentro do recorte atual.' },
  direct_sale: { label: 'Venda Direta', helper: 'Ofertas com compra imediata e propostas.' },
  tomada_de_precos: { label: 'Tomada de Preços', helper: 'Processos especiais com negociação assistida.' },
};

function formatSummaryLabel(count: number) {
  return `${count} ${count === 1 ? 'resultado' : 'resultados'}`;
}

function getMapSearchItemKey(item: Lot | Auction | DirectSaleOffer, listItemType: 'lot' | 'auction' | 'direct_sale') {
  return `${listItemType}:${item.id}`;
}

function MapSearchPageContent() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  const cacheSnapshot = useMemo(() => readMapCacheSnapshot(), []);
  const warmCacheRef = useRef<boolean>(Boolean(cacheSnapshot.lots || cacheSnapshot.auctions || cacheSnapshot.directSales));

  const [allAuctions, setAllAuctions] = useState<Auction[]>(cacheSnapshot.auctions ?? []);
  const [allLots, setAllLots] = useState<Lot[]>(cacheSnapshot.lots ?? []);
  const [allDirectSales, setAllDirectSales] = useState<DirectSaleOffer[]>(cacheSnapshot.directSales ?? []);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(cacheSnapshot.settings ?? null);

  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [searchType, setSearchType] = useState<MapSearchDataset>(resolveDatasetFromParam(searchParamsHook.get('type')));
  const [isLoading, setIsLoading] = useState(!warmCacheRef.current);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(4);
  const [visibleItemIds, setVisibleItemIds] = useState<string[] | null>(null);
  const [fitBoundsSignal, setFitBoundsSignal] = useState(0);
  const [activeBounds, setActiveBounds] = useState<LatLngBounds | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(cacheSnapshot.lastUpdatedAt);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [hoveredItemKey, setHoveredItemKey] = useState<string | null>(null);

  // Advanced Filters
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');

  const boundsAnimationFrame = useRef<number | null>(null);
  const visibilityFrame = useRef<number | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(13);
        },
        () => {
          setMapCenter(DEFAULT_CENTER);
          setMapZoom(4);
        },
        { timeout: 5000 },
      );
    }
  }, []);

  const fetchDatasets = useCallback(async ({ silent }: { silent?: boolean } = {}) => {
    const runSilently = silent ?? false;
    setError(null);
    if (runSilently) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Call actions with correct signatures for public access
      // getAuctions(isPublicCall: boolean)
      // getLots(filter, isPublicCall: boolean)
      // getDirectSaleOffers() - no args in definition
      const [auctionsResult, lotsResult, settingsResult, directSalesResult] = await Promise.all([
        getAuctions(true), 
        getLots(undefined, true),
        getPlatformSettings(),
        getDirectSaleOffers(),
      ]);

      // Handle potential serialized responses or direct arrays
      // Note: Actions might return arrays directly or { success, data } depending on implementation update.
      // Based on current analysis, getAuctions returns Auction[] directly.
      // But _client code handles { success, auctions } wrapper?
      // Wait, _client.tsx lines 114-123 check for .success and .auctions.
      // BUT getAuctions action returns Promise<Auction[]>.
      // THIS IS A MAJOR BUG in _client.tsx. It expects { success: true, auctions: [...] } but gets [...].
      
      // I must fix _client.tsx to handle the actual return types of the actions.
      
      const auctions = Array.isArray(auctionsResult) ? auctionsResult : (auctionsResult as any).auctions ?? [];
      const lots = Array.isArray(lotsResult) ? lotsResult : (lotsResult as any).lots ?? [];
      const settings = (settingsResult as any).success ? (settingsResult as any).settings : settingsResult; 
      const directSales = Array.isArray(directSalesResult) ? directSalesResult : (directSalesResult as any).offers ?? [];

      if (auctions) setAllAuctions(auctions);
      if (lots) setAllLots(lots);
      if (settings) setPlatformSettings(settings); // Settings might be object
      if (directSales) setAllDirectSales(directSales);

      // Also persist to cache with correct structure
      const now = Date.now();
      setLastUpdatedAt(now);

      persistMapCacheSnapshot({
        auctions: auctions,
        lots: lots,
        directSales: directSales,
        settings: settings || null,
        lastUpdatedAt: now,
      });
    } catch (err) {
      console.error('[MAP SEARCH] Error fetching datasets:', err);
      setError('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!warmCacheRef.current) {
      fetchDatasets();
    }
  }, [fetchDatasets]);

  const handleDatasetChange = useCallback((newDataset: MapSearchDataset) => {
    setSearchType(newDataset);
    setVisibleItemIds(null);
    setActiveBounds(null);
  }, []);

  const triggerFitBounds = useCallback(() => {
    setFitBoundsSignal((prev) => prev + 1);
    setVisibleItemIds(null);
    setActiveBounds(null);
    setLocationFilter('');
    setCategoryFilter('all');
    setPriceMin('');
    setPriceMax('');
  }, []);

  const handleBoundsChange = useCallback((bounds: LatLngBounds | null) => {
    if (boundsAnimationFrame.current) {
      cancelAnimationFrame(boundsAnimationFrame.current);
    }
    boundsAnimationFrame.current = requestAnimationFrame(() => {
      setActiveBounds(bounds);
    });
  }, []);

  const handleVisibleItemsChange = useCallback((ids: string[] | null) => {
    if (visibilityFrame.current) {
      cancelAnimationFrame(visibilityFrame.current);
    }
    visibilityFrame.current = requestAnimationFrame(() => {
      setVisibleItemIds(ids);
    });
  }, []);

  useEffect(() => {
    const handleSyntheticEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string[] | null>;
      handleVisibleItemsChange(customEvent.detail);
    };
    const handleBoundsEvent = (e: Event) => {
      const customEvent = e as CustomEvent<LatLngBounds | null>;
      handleBoundsChange(customEvent.detail);
    };
    window.addEventListener('bidexpert-map-bounds', handleBoundsEvent as EventListener);
    window.addEventListener('bidexpert-map-visible-ids', handleSyntheticEvent as EventListener);
    return () => {
      window.removeEventListener('bidexpert-map-bounds', handleBoundsEvent as EventListener);
      window.removeEventListener('bidexpert-map-visible-ids', handleSyntheticEvent as EventListener);
    };
  }, [handleVisibleItemsChange, handleBoundsChange]);

  const datasetItems = useMemo(
    () => (isLoading && !warmCacheRef.current ? [] : selectDatasetItems({ dataset: searchType, lots: allLots, auctions: allAuctions, directSales: allDirectSales })),
    [allAuctions, allDirectSales, allLots, isLoading, searchType],
  );

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredVisibleIds = useDeferredValue(visibleItemIds);

  const searchMatchingItems = useMemo(() => filterBySearchTerm(datasetItems, deferredSearchTerm), [datasetItems, deferredSearchTerm]);

  const advancedFilteredItems = useMemo(() => {
    let items = searchMatchingItems;

    if (locationFilter) {
      const term = locationFilter.toLowerCase();
      items = items.filter(item => {
        const loc = (item as any).locationCity || (item as any).cityName || (item as any).city || '';
        const uf = (item as any).locationState || (item as any).stateUf || (item as any).state || '';
        return loc.toLowerCase().includes(term) || uf.toLowerCase().includes(term);
      });
    }

    if (categoryFilter && categoryFilter !== 'all') {
      const term = categoryFilter.toLowerCase();
      items = items.filter(item => {
        const cat = (item as any).category || (item as any).categoryName || '';
        return cat.toLowerCase().includes(term);
      });
    }

    if (priceMin) {
      const min = Number(priceMin);
      items = items.filter(item => {
        const price = Number((item as any).currentBid || (item as any).startingBid || (item as any).price || 0);
        return price >= min;
      });
    }

    if (priceMax) {
      const max = Number(priceMax);
      items = items.filter(item => {
        const price = Number((item as any).currentBid || (item as any).startingBid || (item as any).price || 0);
        return price <= max;
      });
    }

    return items;
  }, [searchMatchingItems, locationFilter, categoryFilter, priceMin, priceMax]);

  const displayedItems = useMemo(() => filterByVisibleIds(advancedFilteredItems, deferredVisibleIds), [advancedFilteredItems, deferredVisibleIds]);

  const resultsLabel = formatSummaryLabel(displayedItems.length);
  const mapItemType: 'lot' | 'auction' | 'direct_sale' = searchType === 'lots' ? 'lot' : searchType === 'direct_sale' ? 'direct_sale' : 'auction';
  const listItemType: 'lot' | 'auction' | 'direct_sale' = searchType === 'lots' ? 'lot' : searchType === 'direct_sale' ? 'direct_sale' : 'auction';

  const handleListItemHover = useCallback((item: Lot | Auction | DirectSaleOffer) => {
    setHoveredItemKey(getMapSearchItemKey(item, listItemType));
  }, [listItemType]);

  const handleListItemHoverEnd = useCallback(() => {
    setHoveredItemKey(null);
  }, []);

  const datasetMeta = DATASET_METADATA[searchType];
  const lastUpdatedLabel = describeRelativeTimestamp(lastUpdatedAt);
  const mapStatus = isRefreshing ? 'Sincronizando dados em tempo real…' : lastUpdatedLabel ?? 'Aguardando sincronização';

  const handleModalToggle = (nextState: boolean) => {
    setIsModalOpen(nextState);
    if (!nextState) {
      router.back();
    } else if (typeof window !== 'undefined') {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 220);
    }
  };

  const handleSearch = useCallback((e: FormEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Dialog open={isModalOpen} onOpenChange={handleModalToggle}>
      <DialogContent className="h-[100vh] w-[100vw] max-w-none border-0 bg-background/95 p-0 shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>Mapa Inteligente BidExpert</DialogTitle>
        </VisuallyHidden>
        <div className="flex h-full flex-col">
          {/* Header Section */}
          <header className="relative h-[160px] w-full overflow-hidden">
            <Image 
              src="/uploads/sample-images/image1.png" 
              alt="Mapa inteligente BidExpert" 
              fill 
              className="object-cover" 
              priority 
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
            <div className="relative z-10 flex h-full items-center justify-between px-8">
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-bold text-foreground">Mapa Inteligente BidExpert</h1>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-border/40 bg-surface/80">{datasetMeta.label}</Badge>
                  <Badge variant="outline" className="border-border/40 bg-surface/80">{resultsLabel}</Badge>
                  {activeBounds && (
                    <Badge variant="outline" className="border-border/40 bg-surface/80">
                      <Zap className="mr-1 h-3.5 w-3.5" /> Área filtrada
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleModalToggle(false)} className="h-12 w-12" data-ai-id="map-search-close-btn">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Filters Bar */}
          <div className="border-t border-border/40 bg-panel/70 px-8 py-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cidade ou Estado" 
                  className="pl-9 bg-background/50 border-border/60" 
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="pl-9 bg-background/50 border-border/60">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="veiculo">Veículos</SelectItem>
                    <SelectItem value="imovel">Imóveis</SelectItem>
                    <SelectItem value="equipamento">Equipamentos</SelectItem>
                    <SelectItem value="informatica">Informática</SelectItem>
                    <SelectItem value="judicial">Judicial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    placeholder="Preço mín" 
                    className="pl-9 bg-background/50 border-border/60" 
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                </div>
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    placeholder="Preço máx" 
                    className="pl-9 bg-background/50 border-border/60" 
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={triggerFitBounds}
                className="border-border/60 bg-background/50"
              >
                <Filter className="mr-2 h-4 w-4" /> Limpar filtros
              </Button>
            </div>
          </div>

          {/* Main Content - 70/30 Split */}
          <div className="flex-1 overflow-hidden p-6">
            <div className="grid h-full gap-6 xl:grid-cols-[7fr_3fr]">
              {/* Map Section - 70% */}
              <div className="relative order-2 xl:order-1 flex min-h-[560px] flex-1 rounded-[2.5rem] border border-border/40 bg-surface/60 shadow-haze">
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-map-panel opacity-50" aria-hidden />
                <div className="absolute top-5 right-5 z-10 flex flex-wrap gap-3">
                  <Button variant="mapGhost" size="sm" onClick={triggerFitBounds} className="h-10">
                    <Compass className="mr-2 h-4 w-4" /> Recentrar mapa
                  </Button>
                </div>
                <div className="absolute bottom-5 left-6 z-10 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="border-border/40 bg-background/40">
                    <Signal className="mr-1 h-3.5 w-3.5" /> {mapStatus}
                  </Badge>
                </div>
                <div className="relative z-0 h-full w-full rounded-[2.5rem] overflow-hidden">
                  <MapSearchComponent
                    items={advancedFilteredItems}
                    itemType={mapItemType}
                    mapCenter={mapCenter}
                    mapZoom={mapZoom}
                    onBoundsChange={handleBoundsChange}
                    onItemsInViewChange={handleVisibleItemsChange}
                    fitBoundsSignal={fitBoundsSignal}
                    mapSettings={platformSettings?.mapSettings ?? null}
                    platformSettings={platformSettings}
                    hoveredItemKey={hoveredItemKey}
                  />
                </div>
              </div>

              {/* Sidebar Section - 30% */}
              <div className="order-1 xl:order-2 h-full">
                <MapSearchSidebar
                  searchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  onSubmitSearch={handleSearch}
                  dataset={searchType}
                  onDatasetChange={handleDatasetChange}
                  isLoading={isLoading}
                  error={error}
                  platformSettings={platformSettings}
                  displayedItems={displayedItems}
                  resultsLabel={`${resultsLabel} · ${datasetMeta.label}`}
                  visibleItemIds={visibleItemIds}
                  activeBounds={activeBounds}
                  onResetFilters={triggerFitBounds}
                  listItemType={listItemType}
                  lastUpdatedLabel={lastUpdatedLabel}
                  isRefreshingDatasets={isRefreshing}
                  onForceRefresh={() => fetchDatasets({ silent: true })}
                  isUsingCache={Boolean(lastUpdatedAt)}
                  listDensity="map"
                  hoveredItemKey={hoveredItemKey}
                  onItemHover={handleListItemHover}
                  onItemHoverEnd={handleListItemHoverEnd}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MapSearchFallback() {
  return (
    <div className="flex h-[calc(100vh-var(--header-height,160px)-1rem)] items-center justify-center">
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  );
}

export default function MapSearchPageClient() {
  return (
    <Suspense fallback={<MapSearchFallback />}>
      <MapSearchPageContent />
    </Suspense>
  );
}
