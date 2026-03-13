/**
 * @fileoverview Página de configurações Realtime e Feature Flags — Admin Plus.
 * Formulário com 5 seções: Blockchain, Soft Close, Portal Advogado, Estratégias, Feature Flags.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Radio, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { realtimeSettingsSchema, type RealtimeSettingsFormValues } from './schema';
import { getRealtimeSettingsAction, updateRealtimeSettingsAction } from './actions';

export default function RealtimeSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<RealtimeSettingsFormValues>({
    resolver: zodResolver(realtimeSettingsSchema),
    defaultValues: {
      blockchainEnabled: false,
      blockchainNetwork: 'NONE',
      softCloseEnabled: false,
      softCloseMinutes: 5,
      lawyerPortalEnabled: true,
      lawyerMonetizationModel: 'SUBSCRIPTION',
      lawyerSubscriptionPrice: null,
      lawyerPerUsePrice: null,
      lawyerRevenueSharePercent: null,
      communicationStrategy: 'WEBSOCKET',
      videoStrategy: 'DISABLED',
      idempotencyStrategy: 'SERVER_HASH',
      fipeIntegrationEnabled: false,
      cartorioIntegrationEnabled: false,
      tribunalIntegrationEnabled: false,
      pwaEnabled: true,
      offlineFirstEnabled: false,
      maintenanceMode: false,
      debugLogsEnabled: false,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getRealtimeSettingsAction({});
        if (res?.success && res.data) {
          const d = res.data;
          form.reset({
            blockchainEnabled: d.blockchainEnabled ?? false,
            blockchainNetwork: d.blockchainNetwork ?? 'NONE',
            softCloseEnabled: d.softCloseEnabled ?? false,
            softCloseMinutes: d.softCloseMinutes ?? 5,
            lawyerPortalEnabled: d.lawyerPortalEnabled ?? true,
            lawyerMonetizationModel: d.lawyerMonetizationModel ?? 'SUBSCRIPTION',
            lawyerSubscriptionPrice: d.lawyerSubscriptionPrice ?? null,
            lawyerPerUsePrice: d.lawyerPerUsePrice ?? null,
            lawyerRevenueSharePercent: d.lawyerRevenueSharePercent != null ? Number(d.lawyerRevenueSharePercent) : null,
            communicationStrategy: (d.communicationStrategy as 'WEBSOCKET' | 'POLLING') ?? 'WEBSOCKET',
            videoStrategy: (d.videoStrategy as 'HLS' | 'WEBRTC' | 'DISABLED') ?? 'DISABLED',
            idempotencyStrategy: (d.idempotencyStrategy as 'SERVER_HASH' | 'CLIENT_UUID') ?? 'SERVER_HASH',
            fipeIntegrationEnabled: d.fipeIntegrationEnabled ?? false,
            cartorioIntegrationEnabled: d.cartorioIntegrationEnabled ?? false,
            tribunalIntegrationEnabled: d.tribunalIntegrationEnabled ?? false,
            pwaEnabled: d.pwaEnabled ?? true,
            offlineFirstEnabled: d.offlineFirstEnabled ?? false,
            maintenanceMode: d.maintenanceMode ?? false,
            debugLogsEnabled: d.debugLogsEnabled ?? false,
          });
        }
      } catch {
        toast.error('Erro ao carregar configurações realtime.');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const onSubmit = async (values: RealtimeSettingsFormValues) => {
    setSaving(true);
    try {
      const res = await updateRealtimeSettingsAction(values);
      if (res?.success) {
        toast.success('Configurações realtime salvas com sucesso.');
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
      <div className="space-y-6" data-ai-id="realtime-settings-skeleton">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  return (
    <div data-ai-id="realtime-settings-page">
      <PageHeader title="Configurações Realtime e Feature Flags" icon={Radio} />

      <CrudFormShell form={form} onSubmit={onSubmit}>
        {/* ── Blockchain ── */}
        <h3 className="text-base font-semibold">Blockchain</h3>
        <Separator className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Field label="Blockchain Habilitado">
            <Switch
              checked={form.watch('blockchainEnabled')}
              onCheckedChange={(v) => form.setValue('blockchainEnabled', v, { shouldDirty: true })}
              data-ai-id="realtime-blockchain-enabled"
            />
          </Field>
          <Field label="Rede Blockchain">
            <Input {...form.register('blockchainNetwork')} data-ai-id="realtime-blockchain-network" />
          </Field>
        </div>

        {/* ── Soft Close ── */}
        <h3 className="text-base font-semibold">Soft Close (Encerramento Estendido)</h3>
        <Separator className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Field label="Soft Close Habilitado">
            <Switch
              checked={form.watch('softCloseEnabled')}
              onCheckedChange={(v) => form.setValue('softCloseEnabled', v, { shouldDirty: true })}
              data-ai-id="realtime-softclose-enabled"
            />
          </Field>
          <Field label="Minutos de Extensão">
            <Input type="number" min={1} {...form.register('softCloseMinutes', { valueAsNumber: true })} data-ai-id="realtime-softclose-minutes" />
          </Field>
        </div>

        {/* ── Portal do Advogado ── */}
        <h3 className="text-base font-semibold">Portal do Advogado</h3>
        <Separator className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Field label="Portal Habilitado">
            <Switch
              checked={form.watch('lawyerPortalEnabled')}
              onCheckedChange={(v) => form.setValue('lawyerPortalEnabled', v, { shouldDirty: true })}
              data-ai-id="realtime-lawyer-portal"
            />
          </Field>
          <Field label="Modelo de Monetização">
            <Select
              value={form.watch('lawyerMonetizationModel') ?? 'SUBSCRIPTION'}
              onValueChange={(v) => form.setValue('lawyerMonetizationModel', v, { shouldDirty: true })}
            >
              <SelectTrigger data-ai-id="realtime-lawyer-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUBSCRIPTION">Assinatura</SelectItem>
                <SelectItem value="PER_USE">Por Uso</SelectItem>
                <SelectItem value="REVENUE_SHARE">Revenue Share</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Preço Assinatura (centavos)">
            <Input type="number" {...form.register('lawyerSubscriptionPrice', { valueAsNumber: true })} data-ai-id="realtime-lawyer-sub-price" />
          </Field>
          <Field label="Preço Por Uso (centavos)">
            <Input type="number" {...form.register('lawyerPerUsePrice', { valueAsNumber: true })} data-ai-id="realtime-lawyer-peruse-price" />
          </Field>
          <Field label="Revenue Share (%)">
            <Input type="number" step={0.01} min={0} max={100} {...form.register('lawyerRevenueSharePercent', { valueAsNumber: true })} data-ai-id="realtime-lawyer-revshare" />
          </Field>
        </div>

        {/* ── Estratégias V2 ── */}
        <h3 className="text-base font-semibold">Estratégias de Comunicação</h3>
        <Separator className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Field label="Comunicação">
            <Select
              value={form.watch('communicationStrategy')}
              onValueChange={(v) => form.setValue('communicationStrategy', v as 'WEBSOCKET' | 'POLLING', { shouldDirty: true })}
            >
              <SelectTrigger data-ai-id="realtime-comm-strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEBSOCKET">WebSocket</SelectItem>
                <SelectItem value="POLLING">Polling</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Vídeo">
            <Select
              value={form.watch('videoStrategy')}
              onValueChange={(v) => form.setValue('videoStrategy', v as 'HLS' | 'WEBRTC' | 'DISABLED', { shouldDirty: true })}
            >
              <SelectTrigger data-ai-id="realtime-video-strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HLS">HLS</SelectItem>
                <SelectItem value="WEBRTC">WebRTC</SelectItem>
                <SelectItem value="DISABLED">Desabilitado</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Idempotência">
            <Select
              value={form.watch('idempotencyStrategy')}
              onValueChange={(v) => form.setValue('idempotencyStrategy', v as 'SERVER_HASH' | 'CLIENT_UUID', { shouldDirty: true })}
            >
              <SelectTrigger data-ai-id="realtime-idempotency-strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SERVER_HASH">Server Hash</SelectItem>
                <SelectItem value="CLIENT_UUID">Client UUID</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* ── Feature Flags ── */}
        <h3 className="text-base font-semibold">Feature Flags</h3>
        <Separator className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ['fipeIntegrationEnabled', 'Integração FIPE'],
            ['cartorioIntegrationEnabled', 'Integração Cartório'],
            ['tribunalIntegrationEnabled', 'Integração Tribunal'],
            ['pwaEnabled', 'PWA Habilitado'],
            ['offlineFirstEnabled', 'Offline-First'],
            ['maintenanceMode', 'Modo Manutenção'],
            ['debugLogsEnabled', 'Debug Logs'],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <span className="text-sm font-medium">{label}</span>
              <Switch
                checked={form.watch(key)}
                onCheckedChange={(v) => form.setValue(key, v, { shouldDirty: true })}
                data-ai-id={`realtime-flag-${key}`}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={saving} data-ai-id="realtime-settings-save">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </CrudFormShell>
    </div>
  );
}
