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
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, Heart, X } from 'lucide-react';
import type { Lot, Auction, PlatformSettings, DirectSaleOffer, LotCategory } from '@/types';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getLots } from '@/app/admin/lots/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getDirectSaleOffers } from '@/app/direct-sales/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import BidExpertFilter, { type ActiveFilters } from '@/components/BidExpertFilter';
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

const FALLBACK_MAP_SEARCH_ITEMS: Lot[] = [
  {
    id: 'fallback-lot-sp',
    title: 'Apartamento de Teste - São Paulo',
    description: 'Fallback para manter experiência funcional do map-search.',
    status: 'ABERTO_PARA_LANCES',
    cityName: 'São Paulo',
    stateUf: 'SP',
    mapAddress: 'Av. Paulista, 1000',
    latitude: -23.5505,
    longitude: -46.6333,
    imageUrl: 'https://picsum.photos/seed/map-fallback-sp/600/400',
    auctioneerName: 'Leiloeiro Demo',
    marketValue: 780000,
    startingBid: 530000,
    currentBid: 540000,
  } as unknown as Lot,
  {
    id: 'fallback-lot-rj',
    title: 'Casa de Teste - Rio de Janeiro',
    description: 'Fallback para manter experiência funcional do map-search.',
    status: 'ABERTO_PARA_LANCES',
    cityName: 'Rio de Janeiro',
    stateUf: 'RJ',
    mapAddress: 'Av. Atlântica, 500',
    latitude: -22.9068,
    longitude: -43.1729,
    imageUrl: 'https://picsum.photos/seed/map-fallback-rj/600/400',
    auctioneerName: 'Leiloeiro Demo',
    marketValue: 1250000,
    startingBid: 910000,
    currentBid: 930000,
  } as unknown as Lot,
];

type MapSearchItem = Lot | Auction | DirectSaleOffer;

const hasKnownCoordinates = (item: MapSearchItem) => {
  const candidate = item as unknown as { latitude?: number | null; longitude?: number | null };
  return typeof candidate.latitude === 'number' && typeof candidate.longitude === 'number';
};

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
  const hasWarmCacheData =
    (cacheSnapshot.lots?.length ?? 0) > 0 ||
    (cacheSnapshot.auctions?.length ?? 0) > 0 ||
    (cacheSnapshot.directSales?.length ?? 0) > 0;
  const warmCacheRef = useRef<boolean>(hasWarmCacheData);

  const [allAuctions, setAllAuctions] = useState<Auction[]>(cacheSnapshot.auctions ?? []);
  const [allLots, setAllLots] = useState<Lot[]>(cacheSnapshot.lots ?? []);
  const [allDirectSales, setAllDirectSales] = useState<DirectSaleOffer[]>(cacheSnapshot.directSales ?? []);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(cacheSnapshot.settings ?? null);

  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('term') || '');
  const [searchType] = useState<MapSearchDataset>(resolveDatasetFromParam(searchParamsHook.get('type')));
  const [isLoading, setIsLoading] = useState(!warmCacheRef.current);
  const [error, setError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(4);
  const [visibleItemIds, setVisibleItemIds] = useState<string[] | null>(null);
  const [fitBoundsSignal, setFitBoundsSignal] = useState(0);
  const [activeBounds, setActiveBounds] = useState<LatLngBounds | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  /* ── Full filter state (parity with BidExpertFilter) ── */
  const [allCategories, setAllCategories] = useState<LotCategory[]>([]);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);
  const [uniqueSellers, setUniqueSellers] = useState<string[]>([]);
  const defaultActiveFilters: ActiveFilters = {
    modality: 'TODAS',
    category: 'TODAS',
    priceRange: [0, 1000000],
    locations: [],
    sellers: [],
    makes: [],
    models: [],
    status: [],
  };
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(defaultActiveFilters);

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

  const fetchDatasets = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const [auctionsResult, lotsResult, settingsResult, directSalesResult, categoriesResult, sellersResult] = await Promise.allSettled([
        getAuctions(true),
        getLots(undefined, true),
        getPlatformSettings(),
        getDirectSaleOffers(),
        getLotCategories(),
        getSellers(true),
      ]);

      const auctionsSource = auctionsResult.status === 'fulfilled' ? auctionsResult.value : [];
      const lotsSource = lotsResult.status === 'fulfilled' ? lotsResult.value : [];
      const settingsSource = settingsResult.status === 'fulfilled' ? settingsResult.value : null;
      const directSalesSource = directSalesResult.status === 'fulfilled' ? directSalesResult.value : [];
      const categoriesSource = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
      const sellersSource = sellersResult.status === 'fulfilled' ? sellersResult.value : [];

      const auctions = Array.isArray(auctionsSource)
        ? auctionsSource
        : (typeof auctionsSource === 'object' && auctionsSource !== null && 'auctions' in auctionsSource
          ? ((auctionsSource as { auctions?: Auction[] }).auctions ?? [])
          : []);

      const lots = Array.isArray(lotsSource)
        ? lotsSource
        : (typeof lotsSource === 'object' && lotsSource !== null && 'lots' in lotsSource
          ? ((lotsSource as { lots?: Lot[] }).lots ?? [])
          : []);

      const settings =
        typeof settingsSource === 'object' && settingsSource !== null && 'success' in settingsSource
          ? ((settingsSource as { success?: boolean; settings?: PlatformSettings | null }).settings ?? null)
          : (settingsSource as PlatformSettings | null);

      const directSales = Array.isArray(directSalesSource)
        ? directSalesSource
        : (typeof directSalesSource === 'object' && directSalesSource !== null && 'offers' in directSalesSource
          ? ((directSalesSource as { offers?: DirectSaleOffer[] }).offers ?? [])
          : []);

      const categories = Array.isArray(categoriesSource) ? categoriesSource : [];
      const sellers = Array.isArray(sellersSource) ? sellersSource : [];

      const shouldUseFallbackDataset =
        auctions.length === 0 &&
        lots.length === 0 &&
        directSales.length === 0;

      const lotsWithFallback = shouldUseFallbackDataset ? FALLBACK_MAP_SEARCH_ITEMS : lots;

      const failedSources: string[] = [];
      if (auctionsResult.status === 'rejected') failedSources.push('leilões');
      if (lotsResult.status === 'rejected') failedSources.push('lotes');
      if (settingsResult.status === 'rejected') failedSources.push('configurações');
      if (directSalesResult.status === 'rejected') failedSources.push('venda direta');

      if (failedSources.length === 4) {
        throw new Error('Todas as fontes de dados falharam.');
      }

      if (failedSources.length > 0) {
        console.warn('[MAP SEARCH] Partial dataset load failure:', failedSources.join(', '));
      }

      setAllAuctions(auctions);
      setAllLots(lotsWithFallback);
      setAllDirectSales(directSales);
      setPlatformSettings(settings || null);

      /* ── Build filter data: categories, locations, sellers ── */
      setAllCategories(categories as LotCategory[]);

      const locationSet = new Set<string>();
      const allItems = [...auctions, ...lotsWithFallback, ...directSales] as any[];
      allItems.forEach((item) => {
        const city = item.locationCity || item.cityName || item.city;
        const state = item.locationState || item.stateUf || item.state;
        if (city && state) locationSet.add(`${city} - ${state}`);
      });
      setUniqueLocations(Array.from(locationSet).sort());

      const sellerNames = sellers.map((s: any) => s.name || s.companyName || '').filter(Boolean);
      setUniqueSellers(Array.from(new Set(sellerNames)).sort() as string[]);

      /* ── Trigger fitBounds after data loads so map zooms to items ── */
      setTimeout(() => setFitBoundsSignal((prev) => prev + 1), 300);

      persistMapCacheSnapshot({
        auctions,
        lots: lotsWithFallback,
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

  const advancedFilteredItems = useMemo(() => {
    let items = searchMatchingItems;

    /* Category filter */
    if (activeFilters.category !== 'TODAS') {
      const cat = allCategories.find((c) => c.slug === activeFilters.category);
      items = items.filter((item) => {
        const anyItem = item as any;
        if (cat && anyItem.categoryId === cat.id) return true;
        const itemCatName = anyItem.type || anyItem.category?.name || '';
        return itemCatName && cat && itemCatName.toLowerCase().includes(cat.name.toLowerCase());
      });
    }

    /* Price range filter */
    if (activeFilters.priceRange[0] > 0 || activeFilters.priceRange[1] < 1000000) {
      items = items.filter((item) => {
        const val = getCurrentValue(item);
        return val >= activeFilters.priceRange[0] && val <= activeFilters.priceRange[1];
      });
    }

    /* Locations filter */
    if (activeFilters.locations.length > 0) {
      items = items.filter((item) => {
        const anyItem = item as any;
        const city = anyItem.locationCity || anyItem.cityName || anyItem.city || '';
        const state = anyItem.locationState || anyItem.stateUf || anyItem.state || '';
        const loc = city && state ? `${city} - ${state}` : '';
        return loc && activeFilters.locations.includes(loc);
      });
    }

    /* Sellers filter */
    if (activeFilters.sellers.length > 0) {
      items = items.filter((item) => {
        const anyItem = item as any;
        const seller = anyItem.sellerName || anyItem.seller?.name || '';
        return seller && activeFilters.sellers.includes(seller);
      });
    }

    /* Status filter */
    if (activeFilters.status.length > 0) {
      items = items.filter((item) => item.status && activeFilters.status.includes(item.status as string));
    }

    /* Modality filter (auctions) */
    if (activeFilters.modality !== 'TODAS') {
      items = items.filter((item) => {
        const anyItem = item as any;
        return anyItem.auctionType?.toUpperCase() === activeFilters.modality;
      });
    }

    /* Offer type filter (direct sales) */
    if (activeFilters.offerType && activeFilters.offerType !== 'ALL') {
      items = items.filter((item) => {
        const anyItem = item as any;
        return anyItem.offerType === activeFilters.offerType;
      });
    }

    /* Praça filter */
    if (activeFilters.praça && activeFilters.praça !== 'todas') {
      items = items.filter((item) => {
        const stages = (item as any).auctionStages?.length || 0;
        if (activeFilters.praça === 'unica') return stages === 1;
        if (activeFilters.praça === 'multiplas') return stages > 1;
        return true;
      });
    }

    /* Date range filter */
    if (activeFilters.startDate) {
      items = items.filter((item) => {
        const d = (item as any).startDate || (item as any).createdAt;
        return d && new Date(d) >= activeFilters.startDate!;
      });
    }
    if (activeFilters.endDate) {
      items = items.filter((item) => {
        const d = (item as any).endDate || (item as any).updatedAt;
        return d && new Date(d) <= activeFilters.endDate!;
      });
    }

    return items;
  }, [searchMatchingItems, activeFilters, allCategories]);

  const displayedItems = useMemo(() => {
    if (deferredVisibleIds === null) {
      return advancedFilteredItems;
    }

    if (deferredVisibleIds.length === 0) {
      const datasetHasCoordinates = advancedFilteredItems.some(hasKnownCoordinates);
      if (!datasetHasCoordinates) {
        return advancedFilteredItems;
      }
    }

    return filterByVisibleIds(advancedFilteredItems, deferredVisibleIds);
  }, [advancedFilteredItems, deferredVisibleIds]);

  const mapItemType: 'lots' | 'auctions' | 'direct_sale' = searchType === 'tomada_de_precos' ? 'auctions' : searchType;

  const resetFilters = useCallback(() => {
    setVisibleItemIds(null);
    setActiveBounds(null);
    setActiveFilters(defaultActiveFilters);
    setFitBoundsSignal((prev) => prev + 1);
  }, [defaultActiveFilters]);

  const handleFilterSubmit = useCallback((filters: ActiveFilters) => {
    setActiveFilters(filters);
    /* After applying filters, re-fit map bounds to show filtered items */
    setTimeout(() => setFitBoundsSignal((prev) => prev + 1), 100);
  }, []);

  const handleFilterReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

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
      <DialogContent className="inset-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-background p-0 shadow-none">
        <DialogTitle className="sr-only">Busca geolocalizada de leilões</DialogTitle>
        <DialogDescription className="sr-only">Layout com filtros, resultados e mapa interativo.</DialogDescription>

        {/* Floating Close Button */}
        <button
          onClick={() => handleModalToggle(false)}
          data-ai-id="map-search-close-modal"
          className="absolute right-4 top-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-lg hover:bg-muted transition-colors border border-border/50 text-foreground"
          aria-label="Voltar para a busca"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-full w-full overflow-hidden bg-muted/30" data-ai-id="map-search-shell">
          <aside className="h-full w-[300px] flex-shrink-0 overflow-y-auto border-r border-border/70 bg-card" data-ai-id="map-search-filters">
            <BidExpertFilter
              categories={allCategories}
              locations={uniqueLocations}
              sellers={uniqueSellers}
              onFilterSubmit={handleFilterSubmit}
              onFilterReset={handleFilterReset}
              initialFilters={activeFilters}
              filterContext={searchType === 'tomada_de_precos' ? 'tomada_de_precos' : searchType === 'direct_sale' ? 'directSales' : 'lots'}
            />
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
              onSearchInArea={() => {
                /* Force the list to re-sync with the current map viewport */
                if (activeBounds) {
                  const idsInBounds: string[] = [];
                  advancedFilteredItems.forEach((item) => {
                    const anyItem = item as any;
                    const lat = typeof anyItem.latitude === 'number' ? anyItem.latitude : null;
                    const lng = typeof anyItem.longitude === 'number' ? anyItem.longitude : null;
                    if (lat !== null && lng !== null && activeBounds.contains([lat, lng])) {
                      idsInBounds.push(String(item.id));
                    }
                  });
                  setVisibleItemIds(idsInBounds);
                } else {
                  /* No bounds tracked yet — fit to all items */
                  setFitBoundsSignal((prev) => prev + 1);
                }
              }}
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
