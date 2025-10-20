// src/app/admin/settings/maps/page.tsx
/**
 * @fileoverview Página de administração para as configurações de Mapa.
 * Permite que o administrador configure o provedor de mapa e as chaves de API.
 */
'use client';

import React from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import { FormField, FormItem, FormLabel, FormDescription, FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function MapSettingsPage() {
  return (
    <SettingsFormWrapper
      title="Configurações de Mapa"
      description="Escolha o provedor de mapas e gerencie chaves de API."
    >
      {(form) => (
        <>
          <FormField
            control={form.control}
            name="mapSettings.defaultProvider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provedor de Mapa Padrão</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="openstreetmap">OpenStreetMap (Gratuito)</SelectItem>
                    <SelectItem value="google">Google Maps</SelectItem>
                    <SelectItem value="staticImage">Imagem Estática (Fallback)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mapSettings.googleMapsApiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chave de API - Google Maps</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                <FormDescription>Necessário se "Google Maps" for o provedor selecionado.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </SettingsFormWrapper>
  );
}
