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
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
      <DialogContent className="content-map-search-dialog" data-ai-id="map-search-dialog">
        <div className="wrapper-map-search-layout" data-ai-id="map-search-layout">
          {/* Header Section */}
          <header className="header-map-search" data-ai-id="map-search-header">
            <Image 
              src="/uploads/sample-images/image1.png" 
              alt="Mapa inteligente BidExpert" 
              fill 
              className="img-map-search-header"
              priority 
            />
            <div className="overlay-map-search-header" />
            <div className="container-map-search-header-content">
              <div className="wrapper-map-search-title-section">
                <h1 className="header-map-search-title" data-ai-id="map-search-title">Mapa Inteligente BidExpert</h1>
                <div className="wrapper-map-search-badges">
                  <Badge variant="outline" className="badge-map-search-info" data-ai-id="map-search-dataset-label">{datasetMeta.label}</Badge>
                  <Badge variant="outline" className="badge-map-search-info" data-ai-id="map-search-results-count">{resultsLabel}</Badge>
                  {activeBounds && (
                    <Badge variant="outline" className="badge-map-search-info" data-ai-id="map-search-filtered-badge">
                      <Zap className="icon-badge-zap" /> Área filtrada
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleModalToggle(false)} className="btn-close-map-search" data-ai-id="map-search-close-btn">
                <X className="icon-close-map" />
              </Button>
            </div>
          </header>

          {/* Filters Bar */}
          <div className="wrapper-map-filters-bar" data-ai-id="map-search-filters">
            <div className="grid-map-filters">
              <div className="wrapper-filter-input">
                <MapPin className="icon-filter-prefix" />
                <Input 
                  placeholder="Cidade ou Estado" 
                  className="input-filter-map"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  data-ai-id="map-filter-location"
                />
              </div>
              <div className="wrapper-filter-input">
                <Tag className="icon-filter-prefix-z" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="select-trigger-map-filter" data-ai-id="map-filter-category-trigger">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="select-content-map-filter">
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="veiculo">Veículos</SelectItem>
                    <SelectItem value="imovel">Imóveis</SelectItem>
                    <SelectItem value="equipamento">Equipamentos</SelectItem>
                    <SelectItem value="informatica">Informática</SelectItem>
                    <SelectItem value="judicial">Judicial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="wrapper-price-filters">
                <div className="wrapper-filter-input-flex">
                  <DollarSign className="icon-filter-prefix" />
                  <Input 
                    type="number" 
                    placeholder="Preço mín" 
                    className="input-filter-map"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    data-ai-id="map-filter-price-min"
                  />
                </div>
                <div className="wrapper-filter-input-flex">
                  <DollarSign className="icon-filter-prefix" />
                  <Input 
                    type="number" 
                    placeholder="Preço máx" 
                    className="input-filter-map"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    data-ai-id="map-filter-price-max"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={triggerFitBounds}
                className="btn-clear-map-filters"
                data-ai-id="map-filter-clear-btn"
              >
                <Filter className="icon-filter-action" /> Limpar filtros
              </Button>
            </div>
          </div>

          {/* Main Content - 70/30 Split */}
          <div className="wrapper-map-main-content" data-ai-id="map-search-content">
            <div className="grid-map-sidebar-layout">
              {/* Map Section - 70% */}
              <div className="wrapper-map-display-section" data-ai-id="map-display-column">
                <div className="overlay-map-gradient" aria-hidden />
                <div className="wrapper-map-overlay-controls">
                  <Button variant="mapGhost" size="sm" onClick={triggerFitBounds} className="btn-recenter-map" data-ai-id="map-recenter-btn">
                    <Compass className="icon-map-control" /> Recentrar mapa
                  </Button>
                </div>
                <div className="wrapper-map-status-badge">
                  <Badge variant="outline" className="badge-map-sync-status" data-ai-id="map-status-badge">
                    <Signal className="icon-status-signal" /> {mapStatus}
                  </Badge>
                </div>
                <div className="wrapper-map-container-root">
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
