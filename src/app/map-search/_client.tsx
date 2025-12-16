'use client';

import { Suspense, useState, useEffect, useMemo, useCallback, useDeferredValue, useRef, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { LatLngBounds } from 'leaflet';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Maximize2, Minimize2, Compass, Zap, Signal, Filter, MapPin, Tag, DollarSign } from 'lucide-react';
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
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

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
      const [settings, auctions, lots, directSales] = await Promise.all([
        getPlatformSettings(),
        getAuctions(true),
        getLots(undefined, true),
        getDirectSaleOffers(),
      ]);
      setPlatformSettings(settings);
      setAllAuctions(auctions);
      setAllLots(lots);
      setAllDirectSales(directSales);
      setFitBoundsSignal((prev) => prev + 1);
      setVisibleItemIds(null);
      setLastUpdatedAt(Date.now());
      persistMapCacheSnapshot({ settings, auctions, lots, directSales });
    } catch (err) {
      console.error('Failed to fetch map data', err);
      if (!runSilently) {
        setError('Falha ao carregar dados do mapa.');
      }
    } finally {
      if (runSilently) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchDatasets({ silent: warmCacheRef.current });
    warmCacheRef.current = false;
  }, [fetchDatasets]);

  useEffect(() => {
    const nextDataset = resolveDatasetFromParam(searchParamsHook.get('type'));
    if (nextDataset !== searchType) {
      setSearchType(nextDataset);
      setFitBoundsSignal((prev) => prev + 1);
      setVisibleItemIds(null);
    }
  }, [searchParamsHook, searchType]);

  useEffect(() => () => {
    if (boundsAnimationFrame.current) {
      cancelAnimationFrame(boundsAnimationFrame.current);
    }
    if (visibilityFrame.current) {
      cancelAnimationFrame(visibilityFrame.current);
    }
  }, []);

  const triggerFitBounds = useCallback(() => {
    setVisibleItemIds(null);
    setFitBoundsSignal((prev) => prev + 1);
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    triggerFitBounds();
    const params = new URLSearchParams(searchParamsHook.toString());
    if (searchTerm.trim()) {
      params.set('term', searchTerm.trim());
    } else {
      params.delete('term');
    }
    router.push(`/map-search?${params.toString()}`);
  };

  const handleDatasetChange = (value: MapSearchDataset) => {
    setSearchType(value);
    triggerFitBounds();
    const params = new URLSearchParams(searchParamsHook.toString());
    params.set('type', value);
    router.push(`/map-search?${params.toString()}`);
  };

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    if (boundsAnimationFrame.current) {
      cancelAnimationFrame(boundsAnimationFrame.current);
    }
    boundsAnimationFrame.current = requestAnimationFrame(() => setActiveBounds(bounds));
  }, []);

  const handleVisibleItemsChange = useCallback((ids: string[]) => {
    if (visibilityFrame.current) {
      cancelAnimationFrame(visibilityFrame.current);
    }
    const normalized = ids.map((id) => id.toString());
    visibilityFrame.current = requestAnimationFrame(() => setVisibleItemIds(normalized));
  }, []);

  // Listen for synthetic events for testing
  useEffect(() => {
    const handleSyntheticEvent = (e: CustomEvent) => {
      handleVisibleItemsChange(e.detail);
    };
    window.addEventListener('bidexpert-map-visible-ids', handleSyntheticEvent as EventListener);
    return () => window.removeEventListener('bidexpert-map-visible-ids', handleSyntheticEvent as EventListener);
  }, [handleVisibleItemsChange]);

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

  const filteredItems = useMemo(() => filterByVisibleIds(advancedFilteredItems, deferredVisibleIds), [advancedFilteredItems, deferredVisibleIds]);

  const displayedItems = filteredItems.slice(0, 60);
  const resultsLabel = formatSummaryLabel(filteredItems.length);
  const mapItemType: 'lots' | 'auctions' | 'direct_sale' = searchType === 'tomada_de_precos' ? 'auctions' : searchType;
  const listItemType: 'lot' | 'auction' | 'direct_sale' = searchType === 'lots' ? 'lot' : searchType === 'direct_sale' ? 'direct_sale' : 'auction';

  const datasetMeta = DATASET_METADATA[searchType];
  const lastUpdatedLabel = describeRelativeTimestamp(lastUpdatedAt);
  const mapStatus = isRefreshing ? 'Sincronizando dados em tempo real…' : lastUpdatedLabel ?? 'Aguardando sincronização';

  const handleFullscreenToggle = (nextState: boolean) => {
    setIsFullscreenOpen(nextState);
    if (nextState && typeof window !== 'undefined') {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 220);
    }
  };

  return (
    <section className="space-y-6" data-ai-id="map-search-shell">
      <div className="rounded-[2.5rem] border border-border/30 bg-panel/70 px-6 py-6 shadow-glow">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.5em] text-muted-foreground">Mapa Inteligente</p>
            <h1 className="mt-2 text-3xl font-display text-foreground">Busca geolocalizada de leilões BidExpert</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Localize lotes, vendas diretas e processos de tomada de preços em tempo real.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-border/40 bg-surface/80">{datasetMeta.label}</Badge>
            <Badge variant="outline" className="border-border/40 bg-surface/80">{resultsLabel}</Badge>
          </div>
        </div>

        {/* Advanced Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-surface/50 rounded-2xl border border-border/40">
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
                 placeholder="Min" 
                 type="number" 
                 className="pl-9 bg-background/50 border-border/60"
                 value={priceMin}
                 onChange={(e) => setPriceMin(e.target.value)}
               />
             </div>
             <div className="relative flex-1">
               <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Max" 
                 type="number" 
                 className="pl-9 bg-background/50 border-border/60"
                 value={priceMax}
                 onChange={(e) => setPriceMax(e.target.value)}
               />
             </div>
           </div>
           <Button variant="outline" className="border-border/60 hover:bg-primary/10 hover:text-primary" onClick={() => {
             setLocationFilter('');
             setCategoryFilter('all');
             setPriceMin('');
             setPriceMax('');
           }}>
             <Filter className="mr-2 h-4 w-4" /> Limpar Filtros
           </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]" data-ai-id="map-search-grid">
        <div className="h-full">
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
            listDensity="default"
          />
        </div>

        <div className="relative flex min-h-[560px] flex-1 rounded-[2.5rem] border border-border/40 bg-surface/60 shadow-haze" data-ai-id="map-search-viewport">
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-map-panel opacity-50" aria-hidden />
          <div className="absolute top-5 right-5 z-10 flex flex-wrap gap-3">
            <Button variant="mapGhost" size="sm" onClick={triggerFitBounds} className="h-10">
              <Compass className="mr-2 h-4 w-4" /> Recentrar mapa
            </Button>
            <Button variant="mapSolid" size="sm" onClick={() => handleFullscreenToggle(true)} className="h-10">
              <Maximize2 className="mr-2 h-4 w-4" /> Tela cheia
            </Button>
          </div>
          <div className="absolute bottom-5 left-6 z-10 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-border/40 bg-background/40">
              <Signal className="mr-1 h-3.5 w-3.5" /> {mapStatus}
            </Badge>
            {activeBounds && (
              <Badge variant="outline" className="border-border/40 bg-background/40">
                <Zap className="mr-1 h-3.5 w-3.5" /> Área filtrada
              </Badge>
            )}
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
            />
          </div>
        </div>
      </div>

      <Dialog open={isFullscreenOpen} onOpenChange={handleFullscreenToggle}>
        <DialogContent className="max-w-[95vw] border-border/50 bg-background/80 p-0 shadow-glow">
          <div className="relative h-[85vh] w-full rounded-[2.5rem] border border-border/50 bg-surface/80">
            <div className="absolute top-4 right-4 z-10">
              <Button variant="glass" size="sm" onClick={() => handleFullscreenToggle(false)}>
                <Minimize2 className="mr-2 h-4 w-4" /> Fechar tela cheia
              </Button>
            </div>
            <div className="h-full w-full rounded-[2.5rem] overflow-hidden">
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
        </DialogContent>
      </Dialog>
    </section>
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
