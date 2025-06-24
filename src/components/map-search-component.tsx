
'use client';

import React, { useEffect, useRef } from 'react';
import L, { type LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Lot, Auction } from '@/types';

// Fix for default Leaflet icon paths in Next.js
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
  const markersRef = useRef<L.LayerGroup | null>(null);
  const programmaticMoveRef = useRef(false);

  // Initialize map only once
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: mapCenter,
        zoom: mapZoom,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
      
      markersRef.current = L.layerGroup().addTo(mapRef.current);

      const onMapMoveEnd = () => {
        if (programmaticMoveRef.current) {
          programmaticMoveRef.current = false; // Reset the flag and do not trigger a state update
          return;
        }
        if (mapRef.current) {
          onBoundsChange(mapRef.current.getBounds());
        }
      };

      mapRef.current.on('moveend', onMapMoveEnd);
    }
    
    // Cleanup function to remove the map instance on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect to update markers when items change
  useEffect(() => {
    if (markersRef.current) {
      markersRef.current.clearLayers();
      items.forEach(item => {
        if (item.latitude && item.longitude) {
          const url = itemType === 'lots'
            ? `/auctions/${(item as Lot).auctionId}/lots/${item.publicId || item.id}`
            : `/auctions/${item.publicId || item.id}`;
          
          const popupContent = `
            <div style="font-family: sans-serif; font-size: 14px;">
              <strong>
                <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1a73e8; text-decoration: none;">
                  ${item.title}
                </a>
              </strong>
              <p style="margin: 4px 0 0;">
                ${itemType === 'lots' 
                  ? `Preço: R$ ${((item as Lot).price || 0).toLocaleString('pt-BR')}` 
                  : `Lotes: ${(item as Auction).totalLots || 0}`
                }
              </p>
            </div>
          `;
          
          L.marker([item.latitude, item.longitude], { icon: defaultIcon })
            .addTo(markersRef.current!)
            .bindPopup(popupContent);
        }
      });
    }
  }, [items, itemType]);

  // Effect to fit bounds when a search is triggered
  useEffect(() => {
    if (mapRef.current && shouldFitBounds) {
      const points = items
        .filter(item => item.latitude && item.longitude)
        .map(item => [item.latitude!, item.longitude!] as [number, number]);
      
      if (points.length > 0) {
        programmaticMoveRef.current = true; // Set flag before programmatic move
        const bounds = L.latLngBounds(points);
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
         programmaticMoveRef.current = true;
         mapRef.current.setView(mapCenter, mapZoom);
      }
    }
  }, [items, shouldFitBounds, mapCenter, mapZoom]); // items dependency is needed here to refit bounds for new search results

  return <div ref={mapContainerRef} className="w-full h-full rounded-lg" style={{zIndex: 0}}></div>;
}
