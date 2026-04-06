/**
 * @fileoverview Página de configurações de lances (BiddingSettings) — Admin Plus.
 * Formulário singleton que carrega as configurações do tenant e salva via upsert.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Gavel, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { biddingSettingsSchema, type BiddingSettingsFormValues } from './schema';
import { getBiddingSettingsAction, updateBiddingSettingsAction } from './actions';

export default function BiddingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<BiddingSettingsFormValues>({
    resolver: zodResolver(biddingSettingsSchema),
    defaultValues: {
      instantBiddingEnabled: false,
      getBidInfoInstantly: false,
      biddingInfoCheckIntervalSeconds: 30,
      defaultStageDurationDays: 15,
      defaultDaysBetweenStages: 5,
      proxyBiddingEnabled: true,
      softCloseTriggerMinutes: 3,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getBiddingSettingsAction({});
        if (res?.success && res.data) {
          form.reset({
            instantBiddingEnabled: res.data.instantBiddingEnabled ?? false,
            getBidInfoInstantly: res.data.getBidInfoInstantly ?? false,
            biddingInfoCheckIntervalSeconds: res.data.biddingInfoCheckIntervalSeconds ?? 30,
            defaultStageDurationDays: res.data.defaultStageDurationDays ?? 15,
            defaultDaysBetweenStages: res.data.defaultDaysBetweenStages ?? 5,
            proxyBiddingEnabled: res.data.proxyBiddingEnabled ?? true,
            softCloseTriggerMinutes: res.data.softCloseTriggerMinutes ?? 3,
          });
        }
      } catch {
        toast.error('Erro ao carregar configurações de lances.');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const onSubmit = async (values: BiddingSettingsFormValues) => {
    setSaving(true);
    try {
      const res = await updateBiddingSettingsAction(values);
      if (res?.success) {
        toast.success('Configurações de lances salvas com sucesso.');
      } else {
        toast.error(res?.error ?? 'Erro ao salvar.');
      }
    } catch {
      toast.error('Erro inesperado ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-ai-id="bidding-settings-skeleton">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-ai-id="bidding-settings-page">
      <PageHeader title="Configurações de Lances" icon={Gavel} />

      <CrudFormShell form={form} onSubmit={onSubmit}>
        {/* Comportamento Geral */}
        <h3 className="text-lg font-semibold" data-ai-id="bidding-settings-section-general">Comportamento Geral</h3>
        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lance Instantâneo" description="Habilita lances em tempo real sem delay.">
            <div className="flex items-center space-x-2">
              <Switch
                checked={form.watch('instantBiddingEnabled')}
                onCheckedChange={(v) => form.setValue('instantBiddingEnabled', v, { shouldDirty: true })}
                data-ai-id="bidding-settings-instant-enabled"
              />
              <span className="text-sm text-muted-foreground">
                {form.watch('instantBiddingEnabled') ? 'Ativado' : 'Desativado'}
              </span>
            </div>
          </Field>

          <Field label="Info Instantânea de Lance" description="Exibe informações de lances em tempo real para todos.">
            <div className="flex items-center space-x-2">
              <Switch
                checked={form.watch('getBidInfoInstantly')}
                onCheckedChange={(v) => form.setValue('getBidInfoInstantly', v, { shouldDirty: true })}
                data-ai-id="bidding-settings-info-instantly"
              />
              <span className="text-sm text-muted-foreground">
                {form.watch('getBidInfoInstantly') ? 'Ativado' : 'Desativado'}
              </span>
            </div>
          </Field>

          <Field label="Lance por Procuração" description="Permite lances automáticos com valor máximo definido.">
            <div className="flex items-center space-x-2">
              <Switch
                checked={form.watch('proxyBiddingEnabled')}
                onCheckedChange={(v) => form.setValue('proxyBiddingEnabled', v, { shouldDirty: true })}
                data-ai-id="bidding-settings-proxy-enabled"
              />
              <span className="text-sm text-muted-foreground">
                {form.watch('proxyBiddingEnabled') ? 'Ativado' : 'Desativado'}
              </span>
            </div>
          </Field>
        </div>

        {/* Intervalos e Duração */}
        <h3 className="text-lg font-semibold mt-6" data-ai-id="bidding-settings-section-timings">Intervalos e Duração</h3>
        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Intervalo de Verificação (s)" description="Segundos entre verificações de status de lance.">
            <Input
              type="number"
              min={1}
              {...form.register('biddingInfoCheckIntervalSeconds', { valueAsNumber: true })}
              data-ai-id="bidding-settings-check-interval"
            />
          </Field>

          <Field label="Duração Padrão da Praça (dias)" description="Dias padrão para duração de cada praça.">
            <Input
              type="number"
              min={1}
              {...form.register('defaultStageDurationDays', { valueAsNumber: true })}
              data-ai-id="bidding-settings-stage-duration"
            />
          </Field>

          <Field label="Dias entre Praças" description="Intervalo padrão entre praças consecutivas.">
            <Input
              type="number"
              min={0}
              {...form.register('defaultDaysBetweenStages', { valueAsNumber: true })}
              data-ai-id="bidding-settings-days-between"
            />
          </Field>

          <Field label="Soft Close (min)" description="Minutos para extensão automática quando lance é dado perto do encerramento.">
            <Input
              type="number"
              min={1}
              {...form.register('softCloseTriggerMinutes', { valueAsNumber: true })}
              data-ai-id="bidding-settings-soft-close"
            />
          </Field>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} data-ai-id="bidding-settings-save">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </CrudFormShell>
    </div>
  );
}
