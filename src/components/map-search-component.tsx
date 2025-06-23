
'use client';

import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';
import type { Map, LayerGroup } from 'leaflet';
import type { Lot, Auction } from '@/types';

interface MapSearchComponentProps {
  items: (Lot | Auction)[];
  itemType: 'lots' | 'auctions';
}

export default function MapSearchComponent({ items, itemType }: MapSearchComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);

  const mapCenter: [number, number] = [-14.235, -51.9253]; // Center of Brazil
  const defaultZoom = 4;

  useEffect(() => {
    // This effect runs only once on mount to initialize the map
    if (mapContainerRef.current && !mapRef.current) {
      (async () => {
        // Dynamically import leaflet only on the client
        const L = (await import('leaflet')).default;

        // Fix for default icon paths in webpack environments (like Next.js)
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default.src,
          iconUrl: require('leaflet/dist/images/marker-icon.png').default.src,
          shadowUrl: require('leaflet/dist/images/marker-shadow.png').default.src,
        });

        // Initialize the map
        mapRef.current = L.map(mapContainerRef.current, {
          center: mapCenter,
          zoom: defaultZoom,
          scrollWheelZoom: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);
        
        // Initialize the layer group for markers and add it to the map
        markersRef.current = L.layerGroup().addTo(mapRef.current);
      })();
    }

    // Cleanup function to remove the map instance when the component unmounts
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    // This effect runs whenever the items or the map instance change
    if (mapRef.current && markersRef.current && items) {
      (async () => {
        const L = (await import('leaflet')).default;

        // Clear existing markers from the layer group
        markersRef.current.clearLayers();

        items.forEach(item => {
          let lat, lng, title, popupContent, url;
          
          if ('latitude' in item && 'longitude' in item && item.latitude && item.longitude) {
            lat = item.latitude;
            lng = item.longitude;
            title = item.title;
            url = `/auctions/${item.auctionId}/lots/${item.publicId || item.id}`;
            popupContent = `
              <strong><a href="${url}" target="_blank" rel="noopener noreferrer">${item.title}</a></strong>
              <p>Preço: R$ ${(item as Lot).price.toLocaleString('pt-BR')}</p>
            `;
          }
          // Placeholder logic for auctions if they need to be shown on the map
          else if (itemType === 'auctions' && 'city' in item) {
             // We can't map auctions without coordinates, so we'd skip them
             return;
          }

          if (lat !== undefined && lng !== undefined) {
            const marker = L.marker([lat, lng]);
            if (popupContent) {
              marker.bindPopup(popupContent);
            }
            if (markersRef.current) {
              markersRef.current.addLayer(marker); // Add marker to the group
            }
          }
        });
        
        // Fit map bounds to the new markers if there are any
        if (markersRef.current && markersRef.current.getLayers().length > 0) {
            mapRef.current?.fitBounds(markersRef.current.getBounds(), { padding: [50, 50] });
        } else if (items.length === 0) {
            // If no items, reset to default view
            mapRef.current?.setView(mapCenter, defaultZoom);
        }

      })();
    }
  }, [items, itemType]); // Rerun when items change

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}
