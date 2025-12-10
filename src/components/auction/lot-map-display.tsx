/**
 * @fileoverview Client component that renders lot location maps according to
 * the platform-wide map settings and address fallbacks.
 */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Info, ExternalLink } from 'lucide-react';
import type { Lot, PlatformSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  buildGeocodeQuery,
  buildLocationDescriptor,
  geocodeLocation,
  getDefaultCenter,
  getGoogleEmbedUrl,
  getStaticMapImageUrl,
  getTileLayerConfig,
  normalizeMapProvider,
  type LatLngLiteral,
  type MapProvider,
} from '@/lib/map-utils';

const FALLBACK_ZOOM = 15;

type LotAddressAugmented = Lot & {
  zipCode?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
};

// Fix default Leaflet markers when running inside Next.js
if (typeof window !== 'undefined') {
  // @ts-expect-error Leaflet default icon API is mutable at runtime
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface LotMapDisplayProps {
  lot: Lot;
  platformSettings?: PlatformSettings;
  onOpenMapModal?: () => void;
}

export default function LotMapDisplay({ lot, platformSettings, onOpenMapModal }: LotMapDisplayProps) {
  const [isClient, setIsClient] = useState(false);
  const [resolvedCoords, setResolvedCoords] = useState<LatLngLiteral | null>(() =>
    lot.latitude && lot.longitude ? { lat: lot.latitude, lng: lot.longitude } : null,
  );
  const [isResolvingCoords, setIsResolvingCoords] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const lotWithAddress = lot as LotAddressAugmented;

  const locationDescriptor = useMemo(() => {
    return buildLocationDescriptor({
      ...(lot.auction ?? {}),
      ...lotWithAddress,
      mapAddress: lot.mapAddress ?? lot.auction?.address ?? lotWithAddress.address ?? null,
      address: lot.mapAddress ?? lotWithAddress.address ?? lot.auction?.address ?? null,
      city: lot.cityName ?? lotWithAddress.city ?? null,
      state: lot.stateUf ?? lotWithAddress.state ?? null,
      zipCode: lotWithAddress.zipCode ?? lot.auction?.zipCode ?? null,
      country: 'Brasil',
    });
  }, [lot, lotWithAddress]);

  useEffect(() => {
    let isMounted = true;

    if (lot.latitude && lot.longitude) {
      setResolvedCoords({ lat: lot.latitude, lng: lot.longitude });
      setGeocodeError(null);
      setIsResolvingCoords(false);
      return () => {
        isMounted = false;
      };
    }

    async function resolveLocation() {
      setIsResolvingCoords(true);
      const coords = await geocodeLocation(locationDescriptor);
      if (!isMounted) {
        return;
      }
      setResolvedCoords(coords);
      setGeocodeError(coords ? null : 'Não foi possível converter o endereço em coordenadas.');
      setIsResolvingCoords(false);
    }

    resolveLocation();
    return () => {
      isMounted = false;
    };
  }, [lot.latitude, lot.longitude, locationDescriptor]);

  const provider = normalizeMapProvider(platformSettings);
  const leafletProvider: MapProvider = provider === 'openmap' ? 'openmap' : 'openstreetmap';
  const tileLayerConfig = getTileLayerConfig(leafletProvider);

  const locationQuery = useMemo(() => buildGeocodeQuery(locationDescriptor), [locationDescriptor]);
  const displayLocationLabel = locationDescriptor.mapAddress
    || locationDescriptor.address
    || (locationDescriptor.city && locationDescriptor.state
      ? `${locationDescriptor.city}, ${locationDescriptor.state}`
      : locationDescriptor.city || locationDescriptor.state || 'Localização do Lote');

  const finalExternalMapLink = resolvedCoords
    ? `https://www.google.com/maps/search/?api=1&query=${resolvedCoords.lat},${resolvedCoords.lng}`
    : locationQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`
      : null;

  const googleEmbedUrl = provider === 'google'
    ? getGoogleEmbedUrl({
        coords: resolvedCoords,
        apiKey: platformSettings?.mapSettings?.googleMapsApiKey ?? null,
        query: locationQuery,
        zoom: FALLBACK_ZOOM,
      })
    : null;

  const staticImageUrl = provider === 'staticImage'
    ? getStaticMapImageUrl({
        coords: resolvedCoords,
        apiKey: platformSettings?.mapSettings?.googleMapsApiKey ?? null,
        zoom: FALLBACK_ZOOM,
      })
    : null;

  const shouldRenderLeaflet = !googleEmbedUrl && !staticImageUrl;

  const renderLeafletMap = () => {
    if (!tileLayerConfig) {
      return renderPlaceholder('Camada de mapa não configurada.');
    }

    const center = resolvedCoords ?? getDefaultCenter();
    return (
      <MapContainer
        key={`${lot.id}-${leafletProvider}-${center.lat}-${center.lng}`}
        center={[center.lat, center.lng]}
        zoom={FALLBACK_ZOOM}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution={tileLayerConfig.attribution}
          url={tileLayerConfig.url}
          {...(tileLayerConfig.subdomains ? { subdomains: tileLayerConfig.subdomains } : {})}
        />
        {resolvedCoords && (
          <Marker position={[resolvedCoords.lat, resolvedCoords.lng]}>
            <Popup>
              <strong>{lot.title}</strong>
              <br />
              {displayLocationLabel}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    );
  };

  const renderGoogleEmbed = () => (
    <iframe
      title="Mapa do Lote"
      src={googleEmbedUrl ?? ''}
      className="w-full h-full border-0"
      loading="lazy"
      allowFullScreen
    />
  );

  const renderStaticMap = () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={staticImageUrl ?? ''}
      alt={`Mapa aproximado - ${displayLocationLabel}`}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );

  const renderPlaceholder = (message: string) => (
    <div className="flex flex-col items-center justify-center h-full bg-muted text-muted-foreground p-4 text-center">
      <Info className="h-12 w-12 mb-2" />
      <p>Mapa indisponível</p>
      <p className="text-xs">{message}</p>
    </div>
  );

  const renderMapContent = () => {
    if (!isClient) {
      return <Skeleton className="w-full h-full" />;
    }

    if (isResolvingCoords) {
      return <Skeleton className="w-full h-full" />;
    }

    if (googleEmbedUrl) {
      return renderGoogleEmbed();
    }

    if (staticImageUrl) {
      return renderStaticMap();
    }

    if (!resolvedCoords && geocodeError) {
      return renderPlaceholder(geocodeError);
    }

    return shouldRenderLeaflet ? renderLeafletMap() : renderPlaceholder('Camada de mapa indisponível.');
  };

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
              <span className="truncate max-w-[180px] sm:max-w-xs">{displayLocationLabel}</span>
              <ExternalLink className="h-3 w-3 ml-1.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
              <span className="sr-only">(Abrir mapa em nova aba)</span>
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="aspect-square w-full rounded-b-md overflow-hidden border-t relative">
          {renderMapContent()}
          {isClient && resolvedCoords && onOpenMapModal && (
            <div className="absolute top-2 right-2 z-10">
              <Button size="sm" variant="secondary" onClick={onOpenMapModal} className="shadow-md">
                Ampliar Mapa
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
