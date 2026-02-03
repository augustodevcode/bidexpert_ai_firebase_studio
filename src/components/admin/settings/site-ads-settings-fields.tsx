/**
 * @fileoverview Campos de configuração de Publicidade do Site (Super Oportunidades).
 */

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormDescription, FormControl, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import type { PlatformSettingsFormValues } from '@/app/admin/settings/settings-form-schema';

interface SiteAdsSettingsFieldsProps {
  form: UseFormReturn<PlatformSettingsFormValues>;
}

export default function SiteAdsSettingsFields({ form }: SiteAdsSettingsFieldsProps) {
  return (
    <div className="space-y-6" data-ai-id="site-ads-settings-fields">
      <div className="space-y-4 rounded-lg border p-4" data-ai-id="site-ads-settings-toggle">
        <h4 className="font-medium text-foreground" data-ai-id="site-ads-settings-toggle-title">Exibição da Seção</h4>
        <FormField
          control={form.control}
          name="marketingSiteAdsSuperOpportunitiesEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between" data-ai-id="site-ads-super-opportunities-item">
              <div className="space-y-0.5" data-ai-id="site-ads-super-opportunities-label">
                <FormLabel>Super Oportunidades</FormLabel>
                <FormDescription>Habilite ou desabilite a seção Super Oportunidades no site.</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-ai-id="marketing-site-ads-super-opportunities-toggle"
                  data-testid="marketing-site-ads-super-opportunities-toggle"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4 rounded-lg border p-4" data-ai-id="site-ads-settings-scroll">
        <h4 className="font-medium text-foreground" data-ai-id="site-ads-settings-scroll-title">Rolagem do Carousel</h4>
        <FormField
          control={form.control}
          name="marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds"
          render={({ field }) => (
            <FormItem data-ai-id="site-ads-super-opportunities-scroll-item">
              <FormLabel>Frequência de rolagem (segundos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={3}
                  max={60}
                  {...field}
                  value={field.value ?? 6}
                  data-ai-id="marketing-site-ads-super-opportunities-interval"
                  data-testid="marketing-site-ads-super-opportunities-interval"
                />
              </FormControl>
              <FormDescription>Define o intervalo entre as rolagens automáticas do carousel.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
