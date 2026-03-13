/**
 * @fileoverview Página de configurações de mapa (MapSettings) — Admin Plus.
 * Formulário singleton para provider de mapas e chave de API.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { mapSettingsSchema, type MapSettingsFormValues } from './schema';
import { getMapSettingsAction, updateMapSettingsAction } from './actions';

const MAP_PROVIDERS = [
  { value: 'openstreetmap', label: 'OpenStreetMap (Gratuito)' },
  { value: 'google', label: 'Google Maps' },
  { value: 'mapbox', label: 'Mapbox' },
];

export default function MapSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<MapSettingsFormValues>({
    resolver: zodResolver(mapSettingsSchema),
    defaultValues: {
      defaultProvider: 'openstreetmap',
      googleMapsApiKey: '',
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getMapSettingsAction({});
        if (res?.success && res.data) {
          form.reset({
            defaultProvider: res.data.defaultProvider ?? 'openstreetmap',
            googleMapsApiKey: res.data.googleMapsApiKey ?? '',
          });
        }
      } catch {
        toast.error('Erro ao carregar configurações de mapa.');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const onSubmit = async (values: MapSettingsFormValues) => {
    setSaving(true);
    try {
      const res = await updateMapSettingsAction(values);
      if (res?.success) {
        toast.success('Configurações de mapa salvas com sucesso.');
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
      <div className="space-y-6" data-ai-id="map-settings-skeleton">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div data-ai-id="map-settings-page">
      <PageHeader title="Configurações de Mapa" icon={MapPin} />

      <CrudFormShell form={form} onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Provider de Mapa" description="Serviço utilizado para renderização de mapas.">
            <Select
              value={form.watch('defaultProvider') ?? 'openstreetmap'}
              onValueChange={(v) => form.setValue('defaultProvider', v, { shouldDirty: true })}
            >
              <SelectTrigger data-ai-id="map-settings-provider">
                <SelectValue placeholder="Selecione o provider" />
              </SelectTrigger>
              <SelectContent>
                {MAP_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Google Maps API Key" description="Chave de API do Google Maps (necessária se provider for Google).">
            <Input
              type="password"
              placeholder="AIza..."
              {...form.register('googleMapsApiKey')}
              data-ai-id="map-settings-api-key"
            />
          </Field>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} data-ai-id="map-settings-save">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </CrudFormShell>
    </div>
  );
}
