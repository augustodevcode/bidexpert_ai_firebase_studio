'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { Lot, Auction } from '@/types';
import type { LatLngBounds } from 'leaflet';

// Dynamically import the inner map component with SSR turned off.
// The loading component will be shown on the server and initial client render.
const MapInner = dynamic(() => import('./map-inner'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full bg-muted rounded-lg flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="ml-2 text-muted-foreground">Carregando Mapa...</p>
    </div>
  ),
});

// The props remain the same for the wrapper component.
interface MapSearchComponentProps {
  items: (Lot | Auction)[];
  itemType: 'lots' | 'auctions';
  mapCenter: [number, number];
  mapZoom: number;
  onBoundsChange: (bounds: LatLngBounds) => void;
  shouldFitBounds: boolean;
}

// This wrapper component now just handles the dynamic import and passes props through.
export default function MapSearchComponent(props: MapSearchComponentProps) {
  return <MapInner {...props} />;
}
