// src/components/map-picker.tsx
'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { consultaCepAction } from '@/lib/actions/cep';

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
  setValue: UseFormSetValue<any>;
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
  const [cep, setCep] = useState('');
  const [isCepLoading, setIsCepLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleCepLookup = async () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      toast({ title: 'CEP inválido', description: 'Por favor, insira um CEP com 8 dígitos.', variant: 'destructive'});
      return;
    };
    setIsCepLoading(true);
    const result = await consultaCepAction(cep);
    
    if (result.success && result.data) {
      setValue('street', result.data.logradouro, { shouldDirty: true });
      setValue('neighborhood', result.data.bairro, { shouldDirty: true });
      setValue('city', result.data.localidade, { shouldDirty: true });
      setValue('state', result.data.uf, { shouldDirty: true });
      toast({ title: 'Endereço encontrado!', description: `${result.data.logradouro}, ${result.data.bairro}, ${result.data.localidade} - ${result.data.uf}` });

      // Geocode the address to get lat/lng
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
    setIsCepLoading(false);
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
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
            placeholder="Digite o CEP para buscar o endereço"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            disabled={isCepLoading}
            maxLength={9}
        />
        <Button type="button" onClick={handleCepLookup} disabled={isCepLoading} className="w-full sm:w-auto">
            {isCepLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
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
