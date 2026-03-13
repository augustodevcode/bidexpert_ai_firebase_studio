/**
 * Formulário (Sheet) de criação/edição de TenantInvoice no Admin Plus.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { tenantInvoiceSchema, TENANT_INVOICE_STATUS_OPTIONS } from './schema';
import type { TenantInvoiceFormData } from './schema';
import type { TenantInvoiceRow } from './types';

interface TenantInvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TenantInvoiceFormData) => Promise<void>;
  defaultValues?: TenantInvoiceRow | null;
  currentTenantId?: string;
}

export default function TenantInvoiceForm({ open, onOpenChange, onSubmit, defaultValues, currentTenantId }: TenantInvoiceFormProps) {
  const isEdit = !!defaultValues;

  const form = useForm<TenantInvoiceFormData>({
    resolver: zodResolver(tenantInvoiceSchema),
    defaultValues: { tenantId: currentTenantId ?? '', invoiceNumber: '', externalId: '', amount: '', currency: 'BRL', periodStart: '', periodEnd: '', dueDate: '', paidAt: '', status: 'PENDING', description: '', lineItems: '', paymentMethod: '', paymentReference: '', invoiceUrl: '', receiptUrl: '', metadata: '' },
  });

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        tenantId: defaultValues.tenantId,
        invoiceNumber: defaultValues.invoiceNumber,
        externalId: defaultValues.externalId || '',
        amount: defaultValues.amount,
        currency: defaultValues.currency || 'BRL',
        periodStart: defaultValues.periodStart?.substring(0, 10) ?? '',
        periodEnd: defaultValues.periodEnd?.substring(0, 10) ?? '',
        dueDate: defaultValues.dueDate?.substring(0, 10) ?? '',
        paidAt: defaultValues.paidAt?.substring(0, 10) ?? '',
        status: defaultValues.status,
        description: defaultValues.description || '',
        lineItems: defaultValues.lineItems || '',
        paymentMethod: defaultValues.paymentMethod || '',
        paymentReference: defaultValues.paymentReference || '',
        invoiceUrl: defaultValues.invoiceUrl || '',
        receiptUrl: defaultValues.receiptUrl || '',
        metadata: defaultValues.metadata || '',
      });
    } else if (open) {
      form.reset({ tenantId: currentTenantId ?? '', invoiceNumber: '', externalId: '', amount: '', currency: 'BRL', periodStart: '', periodEnd: '', dueDate: '', paidAt: '', status: 'PENDING', description: '', lineItems: '', paymentMethod: '', paymentReference: '', invoiceUrl: '', receiptUrl: '', metadata: '' });
    }
  }, [open, defaultValues, form, currentTenantId]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try { await onSubmit(data); onOpenChange(false); } catch { toast.error('Erro ao salvar fatura.'); }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="tenant-invoice-form-sheet">
        <SheetHeader><SheetTitle>{isEdit ? 'Editar Fatura' : 'Nova Fatura'}</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4" data-ai-id="tenant-invoice-form">
          {/* Nº Fatura + External ID */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="invoiceNumber">Nº Fatura *</Label>
              <Input id="invoiceNumber" {...form.register('invoiceNumber')} data-ai-id="tenant-invoice-number-input" />
              {form.formState.errors.invoiceNumber && <p className="text-sm text-destructive">{form.formState.errors.invoiceNumber.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="externalId">ID Externo</Label>
              <Input id="externalId" {...form.register('externalId')} data-ai-id="tenant-invoice-externalId-input" />
            </div>
          </div>

          {/* Valor + Moeda + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="amount">Valor *</Label>
              <Input id="amount" type="number" step="0.01" {...form.register('amount')} data-ai-id="tenant-invoice-amount-input" />
              {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency">Moeda *</Label>
              <Input id="currency" {...form.register('currency')} maxLength={3} data-ai-id="tenant-invoice-currency-input" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Status *</Label>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
                <SelectTrigger id="status" data-ai-id="tenant-invoice-status-select"><SelectValue /></SelectTrigger>
                <SelectContent>{TENANT_INVOICE_STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Período + Vencimento + Pago em */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="periodStart">Início Período *</Label>
              <Input id="periodStart" type="date" {...form.register('periodStart')} data-ai-id="tenant-invoice-periodStart-input" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="periodEnd">Fim Período *</Label>
              <Input id="periodEnd" type="date" {...form.register('periodEnd')} data-ai-id="tenant-invoice-periodEnd-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dueDate">Vencimento *</Label>
              <Input id="dueDate" type="date" {...form.register('dueDate')} data-ai-id="tenant-invoice-dueDate-input" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paidAt">Pago em</Label>
              <Input id="paidAt" type="date" {...form.register('paidAt')} data-ai-id="tenant-invoice-paidAt-input" />
            </div>
          </div>

          <Separator />

          {/* Descrição */}
          <div className="space-y-1">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...form.register('description')} rows={3} data-ai-id="tenant-invoice-description-input" />
          </div>

          {/* Pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="paymentMethod">Método Pgto</Label>
              <Input id="paymentMethod" {...form.register('paymentMethod')} data-ai-id="tenant-invoice-paymentMethod-input" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paymentReference">Ref. Pgto</Label>
              <Input id="paymentReference" {...form.register('paymentReference')} data-ai-id="tenant-invoice-paymentRef-input" />
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="invoiceUrl">URL Fatura</Label>
              <Input id="invoiceUrl" {...form.register('invoiceUrl')} data-ai-id="tenant-invoice-invoiceUrl-input" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receiptUrl">URL Recibo</Label>
              <Input id="receiptUrl" {...form.register('receiptUrl')} data-ai-id="tenant-invoice-receiptUrl-input" />
            </div>
          </div>

          {/* JSON fields */}
          <div className="space-y-1">
            <Label htmlFor="lineItems">Itens (JSON)</Label>
            <Textarea id="lineItems" {...form.register('lineItems')} rows={3} data-ai-id="tenant-invoice-lineItems-input" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea id="metadata" {...form.register('metadata')} rows={3} data-ai-id="tenant-invoice-metadata-input" />
          </div>

          <SheetFooter>
            <Button type="submit" data-ai-id="tenant-invoice-form-submit">{isEdit ? 'Salvar' : 'Criar'}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
