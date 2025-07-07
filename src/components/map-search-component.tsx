
// src/components/map-search-component.tsx
'use client';

import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngBounds } from 'leaflet';
import type { Lot, Auction } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

// Fix for default Leaflet icon paths in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


// Helper component to handle map events and imperative calls
function MapController({ items, onBoundsChange, shouldFitBounds }: {
  items: (Lot | Auction)[],
  onBoundsChange: (bounds: LatLngBounds) => void;
  shouldFitBounds: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const handleMoveEnd = () => {
      onBoundsChange(map.getBounds());
    };
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onBoundsChange]);

  useEffect(() => {
    if (shouldFitBounds) {
      const validPoints: [number, number][] = items
        .map(item => (item.latitude && item.longitude ? [item.latitude, item.longitude] : null))
        .filter((p): p is [number, number] => p !== null);
      
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [map, items, shouldFitBounds]);

  return null;
}


interface MapSearchComponentProps {
  items: (Lot | Auction)[];
  itemType: 'lots' | 'auctions';
  mapCenter: [number, number];
  mapZoom: number;
  onBoundsChange: (bounds: LatLngBounds) => void;
  shouldFitBounds: boolean;
}

export default function MapSearchComponent({
  items,
  itemType,
  mapCenter,
  mapZoom,
  onBoundsChange,
  shouldFitBounds
}: MapSearchComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const mapKeyRef = useRef(`map-${Date.now()}-${Math.random()}`); // Stable key

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <Skeleton className="w-full h-full rounded-lg" />;
  }

  return (
    <MapContainer
      key={mapKeyRef.current} // Use a stable key
      center={mapCenter}
      zoom={mapZoom}
      scrollWheelZoom={true}
      className="w-full h-full rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map(item => {
        if (item.latitude && item.longitude) {
          const url = itemType === 'lots'
            ? `/auctions/${(item as Lot).auctionId}/lots/${item.publicId || item.id}`
            : `/auctions/${item.publicId || item.id}`;

          const priceOrLots = itemType === 'lots'
            ? `Lance: R$ ${((item as Lot).price || 0).toLocaleString('pt-BR')}`
            : `Lotes: ${(item as Auction).totalLots || 0}`;

          return (
            <Marker key={item.id} position={[item.latitude, item.longitude]}>
              <Popup>
                <div style={{ fontFamily: 'sans-serif', fontSize: '14px' }}>
                  <strong>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8', textDecoration: 'none' }}>
                      {item.title}
                    </a>
                  </strong>
                  <p style={{ margin: '4px 0 0' }}>{priceOrLots}</p>
                </div>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}
      <MapController items={items} onBoundsChange={onBoundsChange} shouldFitBounds={shouldFitBounds} />
    </MapContainer>
  );
}
