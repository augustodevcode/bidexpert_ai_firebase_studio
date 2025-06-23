
'use client';

import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';
import type { Map, LayerGroup, LatLngBounds } from 'leaflet';
import type { Lot, Auction } from '@/types';

interface MapSearchComponentProps {
  items: (Lot | Auction)[];
  itemType: 'lots' | 'auctions';
  mapCenter: [number, number];
  mapZoom: number;
  onBoundsChange: (bounds: LatLngBounds) => void;
  shouldFitBounds: boolean;
}

export default function MapSearchComponent({ items, itemType, mapCenter, mapZoom, onBoundsChange, shouldFitBounds }: MapSearchComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);

  // Effect for ONE-TIME map initialization and cleanup
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      (async () => {
        const L = (await import('leaflet')).default;

        // @ts-ignore - Fix for default icon paths with webpack
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default.src,
          iconUrl: require('leaflet/dist/images/marker-icon.png').default.src,
          shadowUrl: require('leaflet/dist/images/marker-shadow.png').default.src,
        });

        mapRef.current = L.map(mapContainerRef.current, {
            center: mapCenter,
            zoom: mapZoom
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);
        
        markersRef.current = L.layerGroup().addTo(mapRef.current);

        mapRef.current.on('moveend', () => {
          if (mapRef.current) {
            onBoundsChange(mapRef.current.getBounds());
          }
        });
      })();
    }
    
    // Cleanup function to run when the component is unmounted
    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to update map view when center or zoom props change, but not when fitting bounds
  useEffect(() => {
    if (mapRef.current && !shouldFitBounds) {
        mapRef.current.setView(mapCenter, mapZoom, { animate: true });
    }
  }, [mapCenter, mapZoom, shouldFitBounds]);


  // Effect to update markers when items or `shouldFitBounds` change
  useEffect(() => {
    if (mapRef.current && markersRef.current && items) {
      (async () => {
        const L = (await import('leaflet')).default;
        markersRef.current!.clearLayers();

        items.forEach(item => {
          let lat, lng, popupContent, url;
          
          if ('latitude' in item && 'longitude' in item && item.latitude && item.longitude) {
            lat = item.latitude;
            lng = item.longitude;
            
            if (itemType === 'lots') {
                url = `/auctions/${(item as Lot).auctionId}/lots/${item.publicId || item.id}`;
                popupContent = `
                <strong><a href="${url}" target="_blank" rel="noopener noreferrer">${item.title}</a></strong>
                <p>Preço: R$ ${(item as Lot).price.toLocaleString('pt-BR')}</p>
                `;
            } else {
                 url = `/auctions/${item.publicId || item.id}`;
                 popupContent = `
                <strong><a href="${url}" target="_blank" rel="noopener noreferrer">${item.title}</a></strong>
                <p>Lotes: ${(item as Auction).totalLots || 0}</p>
                `;
            }
          } else {
             return; 
          }

          if (lat !== undefined && lng !== undefined) {
            const marker = L.marker([lat, lng]);
            if (popupContent) {
              marker.bindPopup(popupContent);
            }
            if (markersRef.current) {
              markersRef.current.addLayer(marker);
            }
          }
        });
        
        if (shouldFitBounds && markersRef.current.getLayers().length > 0) {
            mapRef.current?.fitBounds(markersRef.current.getBounds(), { padding: [50, 50], animate: true });
        }
      })();
    }
  }, [items, itemType, shouldFitBounds]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}
