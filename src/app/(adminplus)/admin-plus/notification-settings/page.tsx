/**
 * @fileoverview Página de configurações de notificação (NotificationSettings) — Admin Plus.
 * Formulário singleton com 4 toggles booleanos.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { notificationSettingsSchema, type NotificationSettingsFormValues } from './schema';
import { getNotificationSettingsAction, updateNotificationSettingsAction } from './actions';

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      notifyOnNewAuction: true,
      notifyOnFeaturedLot: true,
      notifyOnAuctionEndingSoon: true,
      notifyOnPromotions: false,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getNotificationSettingsAction({});
        if (res?.success && res.data) {
          form.reset({
            notifyOnNewAuction: res.data.notifyOnNewAuction ?? true,
            notifyOnFeaturedLot: res.data.notifyOnFeaturedLot ?? true,
            notifyOnAuctionEndingSoon: res.data.notifyOnAuctionEndingSoon ?? true,
            notifyOnPromotions: res.data.notifyOnPromotions ?? false,
          });
        }
      } catch {
        toast.error('Erro ao carregar configurações de notificação.');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const onSubmit = async (values: NotificationSettingsFormValues) => {
    setSaving(true);
    try {
      const res = await updateNotificationSettingsAction(values);
      if (res?.success) {
        toast.success('Configurações de notificação salvas com sucesso.');
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
      <div className="space-y-6" data-ai-id="notification-settings-skeleton">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div data-ai-id="notification-settings-page">
      <PageHeader title="Configurações de Notificação" icon={Bell} />

      <CrudFormShell form={form} onSubmit={onSubmit}>
        <p className="text-sm text-muted-foreground mb-4">
          Controle quais notificações são enviadas aos usuários da plataforma.
        </p>
        <Separator className="mb-6" />

        <div className="space-y-6">
          <Field label="Notificar sobre novos leilões" description="Envia notificação quando um novo leilão é publicado.">
            <Switch
              checked={form.watch('notifyOnNewAuction')}
              onCheckedChange={(v) => form.setValue('notifyOnNewAuction', v, { shouldDirty: true })}
              data-ai-id="notification-settings-new-auction"
            />
          </Field>

          <Field label="Notificar sobre lotes em destaque" description="Envia notificação quando um lote é marcado como destaque.">
            <Switch
              checked={form.watch('notifyOnFeaturedLot')}
              onCheckedChange={(v) => form.setValue('notifyOnFeaturedLot', v, { shouldDirty: true })}
              data-ai-id="notification-settings-featured-lot"
            />
          </Field>

          <Field label="Notificar sobre leilões encerrando" description="Envia notificação quando um leilão está próximo do encerramento.">
            <Switch
              checked={form.watch('notifyOnAuctionEndingSoon')}
              onCheckedChange={(v) => form.setValue('notifyOnAuctionEndingSoon', v, { shouldDirty: true })}
              data-ai-id="notification-settings-ending-soon"
            />
          </Field>

          <Field label="Notificar sobre promoções" description="Envia notificação sobre promoções e ofertas especiais.">
            <Switch
              checked={form.watch('notifyOnPromotions')}
              onCheckedChange={(v) => form.setValue('notifyOnPromotions', v, { shouldDirty: true })}
              data-ai-id="notification-settings-promotions"
            />
          </Field>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} data-ai-id="notification-settings-save">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </CrudFormShell>
    </div>
  );
}
