// src/app/admin/settings/general/page.tsx
/**
 * @fileoverview Página de administração para as Configurações Gerais.
 * Permite que o administrador configure o modo de formulário CRUD, máscaras de ID
 * e flags de funcionalidade como o Monitor de Queries.
 */
'use client';

import React, { useEffect, useState } from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import { FormField, FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const QUERY_MONITOR_LS_KEY = 'admin_query_monitor_enabled';

function QueryMonitorToggle() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(QUERY_MONITOR_LS_KEY);
    setEnabled(stored === 'true');
  }, []);

  const handleChange = (value: boolean) => {
    setEnabled(value);
    localStorage.setItem(QUERY_MONITOR_LS_KEY, String(value));
    // Dispatch a storage event so the admin layout can react without a full page reload
    window.dispatchEvent(new StorageEvent('storage', { key: QUERY_MONITOR_LS_KEY, newValue: String(value) }));
  };

  if (!mounted) return null;

  return (
    <FormItem
      className="flex flex-row items-center justify-between rounded-lg border p-4"
      data-ai-id="query-monitor-toggle-section"
    >
      <div className="space-y-0.5">
        <FormLabel className="text-base">Monitor de Queries (SQL)</FormLabel>
        <FormDescription>
          Exibe um painel fixo no rodapé do admin com logs de queries em tempo real.
          {process.env.NEXT_PUBLIC_QUERY_MONITOR_ENABLED === 'true' && (
            <span className="block mt-1 text-xs text-amber-600">
              ⚠️ Habilitado permanentemente via variável de ambiente NEXT_PUBLIC_QUERY_MONITOR_ENABLED.
            </span>
          )}
        </FormDescription>
      </div>
      <FormControl>
        <Switch
          checked={enabled}
          onCheckedChange={handleChange}
          data-ai-id="query-monitor-toggle"
          disabled={process.env.NEXT_PUBLIC_QUERY_MONITOR_ENABLED === 'true'}
        />
      </FormControl>
    </FormItem>
  );
}

export default function GeneralSettingsPage() {
  return (
    <SettingsFormWrapper
      title="Configurações Gerais"
      description="Gerencie configurações gerais da aplicação como modos de formulário e máscaras de ID."
    >
      {(form) => (
        <>
          <FormField
            control={form.control}
            name="crudFormMode"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Modo de Edição (Admin)</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col sm:flex-row gap-4">
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl><RadioGroupItem value="modal" /></FormControl>
                      <FormLabel className="font-normal">Modal (Janela)</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl><RadioGroupItem value="sheet" /></FormControl>
                      <FormLabel className="font-normal">Painel Lateral (Sheet)</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  Escolha como os formulários de criação/edição serão abertos no painel de administração.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="platformPublicIdMasks.auctionCodeMask" render={({ field }) => (<FormItem><FormLabel>Máscara de ID (Leilões)</FormLabel><FormControl><Input placeholder="LEIL-" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Prefixo para os IDs públicos de leilões.</FormDescription><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="platformPublicIdMasks.lotCodeMask" render={({ field }) => (<FormItem><FormLabel>Máscara de ID (Lotes)</FormLabel><FormControl><Input placeholder="LOTE-" {...field} value={field.value ?? ""} /></FormControl><FormDescription>Prefixo para os IDs públicos de lotes.</FormDescription><FormMessage /></FormItem>)} />

          <Separator />

          <div data-ai-id="developer-tools-section">
            <p className="text-sm font-medium text-foreground mb-3">Ferramentas de Desenvolvedor</p>
            <QueryMonitorToggle />
          </div>
        </>
      )}
    </SettingsFormWrapper>
  );
}
