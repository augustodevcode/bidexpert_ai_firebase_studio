// src/components/map-picker.tsx
'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect, useTransition } from 'react';
import { UseFormSetValue, Control } from 'react-hook-form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { consultaCepAction } from '@/lib/actions/cep';
import type { CityInfo, StateInfo } from '@/types';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from './ui/form';

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
  zipCode: string | null | undefined;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  allCities: CityInfo[];
  allStates: StateInfo[];
}

function LocationMarker({ latitude, longitude, setValue }: Pick<MapPickerProps, 'latitude' | 'longitude' | 'setValue'>) {
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

export default function MapPicker({ latitude, longitude, zipCode, control, setValue, allCities, allStates }: MapPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleCepLookup = () => {
    const currentZipCode = control._getWatch("zipCode");
    if (!currentZipCode || currentZipCode.replace(/\D/g, '').length !== 8) {
      toast({ title: 'CEP inválido', description: 'Por favor, insira um CEP com 8 dígitos.', variant: 'destructive'});
      return;
    };
    
    startTransition(async () => {
      const result = await consultaCepAction(currentZipCode);
      if (result.success && result.data) {
          setValue('street', result.data.logradouro, { shouldDirty: true });
          
            const foundState = allStates.find(s => s.uf === result.data?.uf);
          if (foundState) {
              setValue('stateId', foundState.id?.toString() ?? '', { shouldDirty: true });
          }
          
            const foundCity = allCities.find(c => c.name === result.data?.localidade && c.stateUf === result.data?.uf);
          if (foundCity) {
              setValue('cityId', foundCity.id?.toString() ?? '', { shouldDirty: true });
          }

          toast({ title: 'Endereço encontrado!', description: `${result.data.logradouro}, ${result.data.localidade} - ${result.data.uf}` });

          try {
              const query = encodeURIComponent(`${result.data.logradouro}, ${result.data.localidade}, ${result.data.uf}, Brazil`);
              const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
              const geoData = await geoResponse.json();
              if (geoData && geoData.length > 0) {
                  const { lat, lon } = geoData[0];
                  setValue('latitude', parseFloat(lat), { shouldDirty: true });
                  setValue('longitude', parseFloat(lon), { shouldDirty: true });
              } else {
                   toast({ title: 'Geolocalização não encontrada', description: 'Não foi possível encontrar as coordenadas para este CEP.', variant: 'default'});
              }
          } catch (geoError) {
              console.error("Geocoding error:", geoError);
              toast({ title: 'Erro de Geolocalização', description: 'Falha ao buscar coordenadas.', variant: 'destructive'});
          }

      } else {
        toast({ title: 'CEP não encontrado', description: result.message, variant: 'destructive'});
      }
    });
  };

  if (!isClient) {
    return <div className="h-72 w-full bg-muted animate-pulse rounded-md" />;
  }

  const center: [number, number] = [
    latitude || -14.235, // Default to center of Brazil
    longitude || -51.9253
  ];
  const zoom = latitude && longitude ? 15 : 4;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-2">
          <FormField
              control={control}
              name="zipCode"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                          <Input
                              placeholder="00000-000"
                              {...field}
                              disabled={isPending}
                              maxLength={9} // Allows for the hyphen
                          />
                      </FormControl>
                  </FormItem>
              )}
          />
          <Button type="button" onClick={handleCepLookup} disabled={isPending} className="w-full sm:w-auto self-end">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
              Buscar CEP
          </Button>
      </div>
       <MapContainer key={`${center.join('-')}-${zoom}`} center={center} zoom={zoom} scrollWheelZoom={true} className="h-64 w-full rounded-md z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker latitude={latitude} longitude={longitude} setValue={setValue} />
      </MapContainer>
    </div>
  );
}
