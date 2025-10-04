// src/components/address-group.tsx
'use client';

import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from './ui/input';
import MapPicker from './map-picker';
import type { CityInfo, StateInfo } from '@/types';
import EntitySelector from './ui/entity-selector';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';

interface AddressGroupProps {
  form: UseFormReturn<any>;
  allCities: CityInfo[];
  allStates: StateInfo[];
}

export default function AddressGroup({ form, allCities, allStates }: AddressGroupProps) {
  const [states, setStates] = React.useState(allStates);
  const [cities, setCities] = React.useState(allCities);
  const [isFetchingStates, setIsFetchingStates] = React.useState(false);
  const [isFetchingCities, setIsFetchingCities] = React.useState(false);

  const handleRefetchStates = React.useCallback(async () => {
    setIsFetchingStates(true);
    const data = await getStates();
    setStates(data);
    setIsFetchingStates(false);
  }, []);
  
  const handleRefetchCities = React.useCallback(async () => {
    setIsFetchingCities(true);
    const data = await getCities();
    setCities(data);
    setIsFetchingCities(false);
  }, []);
  
  const latitude = form.watch('latitude');
  const longitude = form.watch('longitude');
  const zipCode = form.watch('zipCode');

  return (
    <div className="space-y-4">
      <MapPicker 
        latitude={latitude} 
        longitude={longitude} 
        zipCode={zipCode}
        control={form.control}
        setValue={form.setValue} 
        allCities={cities} 
        allStates={states} 
      />
      <FormField
        control={form.control}
        name="street"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Logradouro (Rua/Avenida)</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Rua das Palmeiras" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 123" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="complement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Ap 101, Bloco B" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="neighborhood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Centro" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="cityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                options={cities.map(c => ({ value: c.id, label: `${c.name} - ${c.stateUf}` }))}
                placeholder="Selecione a cidade"
                searchPlaceholder="Buscar cidade..."
                emptyStateMessage="Nenhuma cidade encontrada."
                onRefetch={handleRefetchCities}
                isFetching={isFetchingCities}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                options={states.map(s => ({ value: s.id, label: s.name }))}
                placeholder="Selecione o estado"
                searchPlaceholder="Buscar estado..."
                emptyStateMessage="Nenhum estado."
                onRefetch={handleRefetchStates}
                isFetching={isFetchingStates}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude</FormLabel>
              <FormControl>
                <Input type="number" step="any" placeholder="-23.550520" {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude</FormLabel>
              <FormControl>
                <Input type="number" step="any" placeholder="-46.633308" {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
