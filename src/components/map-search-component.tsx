/**
 * @fileoverview Interactive Leaflet map used in the map search experience,
 * now aware of map bounds (for filtering) and rich popup cards.
 */
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import BidExpertListItem from '@/components/BidExpertListItem';
import LotCard from '@/components/cards/lot-card';

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

  const iconHtml = renderToString(getCategoryIcon(category));
  const priceFormatted = formatPrice(price);
  const showPrice = price > 0;

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="marker-icon-wrapper">${iconHtml}</div>
      ${showPrice ? `<div class="marker-price-tag">${priceFormatted}</div>` : ''}
    `,
    iconSize: [40, showPrice ? 60 : 40],
    iconAnchor: [20, showPrice ? 60 : 20],
    popupAnchor: [0, showPrice ? -60 : -20]
  });
};

interface MapEventsProps {
  onBoundsChange: (bounds: LatLngBounds) => void;
  items: CoordinatedItem[];
  fitBoundsSignal: number;
  onItemsInViewChange: (ids: string[]) => void;
}

function MapEvents({ onBoundsChange, items, fitBoundsSignal, onItemsInViewChange }: MapEventsProps) {
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
          map.setView(center, zoom);
        },
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
  mapSettings,
  platformSettings,
}: MapSearchComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const [resolvedCoordinates, setResolvedCoordinates] = useState<CoordinateDictionary>({});
  const [isGeocoding, setIsGeocoding] = useState(false);

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
        const descriptor = buildDescriptorForItem(item);
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

  const renderMarkerPopup = useCallback((item: CoordinatedItem) => {
    if (!platformSettings) {
      return <div className="text-xs text-muted-foreground">Carregando card…</div>;
    }

    if (itemType === 'lots' && isLotItem(item)) {
      return (
        <div className="w-[300px] max-w-[360px]" data-ai-id="map-popup-lot-card">
          <LotCard lot={item} auction={item.auction} platformSettings={platformSettings} showCountdown />
        </div>
      );
    }

    const popupType = itemType === 'direct_sale' ? 'direct_sale' : 'auction';
    return (
      <div className="w-[300px] max-w-[360px]" data-ai-id={`map-popup-${popupType}`}>
        <BidExpertListItem
          item={item as Lot | Auction | DirectSaleOffer}
          type={popupType}
          platformSettings={platformSettings}
        />
      </div>
    );
  }, [itemType, platformSettings]);

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
      <MapContainer
        key={`map-search-container-${mapCenter.join('-')}-${leafletProvider}`}
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom
        className="w-full h-full rounded-[2.5rem] border"
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
        />
      </MapContainer>
    </div>
  );
}
