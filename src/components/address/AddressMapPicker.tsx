/**
 * @fileoverview MapPicker com Leaflet — sub-componente do AddressComponent.
 * 
 * Responsabilidades:
 * - Renderizar mapa OpenStreetMap interativo (Leaflet)
 * - Input de CEP com busca via ViaCEP
 * - Click-to-place marker no mapa (define lat/lng)
 * - Geocoding via Nominatim após busca de CEP
 * - Auto-fill de street, stateId, cityId, neighborhood a partir do CEP
 * - Exibir link clicável do Google Maps quando lat/lng definidos
 * 
 * Diferenças da versão anterior (map-picker.tsx):
 * - Preenche neighborhood (bairro) automaticamente via CEP
 * - Auto-gera addressLink (Google Maps URL) e seta no form
 * - data-ai-id em todos os elementos
 * - Tipagem melhorada com generics
 */
'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect, useTransition, useCallback } from 'react';
import { UseFormSetValue, Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { consultaCepAction } from '@/lib/actions/cep';
import { buildAddressLink } from '@/lib/helpers/address.helper';
import type { CityInfo, StateInfo } from '@/types';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

// Fix Leaflet's default icon path issue
if (typeof window !== 'undefined') {
  // @ts-expect-error Leaflet internal property not typed
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Marker com click-to-place
// ─────────────────────────────────────────────────────────────────────────────

function LocationMarker({
  latitude,
  longitude,
  setValue,
}: {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  setValue: UseFormSetValue<any>;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(
    latitude && longitude ? L.latLng(latitude, longitude) : null
  );

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setValue('latitude', e.latlng.lat, { shouldDirty: true });
      setValue('longitude', e.latlng.lng, { shouldDirty: true });
      // Auto-gerar addressLink ao clicar no mapa
      const link = buildAddressLink(e.latlng.lat, e.latlng.lng);
      setValue('addressLink', link, { shouldDirty: true });
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

  return position === null ? null : <Marker position={position} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface AddressMapPickerProps {
  /** react-hook-form latitude watched value */
  latitude: number | null | undefined;
  /** react-hook-form longitude watched value */
  longitude: number | null | undefined;
  /** react-hook-form zipCode watched value */
  zipCode: string | null | undefined;
  /** react-hook-form control */
  control: Control<any>;
  /** react-hook-form setValue */
  setValue: UseFormSetValue<any>;
  /** Lista de cidades para resolução de CEP */
  allCities: CityInfo[];
  /** Lista de estados para resolução de CEP */
  allStates: StateInfo[];
  /** 
   * Modo de operação do componente pai.
   * Em modo 'text', preenche city/state como strings ao invés de cityId/stateId.
   * @default 'relational'
   */
  mode?: 'relational' | 'text';
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────────────────────

export default function AddressMapPicker({
  latitude,
  longitude,
  zipCode: _zipCode,
  control,
  setValue,
  allCities,
  allStates,
  mode = 'relational',
}: AddressMapPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCepLookup = useCallback(() => {
    const currentZipCode = control._getWatch('zipCode');
    if (!currentZipCode || currentZipCode.replace(/\D/g, '').length !== 8) {
      toast({
        title: 'CEP inválido',
        description: 'Por favor, insira um CEP com 8 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      const result = await consultaCepAction(currentZipCode);
      if (result.success && result.data) {
        // Preencher logradouro
        setValue('street', result.data.logradouro, { shouldDirty: true });

        // Preencher bairro
        if (result.data.bairro) {
          setValue('neighborhood', result.data.bairro, { shouldDirty: true });
        }

        if (mode === 'relational') {
          // Resolver estado por UF
          const foundState = allStates.find((s) => s.uf === result.data?.uf);
          if (foundState) {
            setValue('stateId', foundState.id?.toString() ?? '', { shouldDirty: true });
          }

          // Resolver cidade por nome + UF
          const foundCity = allCities.find(
            (c) => c.name === result.data?.localidade && c.stateUf === result.data?.uf
          );
          if (foundCity) {
            setValue('cityId', foundCity.id?.toString() ?? '', { shouldDirty: true });
          }
        } else {
          // Modo texto: preencher como strings
          if (result.data.uf) {
            setValue('state', result.data.uf, { shouldDirty: true });
          }
          if (result.data.localidade) {
            setValue('city', result.data.localidade, { shouldDirty: true });
          }
        }

        toast({
          title: 'Endereço encontrado!',
          description: `${result.data.logradouro}, ${result.data.localidade} - ${result.data.uf}`,
        });

        // Geocoding via Nominatim
        try {
          const query = encodeURIComponent(
            `${result.data.logradouro}, ${result.data.localidade}, ${result.data.uf}, Brazil`
          );
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
          );
          const geoData = await geoResponse.json();
          if (geoData && geoData.length > 0) {
            const { lat, lon } = geoData[0];
            const parsedLat = parseFloat(lat);
            const parsedLon = parseFloat(lon);
            setValue('latitude', parsedLat, { shouldDirty: true });
            setValue('longitude', parsedLon, { shouldDirty: true });
            // Auto-gerar addressLink
            const link = buildAddressLink(parsedLat, parsedLon);
            setValue('addressLink', link, { shouldDirty: true });
          } else {
            toast({
              title: 'Geolocalização não encontrada',
              description: 'Não foi possível encontrar as coordenadas para este CEP.',
              variant: 'default',
            });
          }
        } catch (geoError) {
          console.error('Geocoding error:', geoError);
          toast({
            title: 'Erro de Geolocalização',
            description: 'Falha ao buscar coordenadas.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'CEP não encontrado',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  }, [control, setValue, allCities, allStates, mode, toast]);

  if (!isClient) {
    return <div className="h-72 w-full bg-muted animate-pulse rounded-md" data-ai-id="address-map-skeleton" />;
  }

  const center: [number, number] = [
    latitude || -14.235, // Centro do Brasil
    longitude || -51.9253,
  ];
  const zoom = latitude && longitude ? 15 : 4;

  // Google Maps link
  const mapsLink = buildAddressLink(latitude, longitude);

  return (
    <div className="space-y-2" data-ai-id="address-map-picker-container">
      {/* CEP Input + Buscar */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-2">
        <FormField
          control={control}
          name="zipCode"
          render={({ field }) => (
            <FormItem data-ai-id="address-map-cep-input">
              <FormLabel>CEP</FormLabel>
              <FormControl>
                <Input
                  placeholder="00000-000"
                  {...field}
                  value={field.value ?? ''}
                  disabled={isPending}
                  maxLength={9}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="button"
          onClick={handleCepLookup}
          disabled={isPending}
          className="w-full sm:w-auto self-end"
          data-ai-id="address-map-cep-button"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Buscar CEP
        </Button>
      </div>

      {/* Mapa Leaflet */}
      <MapContainer
        key={`${center.join('-')}-${zoom}`}
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-64 w-full rounded-md z-0"
        data-ai-id="address-map-leaflet"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker latitude={latitude} longitude={longitude} setValue={setValue} />
      </MapContainer>

      {/* Link do Google Maps (exibido quando lat/lng existem) */}
      {mapsLink && (
        <div className="flex items-center gap-2 text-sm" data-ai-id="address-map-google-link">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Abrir no Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
