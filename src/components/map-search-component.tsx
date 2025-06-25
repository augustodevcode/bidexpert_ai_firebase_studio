
'use client';

import React, { useEffect, useRef } from 'react';
import L, { type LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Lot, Auction } from '@/types';

// Fix for default Leaflet icon paths in Next.js
// Use direct URLs to a CDN to avoid bundling issues with image assets on the server.
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const isProgrammaticMove = useRef(false);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(mapCenter, mapZoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
      
      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      
      mapRef.current.on('moveend', () => {
        if (mapRef.current && !isProgrammaticMove.current) {
          onBoundsChange(mapRef.current.getBounds());
        }
        // Reset the flag after any moveend event
        isProgrammaticMove.current = false;
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update markers and view
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    
    markersLayerRef.current.clearLayers();
    
    const validPoints: [number, number][] = [];
    
    items.forEach(item => {
      if (item.latitude && item.longitude) {
        validPoints.push([item.latitude, item.longitude]);
        
        const url = itemType === 'lots'
          ? `/auctions/${(item as Lot).auctionId}/lots/${item.publicId || item.id}`
          : `/auctions/${item.publicId || item.id}`;
        
        const priceOrLots = itemType === 'lots'
          ? `Preço: R$ ${((item as Lot).price || 0).toLocaleString('pt-BR')}`
          : `Lotes: ${(item as Auction).totalLots || 0}`;

        const popupContent = `
            <div style="font-family: sans-serif; font-size: 14px;">
              <strong>
                <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1a73e8; text-decoration: none;">
                  ${item.title}
                </a>
              </strong>
              <p style="margin: 4px 0 0;">
                ${priceOrLots}
              </p>
            </div>
          `;

        L.marker([item.latitude, item.longitude], { icon: defaultIcon })
          .addTo(markersLayerRef.current!)
          .bindPopup(popupContent);
      }
    });

    if (shouldFitBounds && validPoints.length > 0) {
      isProgrammaticMove.current = true;
      const bounds = L.latLngBounds(validPoints);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (!shouldFitBounds) {
      // User is controlling the map, so we don't change the view.
    }
  }, [items, itemType, shouldFitBounds]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-lg" style={{zIndex: 0}}></div>;
}
