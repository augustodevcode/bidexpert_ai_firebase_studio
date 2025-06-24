'use client';

import React, { useEffect, useRef } from 'react';
import L, { type LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Lot, Auction } from '@/types';

// Fix for default Leaflet icon paths in Next.js
// This needs to be done BEFORE any markers are created.
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map only once
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Create map instance
      mapRef.current = L.map(mapContainerRef.current, {
        center: mapCenter,
        zoom: mapZoom,
        scrollWheelZoom: true,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Add marker layer group
      markersRef.current = L.layerGroup().addTo(mapRef.current);
      
      // Add event listeners for bounds changes
      mapRef.current.on('moveend', () => {
        if (mapRef.current) {
          onBoundsChange(mapRef.current.getBounds());
        }
      });
      mapRef.current.on('zoomend', () => {
        if (mapRef.current) {
          onBoundsChange(mapRef.current.getBounds());
        }
      });
    }

    // Cleanup function to remove the map instance
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once

  // Effect to update map view (center/zoom/bounds)
  useEffect(() => {
    if (mapRef.current) {
      if (shouldFitBounds && items.length > 0) {
        const points = items
          .filter(item => item.latitude && item.longitude)
          .map(item => [item.latitude, item.longitude] as [number, number]);
        
        if (points.length > 0) {
          const bounds = L.latLngBounds(points);
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      } else {
         mapRef.current.setView(mapCenter, mapZoom);
      }
    }
  }, [mapCenter, mapZoom, shouldFitBounds, items]);


  // Effect to update markers
  useEffect(() => {
    if (markersRef.current) {
      markersRef.current.clearLayers();
      items
        .filter(item => item.latitude && item.longitude)
        .forEach(item => {
          const url = itemType === 'lots'
            ? `/auctions/${(item as Lot).auctionId}/lots/${item.publicId || item.id}`
            : `/auctions/${item.publicId || item.id}`;
          
          const popupContent = `
            <div>
              <strong>
                <a href="${url}" target="_blank" rel="noopener noreferrer">
                  ${item.title}
                </a>
              </strong>
              <p>
                ${itemType === 'lots' 
                  ? `Preço: R$ ${((item as Lot).price || 0).toLocaleString('pt-BR')}` 
                  : `Lotes: ${(item as Auction).totalLots || 0}`
                }
              </p>
            </div>
          `;
          
          L.marker([item.latitude!, item.longitude!])
            .addTo(markersRef.current!)
            .bindPopup(popupContent);
        });
    }
  }, [items, itemType]);

  return (
    <div ref={mapContainerRef} className="w-full h-full rounded-lg" style={{zIndex: 0}}></div>
  );
}