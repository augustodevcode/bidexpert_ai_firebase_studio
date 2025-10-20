// src/app/admin/settings/triggers/page.tsx
/**
 * @fileoverview Página de administração para as configurações de Gatilhos Mentais e Badges.
 * Permite ao administrador configurar regras para exibir badges de marketing nos cards.
 */
'use client';

import React from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import { FormField, FormItem, FormLabel, FormDescription, FormControl } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export default function TriggerSettingsPage() {
  return (
    <SettingsFormWrapper
      title="Gatilhos Mentais e Badges"
      description="Gerencie os badges de marketing que aparecem nos cards para aumentar o engajamento."
    >
      {(form) => (
        <>
          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium text-foreground">Visibilidade dos Badges</h4>
            <FormField
              control={form.control}
              name="sectionBadgeVisibility.searchGrid.showDiscountBadge"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between"><div className="space-y-0.5"><FormLabel>Badge de Desconto</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sectionBadgeVisibility.searchGrid.showHotBidBadge"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between"><div className="space-y-0.5"><FormLabel>Badge de "Lance Quente"</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )}
            />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
             <h4 className="font-medium text-foreground">Limites dos Gatilhos</h4>
             <FormField
                control={form.control}
                name="mentalTriggerSettings.hotBidThreshold"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Limite para "Lance Quente"</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value ?? 10} /></FormControl>
                    <FormDescription>Número de lances para um lote ser considerado "quente".</FormDescription>
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="mentalTriggerSettings.popularityViewThreshold"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Limite para "Mais Visitado"</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value ?? 500} /></FormControl>
                    <FormDescription>Número de visualizações para um lote ser considerado popular.</FormDescription>
                </FormItem>
                )}
            />
          </div>
        </>
      )}
    </SettingsFormWrapper>
  );
}
