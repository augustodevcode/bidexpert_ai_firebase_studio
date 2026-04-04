/**
 * @fileoverview Página de configurações de gateway de pagamento (PaymentGatewaySettings) — Admin Plus.
 * Formulário singleton com gateway, comissão e chaves de API.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import { paymentGatewaySettingsSchema, type PaymentGatewaySettingsFormValues } from './schema';
import { getPaymentGatewaySettingsAction, updatePaymentGatewaySettingsAction } from './actions';

const GATEWAYS = [
  { value: 'Manual', label: 'Manual (sem integração)' },
  { value: 'Stripe', label: 'Stripe' },
  { value: 'PagSeguro', label: 'PagSeguro' },
  { value: 'MercadoPago', label: 'Mercado Pago' },
  { value: 'Asaas', label: 'Asaas' },
];

export default function PaymentGatewaySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<PaymentGatewaySettingsFormValues>({
    resolver: zodResolver(paymentGatewaySettingsSchema),
    defaultValues: {
      defaultGateway: 'Manual',
      platformCommissionPercentage: 5,
      gatewayApiKey: '',
      gatewayEncryptionKey: '',
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getPaymentGatewaySettingsAction({});
        if (res?.success && res.data) {
          form.reset({
            defaultGateway: res.data.defaultGateway ?? 'Manual',
            platformCommissionPercentage: res.data.platformCommissionPercentage ?? 5,
            gatewayApiKey: res.data.gatewayApiKey ?? '',
            gatewayEncryptionKey: res.data.gatewayEncryptionKey ?? '',
          });
        }
      } catch {
        toast.error('Erro ao carregar configurações de pagamento.');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const onSubmit = async (values: PaymentGatewaySettingsFormValues) => {
    setSaving(true);
    try {
      const res = await updatePaymentGatewaySettingsAction(values);
      if (res?.success) {
        toast.success('Configurações de pagamento salvas com sucesso.');
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
      <div className="space-y-6" data-ai-id="payment-gateway-settings-skeleton">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div data-ai-id="payment-gateway-settings-page">
      <PageHeader title="Gateway de Pagamento" icon={CreditCard} />

      <CrudFormShell form={form} onSubmit={onSubmit}>
        {/* Seção 1: Gateway */}
        <h3 className="text-base font-semibold">Gateway Padrão</h3>
        <Separator className="mb-4" />

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Field label="Gateway" description="Provedor de pagamento utilizado pela plataforma.">
            <Select
              value={form.watch('defaultGateway') ?? 'Manual'}
              onValueChange={(v) => form.setValue('defaultGateway', v, { shouldDirty: true })}
            >
              <SelectTrigger data-ai-id="payment-gateway-select">
                <SelectValue placeholder="Selecione o gateway" />
              </SelectTrigger>
              <SelectContent>
                {GATEWAYS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Comissão da Plataforma (%)" description="Percentual de comissão cobrado em cada transação.">
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              {...form.register('platformCommissionPercentage', { valueAsNumber: true })}
              data-ai-id="payment-gateway-commission"
            />
          </Field>
        </div>

        {/* Seção 2: Chaves de API */}
        <h3 className="text-base font-semibold">Chaves de API</h3>
        <Separator className="mb-4" />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="API Key" description="Chave de API do gateway de pagamento.">
            <Input
              type="password"
              placeholder="sk_live_..."
              {...form.register('gatewayApiKey')}
              data-ai-id="payment-gateway-api-key"
            />
          </Field>

          <Field label="Encryption Key" description="Chave de criptografia do gateway (quando aplicável).">
            <Input
              type="password"
              placeholder="ek_..."
              {...form.register('gatewayEncryptionKey')}
              data-ai-id="payment-gateway-encryption-key"
            />
          </Field>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} data-ai-id="payment-gateway-settings-save">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </CrudFormShell>
    </div>
  );
}
