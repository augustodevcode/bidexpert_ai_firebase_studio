/**
 * Formulário de criação/edição de WonLot (Lotes Arrematados) no Admin Plus.
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { wonLotSchema, WON_LOT_STATUS_OPTIONS, WON_LOT_PAYMENT_STATUS_OPTIONS, WON_LOT_DELIVERY_STATUS_OPTIONS } from './schema';
import type { WonLotRow } from './types';
import { createWonLot, updateWonLot } from './actions';
import { listBidderProfiles } from '../bidder-profiles/actions';
import { listAuctions } from '../auctions/actions';
import { listLots } from '../lots/actions';

type FormData = z.infer<typeof wonLotSchema>;

interface WonLotFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: WonLotRow | null;
  onSuccess: () => void;
}

export function WonLotForm({ open, onOpenChange, editItem, onSuccess }: WonLotFormProps) {
  const [loading, setLoading] = useState(false);
  const [bidders, setBidders] = useState<{ id: string; label: string }[]>([]);
  const [auctions, setAuctions] = useState<{ id: string; label: string }[]>([]);
  const [lots, setLots] = useState<{ id: string; label: string }[]>([]);

  const defaults: FormData = { bidderId: '', lotId: '', auctionId: '', title: '', finalBid: '', totalAmount: '', paidAmount: '', status: 'WON', paymentStatus: 'PENDENTE', deliveryStatus: 'PENDING', wonAt: '', dueDate: '', trackingCode: '', invoiceUrl: '', receiptUrl: '' };

  const form = useForm<FormData>({ resolver: zodResolver(wonLotSchema), defaultValues: defaults });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      listBidderProfiles({ page: 1, pageSize: 500 }),
      listAuctions({ page: 1, pageSize: 500 }),
      listLots({ page: 1, pageSize: 500 }),
    ]).then(([bRes, aRes, lRes]) => {
      if (bRes?.success && bRes.data?.data) setBidders(bRes.data.data.map((b: any) => ({ id: b.id, label: b.bidderName || b.id })));
      if (aRes?.success && aRes.data?.data) setAuctions(aRes.data.data.map((a: any) => ({ id: a.id, label: a.title || a.id })));
      if (lRes?.success && lRes.data?.data) setLots(lRes.data.data.map((l: any) => ({ id: l.id, label: l.title || l.id })));
    });
  }, [open]);

  useEffect(() => {
    if (open && editItem) {
      form.reset({
        bidderId: editItem.bidderId,
        lotId: editItem.lotId,
        auctionId: editItem.auctionId,
        title: editItem.title,
        finalBid: editItem.finalBid,
        totalAmount: editItem.totalAmount,
        paidAmount: editItem.paidAmount,
        status: editItem.status,
        paymentStatus: editItem.paymentStatus,
        deliveryStatus: editItem.deliveryStatus,
        wonAt: editItem.wonAt ? editItem.wonAt.substring(0, 10) : '',
        dueDate: editItem.dueDate ? editItem.dueDate.substring(0, 10) : '',
        trackingCode: editItem.trackingCode,
        invoiceUrl: editItem.invoiceUrl,
        receiptUrl: editItem.receiptUrl,
      });
    } else if (open) {
      form.reset(defaults);
    }
  }, [open, editItem, form]);

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const res = editItem ? await updateWonLot({ id: editItem.id, data: values }) : await createWonLot(values);
      if (res?.success) { toast.success(editItem ? 'Atualizado!' : 'Criado!'); onSuccess(); onOpenChange(false); }
      else toast.error(res?.error ?? 'Erro ao salvar');
    } catch { toast.error('Erro inesperado'); } finally { setLoading(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg" data-ai-id="won-lot-form-sheet">
        <SheetHeader><SheetTitle>{editItem ? 'Editar' : 'Novo'} Lote Arrematado</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="won-lot-form">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="wl-title">Título *</Label>
            <Input id="wl-title" {...form.register('title')} data-ai-id="won-lot-title-input" />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>

          {/* FK Selects */}
          <div className="space-y-1">
            <Label htmlFor="wl-bidder">Arrematante *</Label>
            <Select value={form.watch('bidderId')} onValueChange={(v) => form.setValue('bidderId', v)}>
              <SelectTrigger id="wl-bidder" data-ai-id="won-lot-bidder-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{bidders.map((b) => (<SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.bidderId && <p className="text-sm text-destructive">{form.formState.errors.bidderId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="wl-auction">Leilão *</Label>
              <Select value={form.watch('auctionId')} onValueChange={(v) => form.setValue('auctionId', v)}>
                <SelectTrigger id="wl-auction" data-ai-id="won-lot-auction-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{auctions.map((a) => (<SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="wl-lot">Lote *</Label>
              <Select value={form.watch('lotId')} onValueChange={(v) => form.setValue('lotId', v)}>
                <SelectTrigger id="wl-lot" data-ai-id="won-lot-lot-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{lots.map((l) => (<SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Monetary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="wl-finalBid">Lance Final *</Label>
              <Input id="wl-finalBid" type="number" step="0.01" {...form.register('finalBid')} data-ai-id="won-lot-final-bid" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wl-totalAmount">Valor Total *</Label>
              <Input id="wl-totalAmount" type="number" step="0.01" {...form.register('totalAmount')} data-ai-id="won-lot-total-amount" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wl-paidAmount">Valor Pago</Label>
              <Input id="wl-paidAmount" type="number" step="0.01" {...form.register('paidAmount')} data-ai-id="won-lot-paid-amount" />
            </div>
          </div>

          <Separator />

          {/* Status selects */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="wl-status">Status *</Label>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
                <SelectTrigger id="wl-status" data-ai-id="won-lot-status-select"><SelectValue /></SelectTrigger>
                <SelectContent>{WON_LOT_STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="wl-paymentStatus">Pagamento *</Label>
              <Select value={form.watch('paymentStatus')} onValueChange={(v) => form.setValue('paymentStatus', v)}>
                <SelectTrigger id="wl-paymentStatus" data-ai-id="won-lot-payment-status-select"><SelectValue /></SelectTrigger>
                <SelectContent>{WON_LOT_PAYMENT_STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="wl-deliveryStatus">Entrega *</Label>
              <Select value={form.watch('deliveryStatus')} onValueChange={(v) => form.setValue('deliveryStatus', v)}>
                <SelectTrigger id="wl-deliveryStatus" data-ai-id="won-lot-delivery-status-select"><SelectValue /></SelectTrigger>
                <SelectContent>{WON_LOT_DELIVERY_STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="wl-wonAt">Data Arrematação</Label>
              <Input id="wl-wonAt" type="date" {...form.register('wonAt')} data-ai-id="won-lot-won-at" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wl-dueDate">Vencimento</Label>
              <Input id="wl-dueDate" type="date" {...form.register('dueDate')} data-ai-id="won-lot-due-date" />
            </div>
          </div>

          {/* Tracking / URLs */}
          <div className="space-y-1">
            <Label htmlFor="wl-trackingCode">Código Rastreio</Label>
            <Input id="wl-trackingCode" {...form.register('trackingCode')} data-ai-id="won-lot-tracking-code" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wl-invoiceUrl">URL Nota Fiscal</Label>
            <Input id="wl-invoiceUrl" {...form.register('invoiceUrl')} data-ai-id="won-lot-invoice-url" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wl-receiptUrl">URL Recibo</Label>
            <Input id="wl-receiptUrl" {...form.register('receiptUrl')} data-ai-id="won-lot-receipt-url" />
          </div>

          <Button type="submit" className="w-full" disabled={loading} data-ai-id="won-lot-submit-btn">{loading ? 'Salvando...' : 'Salvar'}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
