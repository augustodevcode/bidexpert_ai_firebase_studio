/**
 * @fileoverview Preview client-side do mapa de localização do leilão V2.
 */
'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

type LocationMapPreviewProps = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  setValue: (name: 'latitude' | 'longitude', value: number) => void;
};

type MapViewportControllerProps = {
  center: [number, number];
  hasCoordinates: boolean;
  onPickLocation: (latitude: number, longitude: number) => void;
};

function MapViewportController({ center, hasCoordinates, onPickLocation }: MapViewportControllerProps) {
  const map = useMapEvents({
    click(event) {
      onPickLocation(Number(event.latlng.lat), Number(event.latlng.lng));
    },
  });

  useEffect(() => {
    map.invalidateSize();
    map.flyTo(center, hasCoordinates ? 16 : 4, { duration: 0.45 });
  }, [center, hasCoordinates, map]);

  return null;
}

export default function LocationMapPreview({ latitude, longitude, setValue }: LocationMapPreviewProps) {
  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  const center: [number, number] = [
    hasCoordinates ? (latitude as number) : -14.235,
    hasCoordinates ? (longitude as number) : -51.9253,
  ];

  return (
    <MapContainer
      key={`${center.join('-')}-${hasCoordinates ? 'pinned' : 'default'}`}
      center={center}
      zoom={hasCoordinates ? 16 : 4}
      scrollWheelZoom
      className="h-72 w-full rounded-md border border-border z-0"
      data-testid="auction-location-map"
      data-has-coordinates={hasCoordinates ? 'true' : 'false'}
    >
      <MapViewportController
        center={center}
        hasCoordinates={hasCoordinates}
        onPickLocation={(nextLatitude, nextLongitude) => {
          setValue('latitude', nextLatitude);
          setValue('longitude', nextLongitude);
        }}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasCoordinates ? <Marker position={center} /> : null}
    </MapContainer>
  );
}