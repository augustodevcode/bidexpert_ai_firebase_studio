/**
 * @fileoverview PÃ¡gina de gatilhos mentais (MentalTriggerSettings) â€” Admin Plus.
 * Controle de badges e thresholds para conversÃ£o nos cards.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Brain, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { mentalTriggerSettingsSchema, type MentalTriggerSettingsFormValues } from './schema';
import { getMentalTriggerSettingsAction, updateMentalTriggerSettingsAction } from './actions';

export default function MentalTriggerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<MentalTriggerSettingsFormValues>({
    resolver: zodResolver(mentalTriggerSettingsSchema),
    defaultValues: {
      showDiscountBadge: true,
      showPopularityBadge: true,
      popularityViewThreshold: 500,
      showHotBidBadge: true,
      hotBidThreshold: 10,
      showExclusiveBadge: true,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getMentalTriggerSettingsAction({});
        if (res?.success && res.data) {
          form.reset({
            showDiscountBadge: res.data.showDiscountBadge ?? true,
            showPopularityBadge: res.data.showPopularityBadge ?? true,
            popularityViewThreshold: res.data.popularityViewThreshold ?? 500,
            showHotBidBadge: res.data.showHotBidBadge ?? true,
            hotBidThreshold: res.data.hotBidThreshold ?? 10,
            showExclusiveBadge: res.data.showExclusiveBadge ?? true,
          });
        }
      } catch {
        toast.error('Erro ao carregar configuraÃ§Ãµes de gatilhos mentais.');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const onSubmit = async (values: MentalTriggerSettingsFormValues) => {
    setSaving(true);
    try {
      const res = await updateMentalTriggerSettingsAction(values);
      if (res?.success) {
        toast.success('Gatilhos mentais salvos com sucesso.');
      } else {
        toast.error(res?.error ?? 'Erro ao salvar.');
      }
    } catch {
      toast.error('Erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-ai-id="mental-trigger-settings-skeleton">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div data-ai-id="mental-trigger-settings-page">
      <PageHeader title="Gatilhos Mentais" icon={Brain} />

      <CrudFormShell form={form} onSubmit={onSubmit}>
        <p className="text-sm text-muted-foreground mb-4">
          Configure os badges e limites que estimulam urgÃªncia e conversÃ£o nos cards de lotes.
        </p>
        <Separator className="mb-6" />

        {/* Badge: Desconto */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Field label="Badge de Desconto" description="Exibe etiqueta de desÃ¡gio/desconto nos lotes." className="flex-1">
              <span />
            </Field>
            <Switch
              checked={form.watch('showDiscountBadge')}
              onCheckedChange={(v) => form.setValue('showDiscountBadge', v, { shouldDirty: true })}
              data-ai-id="mental-trigger-discount-badge"
            />
          </div>

          {/* Badge: Popularidade */}
          <div className="flex items-center justify-between gap-4">
            <Field label="Badge de Popularidade" description="Exibe badge quando o lote atinge o threshold de visualizaÃ§Ãµes." className="flex-1">
              <span />
            </Field>
            <Switch
              checked={form.watch('showPopularityBadge')}
              onCheckedChange={(v) => form.setValue('showPopularityBadge', v, { shouldDirty: true })}
              data-ai-id="mental-trigger-popularity-badge"
            />
          </div>

          <Field label="Threshold de Popularidade (views)" description="NÃºmero de visualizaÃ§Ãµes para exibir badge de popularidade.">
            <Input
              type="number"
              min={1}
              {...form.register('popularityViewThreshold', { valueAsNumber: true })}
              data-ai-id="mental-trigger-popularity-threshold"
            />
          </Field>

          {/* Badge: Hot Bid */}
          <div className="flex items-center justify-between gap-4">
            <Field label="Badge de Lance Quente" description="Exibe badge quando o lote recebe muitos lances recentes." className="flex-1">
              <span />
            </Field>
            <Switch
              checked={form.watch('showHotBidBadge')}
              onCheckedChange={(v) => form.setValue('showHotBidBadge', v, { shouldDirty: true })}
              data-ai-id="mental-trigger-hotbid-badge"
            />
          </div>

          <Field label="Threshold de Lances Quentes" description="NÃºmero mÃ­nimo de lances para ativar o badge de lance quente.">
            <Input
              type="number"
              min={1}
              {...form.register('hotBidThreshold', { valueAsNumber: true })}
              data-ai-id="mental-trigger-hotbid-threshold"
            />
          </Field>

          {/* Badge: Exclusivo */}
          <div className="flex items-center justify-between gap-4">
            <Field label="Badge de Exclusividade" description="Exibe etiqueta de lote exclusivo." className="flex-1">
              <span />
            </Field>
            <Switch
              checked={form.watch('showExclusiveBadge')}
              onCheckedChange={(v) => form.setValue('showExclusiveBadge', v, { shouldDirty: true })}
              data-ai-id="mental-trigger-exclusive-badge"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} data-ai-id="mental-trigger-settings-save">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar ConfiguraÃ§Ãµes
          </Button>
        </div>
      </CrudFormShell>
    </div>
  );
}
