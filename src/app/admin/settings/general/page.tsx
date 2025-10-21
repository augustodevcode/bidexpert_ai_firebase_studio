// src/app/admin/settings/general/page.tsx
/**
 * @fileoverview Página de administração para as Configurações Gerais.
 * Permite que o administrador configure o modo de formulário CRUD e máscaras de ID.
 */
'use client';

import React from 'react';
import SettingsFormWrapper from '../settings-form-wrapper';
import { FormField, FormItem, FormLabel, FormDescription, FormControl } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

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
        </>
      )}
    </SettingsFormWrapper>
  );
}
