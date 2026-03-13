/**
 * Formulário de criação/edição de PaymentMethod no Admin Plus.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { paymentMethodSchema, PAYMENT_METHOD_TYPE_OPTIONS } from './schema';
import type { PaymentMethodRow } from './types';
import { createPaymentMethod, updatePaymentMethod } from './actions';
import { listBidderProfiles } from '../bidder-profiles/actions';

type FormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: PaymentMethodRow | null;
  onSuccess: () => void;
}

export function PaymentMethodForm({ open, onOpenChange, editItem, onSuccess }: PaymentMethodFormProps) {
  const [loading, setLoading] = useState(false);
  const [bidders, setBidders] = useState<{ id: string; label: string }[]>([]);

  const form = useForm<FormData>({ resolver: zodResolver(paymentMethodSchema), defaultValues: { bidderId: '', type: '', isDefault: false, isActive: true, cardLast4: '', cardBrand: '', cardToken: '', pixKey: '', pixKeyType: '', expiresAt: '' } });

  useEffect(() => {
    if (open) {
      listBidderProfiles({ page: 1, pageSize: 500 }).then((res) => {
        if (res?.success && res.data?.data) setBidders(res.data.data.map((b: any) => ({ id: b.id, label: b.bidderName || b.id })));
      });
    }
  }, [open]);

  useEffect(() => {
    if (open && editItem) {
      form.reset({
        bidderId: editItem.bidderId,
        type: editItem.type,
        isDefault: editItem.isDefault,
        isActive: editItem.isActive,
        cardLast4: editItem.cardLast4,
        cardBrand: editItem.cardBrand,
        cardToken: editItem.cardToken,
        pixKey: editItem.pixKey,
        pixKeyType: editItem.pixKeyType,
        expiresAt: editItem.expiresAt ? editItem.expiresAt.substring(0, 10) : '',
      });
    } else if (open) {
      form.reset({ bidderId: '', type: '', isDefault: false, isActive: true, cardLast4: '', cardBrand: '', cardToken: '', pixKey: '', pixKeyType: '', expiresAt: '' });
    }
  }, [open, editItem, form]);

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const res = editItem ? await updatePaymentMethod({ id: editItem.id, data: values }) : await createPaymentMethod(values);
      if (res?.success) { toast.success(editItem ? 'Atualizado!' : 'Criado!'); onSuccess(); onOpenChange(false); }
      else toast.error(res?.error ?? 'Erro ao salvar');
    } catch { toast.error('Erro inesperado'); } finally { setLoading(false); }
  };

  const watchType = form.watch('type');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto" data-ai-id="payment-method-form-sheet">
        <SheetHeader><SheetTitle>{editItem ? 'Editar' : 'Novo'} Método de Pagamento</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="payment-method-form">
          {/* Bidder */}
          <div className="space-y-1">
            <Label htmlFor="pm-bidder">Arrematante *</Label>
            <Select value={form.watch('bidderId')} onValueChange={(v) => form.setValue('bidderId', v)}>
              <SelectTrigger id="pm-bidder" data-ai-id="payment-method-bidder-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{bidders.map((b) => (<SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.bidderId && <p className="text-sm text-destructive">{form.formState.errors.bidderId.message}</p>}
          </div>

          {/* Type */}
          <div className="space-y-1">
            <Label htmlFor="pm-type">Tipo *</Label>
            <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v)}>
              <SelectTrigger id="pm-type" data-ai-id="payment-method-type-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{PAYMENT_METHOD_TYPE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.type && <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>}
          </div>

          <Separator />

          {/* Card fields — shown if type card */}
          {(watchType === 'CREDIT_CARD' || watchType === 'DEBIT_CARD') && (
            <div className="space-y-3" data-ai-id="payment-method-card-fields">
              <p className="text-sm font-medium text-muted-foreground">Dados do Cartão</p>
              <div className="space-y-1">
                <Label htmlFor="pm-cardLast4">Últimos 4 dígitos</Label>
                <Input id="pm-cardLast4" maxLength={4} {...form.register('cardLast4')} data-ai-id="payment-method-card-last4" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pm-cardBrand">Bandeira</Label>
                <Input id="pm-cardBrand" {...form.register('cardBrand')} data-ai-id="payment-method-card-brand" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pm-cardToken">Token</Label>
                <Input id="pm-cardToken" {...form.register('cardToken')} data-ai-id="payment-method-card-token" />
              </div>
            </div>
          )}

          {/* PIX fields */}
          {watchType === 'PIX' && (
            <div className="space-y-3" data-ai-id="payment-method-pix-fields">
              <p className="text-sm font-medium text-muted-foreground">Dados PIX</p>
              <div className="space-y-1">
                <Label htmlFor="pm-pixKey">Chave PIX</Label>
                <Input id="pm-pixKey" {...form.register('pixKey')} data-ai-id="payment-method-pix-key" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pm-pixKeyType">Tipo da Chave</Label>
                <Input id="pm-pixKeyType" {...form.register('pixKeyType')} data-ai-id="payment-method-pix-key-type" />
              </div>
            </div>
          )}

          <Separator />

          {/* Flags */}
          <div className="flex items-center gap-4" data-ai-id="payment-method-flags">
            <div className="flex items-center gap-2">
              <Checkbox id="pm-isDefault" checked={form.watch('isDefault')} onCheckedChange={(v) => form.setValue('isDefault', !!v)} data-ai-id="payment-method-is-default" />
              <Label htmlFor="pm-isDefault">Padrão</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="pm-isActive" checked={form.watch('isActive')} onCheckedChange={(v) => form.setValue('isActive', !!v)} data-ai-id="payment-method-is-active" />
              <Label htmlFor="pm-isActive">Ativo</Label>
            </div>
          </div>

          {/* Expires at */}
          <div className="space-y-1">
            <Label htmlFor="pm-expiresAt">Expira em</Label>
            <Input id="pm-expiresAt" type="date" {...form.register('expiresAt')} data-ai-id="payment-method-expires-at" />
          </div>

          <Button type="submit" className="w-full" disabled={loading} data-ai-id="payment-method-submit-btn">{loading ? 'Salvando...' : 'Salvar'}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
