// src/app/admin/settings/bidding/page.tsx
/**
 * @fileoverview Página de administração para as configurações de Lances.
 * Permite que o administrador configure as regras de lances da plataforma.
 */
'use client';

import React from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import { FormField, FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export default function BiddingSettingsPage() {
  return (
    <SettingsFormWrapper
      title="Regras de Lances"
      description="Defina como os lances funcionam na plataforma."
    >
      {(form) => (
        <>
          <FormField
            control={form.control}
            name="biddingSettings.instantBiddingEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Habilitar Lances Instantâneos</FormLabel>
                  <FormDescription>Permitir que lances sejam aceitos sem confirmação adicional.</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="biddingSettings.biddingInfoCheckIntervalSeconds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intervalo de Atualização (Segundos)</FormLabel>
                <FormControl><Input type="number" {...field} value={field.value || 1} /></FormControl>
                <FormDescription>Intervalo em segundos para o sistema verificar novas informações de lances em tempo real.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </SettingsFormWrapper>
  );
}
