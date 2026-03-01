/**
 * @fileoverview Interactive Leaflet map used in the map search experience,
 * now aware of map bounds (for filtering) and rich popup cards.
 */
'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngBounds } from 'leaflet';
import { renderToString } from 'react-dom/server';
import { Car, Home, Gavel, Tractor, Monitor, Package, Building2, Briefcase } from 'lucide-react';
import type { Lot, Auction, PlatformSettings, DirectSaleOffer } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  buildLocationDescriptor,
  geocodeLocation,
  getTileLayerConfig,
  normalizeMapProvider,
  filterIdsWithinBounds,
  boundingBoxFromLatLngBounds,
  type LatLngLiteral,
  type MapProvider,
} from '@/lib/map-utils';

// Fix for Leaflet marker icons when bundled with Next.js
if (typeof window !== 'undefined') {
  // @ts-expect-error Leaflet mutates prototype URLs at runtime
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const MAX_GEOCODE_BATCH = 25;

type MapSearchItem = Lot | Auction | DirectSaleOffer;
type CoordinatedItem = MapSearchItem & { latitude?: number | null; longitude?: number | null };
type CoordinateDictionary = Record<string, LatLngLiteral>;
type LotAddressAugmented = Lot & {
  zipCode?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
};
type AuctionAddressAugmented = Auction & {
  address?: string | null;
  city?: string | null;
  cityName?: string | null;
  state?: string | null;
  stateUf?: string | null;
  zipCode?: string | null;
};

const isLotItem = (item: MapSearchItem): item is Lot => 'auctionId' in item;
const isDirectSaleItem = (item: MapSearchItem): item is DirectSaleOffer => 'offerType' in item && !('auctionId' in item);
const getExistingCoordinates = (item: MapSearchItem): LatLngLiteral | null => {
  const candidate = item as Partial<{ latitude: number; longitude: number }>;
  if (typeof candidate.latitude === 'number' && typeof candidate.longitude === 'number') {
    return { lat: candidate.latitude, lng: candidate.longitude };
  }
  return null;
};

const getCategoryIcon = (category: string | undefined) => {
  const normalized = category?.toLowerCase() || '';
  if (normalized.includes('veiculo') || normalized.includes('carro') || normalized.includes('moto') || normalized.includes('caminhao')) return <Car />;
  if (normalized.includes('imovel') || normalized.includes('casa') || normalized.includes('terreno') || normalized.includes('apartamento')) return <Home />;
  if (normalized.includes('equipamento') || normalized.includes('maquina') || normalized.includes('industrial')) return <Tractor />;
  if (normalized.includes('informatica') || normalized.includes('eletronico') || normalized.includes('celular')) return <Monitor />;
  if (normalized.includes('judicial') || normalized.includes('leilao')) return <Gavel />;
  if (normalized.includes('empresa') || normalized.includes('comercial')) return <Building2 />;
  if (normalized.includes('servico')) return <Briefcase />;
  return <Package />;
};

const formatPrice = (value: number | undefined | null) => {
  if (value === undefined || value === null) return 'R$ --';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

const formatCompactPrice = (value: number | undefined | null) => {
  if (value === undefined || value === null || value <= 0) return 'R$ --';
  if (value >= 1_000_000) {
    const amount = (value / 1_000_000).toFixed(1).replace('.0', '');
    return `R$ ${amount}M`;
  }
  if (value >= 1_000) {
    const amount = Math.round(value / 1_000);
    return `R$ ${amount}k`;
  }
  return formatPrice(value);
};

const getItemImage = (item: MapSearchItem) => {
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
  return 'https://picsum.photos/seed/map-search-fallback/160/120';
};

const getItemMarketValue = (item: MapSearchItem) => {
  const candidate = item as unknown as { marketValue?: number; evaluationValue?: number; appraisedValue?: number };
  return Number(candidate.marketValue ?? candidate.evaluationValue ?? candidate.appraisedValue ?? 0);
};

const getItemBidValue = (item: MapSearchItem) => {
  const candidate = item as unknown as { currentBid?: number; startingBid?: number; price?: number };
  return Number(candidate.currentBid ?? candidate.startingBid ?? candidate.price ?? 0);
};

const getItemDiscount = (item: MapSearchItem) => {
  const market = getItemMarketValue(item);
  const bid = getItemBidValue(item);
  if (market <= 0 || bid <= 0 || bid >= market) return 0;
  return Math.round(((market - bid) / market) * 100);
};

const createCustomIcon = (item: MapSearchItem) => {
  let category = '';
  let price = 0;

  if (isLotItem(item)) {
    category = item.categoryName || 'Lote';
    price = Number(item.currentBid || item.startingBid || 0);
  } else if (isDirectSaleItem(item)) {
    category = item.category || 'Venda Direta';
    price = Number(item.price || 0);
  } else {
    // Auction
    category = item.categoryName || 'Leilão';
    // Auctions might not have a single price, maybe show count of lots? Or just "Leilão"
    // For now, let's try to find a price if available, or 0
    price = 0; 
  }

  const priceFormatted = formatCompactPrice(price);
  const showPrice = price > 0;

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="map-pin-marker">${showPrice ? `<span>${priceFormatted}</span>` : `<span>${renderToString(getCategoryIcon(category))}</span>`}</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -34]
  });
};

interface MapEventsProps {
  onBoundsChange: (bounds: LatLngBounds) => void;
  items: CoordinatedItem[];
  fitBoundsSignal: number;
  onItemsInViewChange: (ids: string[]) => void;
  hoveredItemId?: string | null;
}

function MapEvents({ onBoundsChange, items, fitBoundsSignal, onItemsInViewChange, hoveredItemId }: MapEventsProps) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
      onItemsInViewChange(filterIdsWithinBounds(items, boundingBoxFromLatLngBounds(bounds)));
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
      onItemsInViewChange(filterIdsWithinBounds(items, boundingBoxFromLatLngBounds(bounds)));
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      (window as any).__BIDEXPERT_MAP_SEARCH_DEBUG = {
        setView: ({ center, zoom }: { center: [number, number]; zoom: number }) => {
          map.setView(center, zoom, { animate: false });
        },
        getBounds: () => map.getBounds(),
      };
    }
  }, [map]);

  useEffect(() => {
    if (!fitBoundsSignal) {
      return;
    }
    const points: [number, number][] = items
      .map(item => (typeof item.latitude === 'number' && typeof item.longitude === 'number'
        ? [item.latitude, item.longitude]
        : null))
      .filter((point): point is [number, number] => point !== null);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      onBoundsChange(bounds);
      onItemsInViewChange(filterIdsWithinBounds(items, boundingBoxFromLatLngBounds(bounds)));
    } else {
      onItemsInViewChange([]);
    }
  }, [fitBoundsSignal, items, map, onBoundsChange, onItemsInViewChange]);

  useEffect(() => {
    const bounds = map.getBounds();
    onItemsInViewChange(filterIdsWithinBounds(items, boundingBoxFromLatLngBounds(bounds)));
  }, [items, map, onItemsInViewChange]);

  useEffect(() => {
    if (!hoveredItemId) {
      return;
    }

    const hoveredItem = items.find((item) => item.id === hoveredItemId);
    if (!hoveredItem || typeof hoveredItem.latitude !== 'number' || typeof hoveredItem.longitude !== 'number') {
      return;
    }

    const currentZoom = map.getZoom();
    const target: [number, number] = [hoveredItem.latitude, hoveredItem.longitude];
    map.flyTo(target, currentZoom, { animate: true, duration: 0.35 });
  }, [hoveredItemId, items, map]);

  return null;
}

interface MapSearchComponentProps {
  items: MapSearchItem[];
  itemType: 'lots' | 'auctions' | 'direct_sale';
  mapCenter: [number, number];
  mapZoom: number;
  onBoundsChange: (bounds: LatLngBounds) => void;
  onItemsInViewChange: (ids: string[]) => void;
  fitBoundsSignal: number;
  hoveredItemId?: string | null;
  onSearchInArea?: () => void;
  mapSettings?: PlatformSettings['mapSettings'] | null;
  platformSettings?: PlatformSettings | null;
}

export default function MapSearchComponent({
  items,
  itemType,
  mapCenter,
  mapZoom,
  onBoundsChange,
  onItemsInViewChange,
  fitBoundsSignal,
  hoveredItemId,
  onSearchInArea,
  mapSettings,
  platformSettings,
}: MapSearchComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const [resolvedCoordinates, setResolvedCoordinates] = useState<CoordinateDictionary>({});
  const [isGeocoding, setIsGeocoding] = useState(false);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const itemsMissingCoords = items
      .filter(item => !getExistingCoordinates(item) && !resolvedCoordinates[item.id])
      .slice(0, MAX_GEOCODE_BATCH);

    if (itemsMissingCoords.length === 0) {
      return () => {
        isMounted = false;
      };
    }

    async function resolveBatch() {
      setIsGeocoding(true);
      const updates: CoordinateDictionary = {};

      for (const item of itemsMissingCoords) {
        const descriptor = buildLocationDescriptor(item as any);
        const coords = await geocodeLocation(descriptor);
        if (!isMounted) {
          return;
        }
        if (coords) {
          updates[item.id] = coords;
        }
      }

      if (!isMounted) {
        return;
      }

      if (Object.keys(updates).length > 0) {
        setResolvedCoordinates(prev => ({ ...prev, ...updates }));
      }
      setIsGeocoding(false);
    }

    resolveBatch();
    return () => {
      isMounted = false;
    };
  }, [items, resolvedCoordinates]);

  const provider = normalizeMapProvider({ mapSettings: mapSettings ?? null });
  const leafletProvider: MapProvider = provider === 'openmap' ? 'openmap' : 'openstreetmap';
  const tileLayerConfig = getTileLayerConfig(leafletProvider);

  const itemsWithCoordinates = useMemo<CoordinatedItem[]>(() => (
    items.map(item => {
      const existing = getExistingCoordinates(item);
      if (existing) {
        return item as CoordinatedItem;
      }
      const override = resolvedCoordinates[item.id];
      if (override) {
        return { ...item, latitude: override.lat, longitude: override.lng } as CoordinatedItem;
      }
      return item as CoordinatedItem;
    })
  ), [items, resolvedCoordinates]);

  useEffect(() => {
    if (!hoveredItemId) {
      return;
    }
    const marker = markerRefs.current[hoveredItemId];
    if (marker) {
      marker.openPopup();
    }
  }, [hoveredItemId]);

  const renderPopupCard = useCallback((item: CoordinatedItem) => {
    const market = getItemMarketValue(item);
    const bid = getItemBidValue(item);
    const discount = getItemDiscount(item);

    return (
      <div className="map-popup-card" data-ai-id="map-search-popup-card">
        <div className="map-popup-arrow" />
        <div className="map-popup-media">
          <img src={getItemImage(item)} alt="Item do mapa" loading="lazy" />
        </div>
        <div className="map-popup-content">
          <div className="map-popup-label">Valor de mercado vs lance atual</div>
          <div className="map-popup-values">
            <strong>{formatPrice(market)}</strong>
            <span>vs</span>
            <strong>{formatPrice(bid)}</strong>
          </div>
          <div className="map-popup-profit">Lucro Potencial {formatPrice(Math.max(market - bid, 0))} ({discount}%)</div>
          <svg className="map-popup-spark" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 15 L20 10 L40 12 L60 5 L80 8 L100 0" />
          </svg>
          <button type="button" className="map-popup-cta" data-ai-id="map-popup-bid-button">Dar Lance</button>
        </div>
      </div>
    );
  }, []);

  const renderMarkerPopup = useCallback((item: CoordinatedItem) => renderPopupCard(item), [renderPopupCard]);

  if (!isClient) {
    return <Skeleton className="w-full h-full rounded-lg" />;
  }

  return (
    <div className="w-full h-full relative">
      {(isGeocoding || !tileLayerConfig) && (
        <div className="absolute top-3 left-3 z-10 text-xs rounded-full px-3 py-1.5 bg-panel/90 text-panel-foreground shadow-lg">
          {isGeocoding ? 'Geocodificando endereços…' : 'Camada padrão aplicada'}
        </div>
      )}
      <div className="absolute left-1/2 top-4 z-[900] -translate-x-1/2">
        <button type="button" className="map-search-area-button" onClick={onSearchInArea} data-ai-id="map-search-area-button">
          Pesquisar nesta área
        </button>
      </div>
      <MapContainer
        key={`map-search-container-${mapCenter.join('-')}-${leafletProvider}`}
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom
        className="w-full h-full border"
        style={{ borderColor: 'var(--map-border)' }}
      >
        {tileLayerConfig ? (
          <TileLayer
            attribution={tileLayerConfig.attribution}
            url={tileLayerConfig.url}
            {...(tileLayerConfig.subdomains ? { subdomains: tileLayerConfig.subdomains } : {})}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        {itemsWithCoordinates.map(item => {
          if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
            return null;
          }
          const markerKey = `${item.id}-${item.latitude}-${item.longitude}`;
          return (
            <Marker 
              key={markerKey} 
              position={[item.latitude, item.longitude]}
              icon={createCustomIcon(item)}
              ref={(instance) => {
                if (instance) {
                  markerRefs.current[item.id] = instance;
                } else {
                  delete markerRefs.current[item.id];
                }
              }}
            >
              <Popup>{renderMarkerPopup(item)}</Popup>
            </Marker>
          );
        })}
        <MapEvents
          onBoundsChange={onBoundsChange}
          items={itemsWithCoordinates}
          fitBoundsSignal={fitBoundsSignal}
          onItemsInViewChange={onItemsInViewChange}
          hoveredItemId={hoveredItemId}
        />
      </MapContainer>
    </div>
  );
}
