// src/components/map-picker.tsx
'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect, useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';

// Fix Leaflet's default icon path issue
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  setValue: UseFormSetValue<any>; // react-hook-form's setValue
}

function LocationMarker({ latitude, longitude, setValue }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    latitude && longitude ? L.latLng(latitude, longitude) : null
  );

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setValue('latitude', e.latlng.lat, { shouldDirty: true });
      setValue('longitude', e.latlng.lng, { shouldDirty: true });
    },
  });
  
   useEffect(() => {
    if (latitude && longitude) {
      const newPos = L.latLng(latitude, longitude);
      if (!position || !position.equals(newPos)) {
        setPosition(newPos);
        map.flyTo(newPos, 15);
      }
    }
  }, [latitude, longitude, map, position]);


  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPicker({ latitude, longitude, setValue }: MapPickerProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div className="h-64 w-full bg-muted animate-pulse rounded-md" />;
    }

    const center: [number, number] = [
        latitude || -14.235, // Default to center of Brazil
        longitude || -51.9253
    ];
    const zoom = latitude && longitude ? 15 : 4;

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-64 w-full rounded-md z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker latitude={latitude} longitude={longitude} setValue={setValue} />
    </MapContainer>
  );
}
