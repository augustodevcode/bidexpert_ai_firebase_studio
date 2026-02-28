/**
 * @fileoverview Cliente da página de busca geolocalizada com layout em três colunas
 * (filtros, lista e mapa), mantendo integração de dados e sincronização por área visível.
 */
'use client';

import { Suspense, useState, useEffect, useMemo, useCallback, useDeferredValue, useRef, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { LatLngBounds } from 'leaflet';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, Heart, ChevronUp, X } from 'lucide-react';
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
import { persistMapCacheSnapshot, readMapCacheSnapshot } from '@/app/map-search/map-search-cache';

const MapSearchComponent = dynamic(() => import('@/components/map-search-component'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const DEFAULT_CENTER: [number, number] = [-14.235, -51.9253];

type MapSearchItem = Lot | Auction | DirectSaleOffer;

const formatCurrency = (value: number | null | undefined) => {
  if (!value || Number.isNaN(value)) {
    return 'R$ --';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
};

const getMarketValue = (item: MapSearchItem) => {
  const candidate = item as unknown as { marketValue?: number; evaluationValue?: number; appraisedValue?: number };
  return Number(candidate.marketValue ?? candidate.evaluationValue ?? candidate.appraisedValue ?? 0);
};

const getCurrentValue = (item: MapSearchItem) => {
  const candidate = item as unknown as { currentBid?: number; startingBid?: number; price?: number };
  return Number(candidate.currentBid ?? candidate.startingBid ?? candidate.price ?? 0);
};

const getAuctioneerName = (item: MapSearchItem) => {
  const candidate = item as unknown as {
    auctioneerName?: string;
    auction?: { auctioneerName?: string };
  };
  return candidate.auctioneerName ?? candidate.auction?.auctioneerName ?? 'Leiloeiro';
};

const getImageUrl = (item: MapSearchItem) => {
  const candidate = item as unknown as {
    imageUrl?: string | null;
    image?: string | null;
    thumbnailUrl?: string | null;
    primaryImage?: string | null;
    images?: string[] | null;
  };

  if (candidate.imageUrl) return candidate.imageUrl;
  if (candidate.image) return candidate.image;
  if (candidate.thumbnailUrl) return candidate.thumbnailUrl;
  if (candidate.primaryImage) return candidate.primaryImage;
  if (Array.isArray(candidate.images) && candidate.images.length > 0) return candidate.images[0];
  return 'https://picsum.photos/seed/map-card-fallback/240/180';
};

const getStageLabel = (item: MapSearchItem) => {
  const candidate = item as unknown as {
    auctionStageName?: string;
    stage?: string;
    offerType?: string;
  };
  if (candidate.auctionStageName) {
    return candidate.auctionStageName;
  }
  if (candidate.offerType) {
    return 'Venda Direta';
  }
  return candidate.stage ?? '1º Leilão';
};

const getDiscountPercent = (item: MapSearchItem) => {
  const market = getMarketValue(item);
  const current = getCurrentValue(item);
  if (market <= 0 || current <= 0 || current >= market) {
    return 0;
  }
  return Math.round(((market - current) / market) * 100);
};

function ResultCard({
  item,
  onHover,
  onLeave,
}: {
  item: MapSearchItem;
  onHover: () => void;
  onLeave: () => void;
}) {
  const market = getMarketValue(item);
  const current = getCurrentValue(item);
  const potential = Math.max(market - current, 0);
  const discount = getDiscountPercent(item);

  return (
    <article
      className="flex h-40 overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md"
      data-ai-id="map-search-list-item"
      data-density="map"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="relative h-full w-[120px] flex-shrink-0 overflow-hidden bg-muted">
        <Image src={getImageUrl(item)} alt="Item do resultado" fill className="object-cover" unoptimized sizes="120px" />
      </div>
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-muted-foreground">Valor de Mercado vs Lance Atual</span>
            <button type="button" className="text-muted-foreground transition-colors hover:text-destructive" aria-label="Favoritar">
              <Heart className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1 text-sm font-bold text-foreground">
            {formatCurrency(market)} <span className="mx-1 text-[11px] font-normal text-muted-foreground">vs</span> {formatCurrency(current)}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Endereço</div>
          <div className="mt-1 text-xs font-semibold text-success">Lucro Potencial {formatCurrency(potential)} ({discount}%)</div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded bg-secondary px-2 py-1 text-[11px] font-semibold text-secondary-foreground">{getStageLabel(item)}</span>
          <button type="button" className="rounded bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">Dar Lance</button>
        </div>
      </div>
    </article>
  );
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
  const [searchType] = useState<MapSearchDataset>(resolveDatasetFromParam(searchParamsHook.get('type')));
  const hasSearchContext = useMemo(
    () => Boolean(searchParamsHook.get('term') || searchParamsHook.get('type')),
    [searchParamsHook],
  );
  const [isLoading, setIsLoading] = useState(!warmCacheRef.current);
  const [error, setError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(4);
  const [visibleItemIds, setVisibleItemIds] = useState<string[] | null>(null);
  const [fitBoundsSignal, setFitBoundsSignal] = useState(0);
  const [activeBounds, setActiveBounds] = useState<LatLngBounds | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const [discountFilter, setDiscountFilter] = useState(0);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [auctioneerFilter, setAuctioneerFilter] = useState('all');

  const boundsAnimationFrame = useRef<number | null>(null);
  const visibilityFrame = useRef<number | null>(null);
  const autoFitKeyRef = useRef<string>('');

  useEffect(() => {
    if (hasSearchContext) {
      return;
    }
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
  }, [hasSearchContext]);

  const fetchDatasets = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const [auctionsResult, lotsResult, settingsResult, directSalesResult] = await Promise.all([
        getAuctions(true),
        getLots(undefined, true),
        getPlatformSettings(),
        getDirectSaleOffers(),
      ]);

      const auctions = Array.isArray(auctionsResult)
        ? auctionsResult
        : (typeof auctionsResult === 'object' && auctionsResult !== null && 'auctions' in auctionsResult
          ? ((auctionsResult as { auctions?: Auction[] }).auctions ?? [])
          : []);

      const lots = Array.isArray(lotsResult)
        ? lotsResult
        : (typeof lotsResult === 'object' && lotsResult !== null && 'lots' in lotsResult
          ? ((lotsResult as { lots?: Lot[] }).lots ?? [])
          : []);

      const settings =
        typeof settingsResult === 'object' && settingsResult !== null && 'success' in settingsResult
          ? ((settingsResult as { success?: boolean; settings?: PlatformSettings | null }).settings ?? null)
          : (settingsResult as PlatformSettings | null);

      const directSales = Array.isArray(directSalesResult)
        ? directSalesResult
        : (typeof directSalesResult === 'object' && directSalesResult !== null && 'offers' in directSalesResult
          ? ((directSalesResult as { offers?: DirectSaleOffer[] }).offers ?? [])
          : []);

      setAllAuctions(auctions);
      setAllLots(lots);
      setAllDirectSales(directSales);
      setPlatformSettings(settings || null);

      persistMapCacheSnapshot({
        auctions,
        lots,
        directSales,
        settings: settings || null,
      });
    } catch (err) {
      console.error('[MAP SEARCH] Error fetching datasets:', err);
      setError('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!warmCacheRef.current) {
      fetchDatasets();
    }
  }, [fetchDatasets]);

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

  const auctioneerOptions = useMemo(() => {
    const map = new Map<string, string>();
    searchMatchingItems.forEach((item) => {
      const name = getAuctioneerName(item).trim();
      if (name) {
        map.set(name.toLowerCase(), name);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [searchMatchingItems]);

  const advancedFilteredItems = useMemo(() => {
    let items = searchMatchingItems;

    if (auctioneerFilter !== 'all') {
      items = items.filter((item) => getAuctioneerName(item).toLowerCase() === auctioneerFilter.toLowerCase());
    }

    if (priceMin) {
      const min = Number(priceMin);
      items = items.filter((item) => getCurrentValue(item) >= min);
    }

    if (priceMax) {
      const max = Number(priceMax);
      items = items.filter((item) => getCurrentValue(item) <= max);
    }

    if (discountFilter > 0) {
      items = items.filter((item) => {
        const market = getMarketValue(item);
        if (market <= 0) {
          return true;
        }
        return getDiscountPercent(item) >= discountFilter;
      });
    }

    return items;
  }, [searchMatchingItems, auctioneerFilter, priceMin, priceMax, discountFilter]);

  useEffect(() => {
    if (!hasSearchContext || advancedFilteredItems.length === 0) {
      return;
    }

    const key = `${searchType}:${searchTerm}:${advancedFilteredItems.map((item) => item.id).join(',')}`;
    if (autoFitKeyRef.current === key) {
      return;
    }

    autoFitKeyRef.current = key;
    setVisibleItemIds(null);
    setFitBoundsSignal((prev) => prev + 1);
  }, [advancedFilteredItems, hasSearchContext, searchTerm, searchType]);

  const displayedItems = useMemo(() => filterByVisibleIds(advancedFilteredItems, deferredVisibleIds), [advancedFilteredItems, deferredVisibleIds]);

  const mapItemType: 'lots' | 'auctions' | 'direct_sale' = searchType === 'tomada_de_precos' ? 'auctions' : searchType;

  const resetFilters = useCallback(() => {
    setVisibleItemIds(null);
    setActiveBounds(null);
    setDiscountFilter(0);
    setPriceMin('');
    setPriceMax('');
    setAuctioneerFilter('all');
    setFitBoundsSignal((prev) => prev + 1);
  }, []);

  const handleSearch = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  }, []);

  const handleModalToggle = (nextState: boolean) => {
    setIsModalOpen(nextState);
    if (!nextState) {
      router.back();
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleModalToggle}>
      <DialogContent className="h-[100vh] w-[100vw] max-w-none border-0 bg-background p-0 shadow-none [&>button.absolute]:hidden">
        <DialogTitle className="sr-only">Busca geolocalizada de leilões</DialogTitle>
        <DialogDescription className="sr-only">Layout com filtros, resultados e mapa interativo.</DialogDescription>

        {/* Floating Close Button */}
        <button
          onClick={() => handleModalToggle(false)}
          className="absolute right-4 top-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-lg hover:bg-muted transition-colors border border-border/50 text-foreground"
          aria-label="Voltar para a busca"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-full w-full overflow-hidden bg-muted/30" data-ai-id="map-search-shell">
          <aside className="h-full w-[280px] flex-shrink-0 overflow-y-auto border-r border-border/70 bg-card px-5 py-6" data-ai-id="map-search-filters">
            <h1 className="text-3xl font-bold text-foreground">Filtros</h1>

            <div className="mt-8 space-y-8">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Filtros Avançados para Investidores</h2>
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-6">
                  <label className="block text-sm text-muted-foreground">% de Desconto sobre o Valor de Mercado</label>
                  <div className="relative mt-5">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={discountFilter}
                      onChange={(e) => setDiscountFilter(Number(e.target.value))}
                      className="map-discount-range"
                      title="Desconto mínimo"
                      aria-label="Desconto mínimo"
                      data-ai-id="map-discount-range"
                    />
                    <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>{discountFilter}%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Valor de Avaliação</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="1000"
                    className="h-10"
                    data-ai-id="map-price-min"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="3000"
                    className="h-10"
                    data-ai-id="map-price-max"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Leiloeiro</label>
                <Select value={auctioneerFilter} onValueChange={setAuctioneerFilter}>
                  <SelectTrigger className="h-10" data-ai-id="map-auctioneer-select">
                    <SelectValue placeholder="Leiloeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Leiloeiro</SelectItem>
                    {auctioneerOptions.map((auctioneer) => (
                      <SelectItem key={auctioneer} value={auctioneer}>
                        {auctioneer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={resetFilters} data-ai-id="map-reset-filter">
                Limpar filtros
              </Button>
            </div>
          </aside>

          <main className="flex h-full w-[420px] min-w-[360px] flex-col border-r border-border/70 bg-card" data-ai-id="map-search-results">
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-card px-4 py-3">
              <form className="relative flex-1" onSubmit={handleSearch} data-ai-id="map-search-form">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar"
                  className="h-10 pl-9"
                  data-ai-id="map-search-input"
                />
              </form>
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-label="Perfil">
                <User className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground" data-ai-id="map-search-count">
              {displayedItems.length} {displayedItems.length === 1 ? 'resultado' : 'resultados'}
              {activeBounds ? ' · área filtrada' : ''}
            </div>

            <div className="flex-1 overflow-y-auto bg-muted/40 p-3" data-ai-id="map-search-list">
              {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              {isLoading && <p className="text-sm text-muted-foreground">Carregando dados do mapa…</p>}
              {!isLoading && displayedItems.length === 0 && (
                <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">Nenhum item nesta área. Mova o mapa ou limpe os filtros.</p>
              )}
              <div className="space-y-3">
                {displayedItems.map((item) => (
                  <ResultCard
                    key={item.id}
                    item={item}
                    onHover={() => setHoveredItemId(item.id)}
                    onLeave={() => setHoveredItemId((prev) => (prev === item.id ? null : prev))}
                  />
                ))}
              </div>
            </div>
          </main>

          <aside className="relative hidden h-full flex-1 overflow-hidden bg-background lg:block" data-ai-id="map-search-map-panel">
            <MapSearchComponent
              items={advancedFilteredItems}
              itemType={mapItemType}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              onBoundsChange={handleBoundsChange}
              onItemsInViewChange={handleVisibleItemsChange}
              fitBoundsSignal={fitBoundsSignal}
              hoveredItemId={hoveredItemId}
              onSearchInArea={() => setVisibleItemIds((prev) => (prev ? [...prev] : prev))}
              mapSettings={platformSettings?.mapSettings ?? null}
              platformSettings={platformSettings}
            />
          </aside>
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
