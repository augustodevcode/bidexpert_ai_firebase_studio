'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L, { type LatLngBounds } from 'leaflet';
import React, { useEffect, useMemo, useCallback } from 'react';
import type { Lot, Auction } from '@/types';

// Fix for default icon paths with webpack, which is the recommended approach for react-leaflet with bundlers like Next.js
// This ensures that the marker images are correctly bundled and loaded.
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default.src,
    iconUrl: require('leaflet/dist/images/marker-icon.png').default.src,
    shadowUrl: require('leaflet/dist/images/marker-shadow.png').default.src,
});


// Internal component to handle map events
function MapEvents({ onBoundsChange }: { onBoundsChange: (bounds: LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
    },
    zoomend: () => {
      onBoundsChange(map.getBounds());
    }
  });
  return null;
}

// Internal component to handle auto-fitting bounds
function ChangeView({ bounds }: { bounds: LatLngBounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
    }, [bounds, map]);
    return null;
}

interface MapInnerProps {
  items: (Lot | Auction)[];
  itemType: 'lots' | 'auctions';
  mapCenter: [number, number];
  mapZoom: number;
  onBoundsChange: (bounds: LatLngBounds) => void;
  shouldFitBounds: boolean;
}

export default function MapInner({ items, itemType, mapCenter, mapZoom, onBoundsChange, shouldFitBounds }: MapInnerProps) {

  const markers = useMemo(() => {
    return items.map(item => {
      if ('latitude' in item && 'longitude' in item && item.latitude && item.longitude) {
        const url = itemType === 'lots'
          ? `/auctions/${(item as Lot).auctionId}/lots/${(item as Lot).publicId || item.id}`
          : `/auctions/${item.publicId || item.id}`;

        const popupContent = `
          <strong><a href="${url}" target="_blank" rel="noopener noreferrer">${item.title}</a></strong>
          <p>${itemType === 'lots' ? `Preço: R$ ${(item as Lot).price.toLocaleString('pt-BR')}` : `Lotes: ${(item as Auction).totalLots || 0}`}</p>
        `;

        return (
          <Marker key={item.id} position={[item.latitude, item.longitude]}>
            <Popup>{popupContent}</Popup>
          </Marker>
        );
      }
      return null;
    }).filter(Boolean);
  }, [items, itemType]);

  const bounds = useMemo(() => {
    const points: [number, number][] = [];
    items.forEach(item => {
        if ('latitude' in item && 'longitude' in item && item.latitude && item.longitude) {
            points.push([item.latitude, item.longitude]);
        }
    });
    if (points.length > 0) {
        return new L.LatLngBounds(points);
    }
    return null;
  }, [items]);

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={mapZoom} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers}
      <MapEvents onBoundsChange={onBoundsChange} />
      {shouldFitBounds && bounds && <ChangeView bounds={bounds} />}
    </MapContainer>
  );
}
