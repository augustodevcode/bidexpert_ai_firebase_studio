
'use client';

import type { Lot, PlatformSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Info, ExternalLink } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LotMapDisplayProps {
  lot: Lot;
  platformSettings?: PlatformSettings;
}

export default function LotMapDisplay({ lot }: LotMapDisplayProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const { latitude, longitude, mapAddress, title } = lot;

  const displayAddressTextForLink = mapAddress || (lot.cityName && lot.stateUf ? `${lot.cityName}, ${lot.stateUf}` : "Localização do Lote");

  const hasCoords = latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;

  useEffect(() => {
    // Only initialize map if we have coordinates and a container
    if (hasCoords && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([latitude, longitude], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Add the blue marker
      L.marker([latitude, longitude]).addTo(mapRef.current)
        .bindPopup(`<b>${title}</b><br>${displayAddressTextForLink}`);

      // Invalidate size after a short delay to ensure container is sized and centered correctly
      setTimeout(() => {
          mapRef.current?.invalidateSize();
      }, 100);
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // The dependencies should ensure the map re-initializes if the lot changes
  }, [latitude, longitude, hasCoords, title, displayAddressTextForLink]);

  let finalExternalMapLink: string | null = null;
  if (latitude && longitude) {
    finalExternalMapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  } else if (mapAddress) {
    finalExternalMapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`;
  }

  return (
    <Card className="shadow-md w-full">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" /> Localização
          </CardTitle>
          {finalExternalMapLink && (
            <a
              href={finalExternalMapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center group"
            >
              <span className="truncate max-w-[180px] sm:max-w-xs">{displayAddressTextForLink}</span>
              <ExternalLink className="h-3 w-3 ml-1.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
              <span className="sr-only">(Abrir mapa em nova aba)</span>
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="aspect-square w-full rounded-b-md overflow-hidden border-t relative">
          {hasCoords ? (
            <div ref={mapContainerRef} className="w-full h-full" style={{zIndex: 0}}></div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-muted text-muted-foreground p-4 text-center">
              <Info className="h-12 w-12 mb-2" />
              <p>Mapa indisponível para este lote.</p>
              <p className="text-xs">Não foram fornecidas coordenadas de localização.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
