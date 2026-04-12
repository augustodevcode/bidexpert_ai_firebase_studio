/**
 * Formulário CRUD para LotStagePrice (Preço por Praça).
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { lotStagePriceSchema } from './schema';
import type { LotStagePriceRow } from './types';
import { createLotStagePrice, updateLotStagePrice } from './actions';
import { listLots } from '../lots/actions';
import { listAuctions } from '../auctions/actions';
import { listAuctionStages } from '../auction-stages/actions';

type FormData = z.infer<typeof lotStagePriceSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRow?: LotStagePriceRow | null;
  onSuccess?: () => void;
}

export default function LotStagePriceForm({ open, onOpenChange, editingRow, onSuccess }: Props) {
  const [lots, setLots] = useState<{ id: string; label: string }[]>([]);
  const [auctions, setAuctions] = useState<{ id: string; label: string }[]>([]);
  const [stages, setStages] = useState<{ id: string; label: string; auctionId: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(lotStagePriceSchema), defaultValues: { lotId: '', auctionId: '', auctionStageId: '', initialBid: '', bidIncrement: '' } });
  const isEdit = !!editingRow;

  useEffect(() => {
    if (!open) return;
    Promise.all([listLots({ page: 1, pageSize: 500 }), listAuctions({ page: 1, pageSize: 500 }), listAuctionStages({ page: 1, pageSize: 500 })]).then(([lr, ar, sr]) => {
      if (lr.success && lr.data) setLots((lr.data as any).data?.map((d: any) => ({ id: d.id, label: d.title || d.id })) ?? []);
      if (ar.success && ar.data) setAuctions((ar.data as any).data?.map((d: any) => ({ id: d.id, label: d.title || d.id })) ?? []);
      if (sr.success && sr.data) setStages((sr.data as any).data?.map((d: any) => ({ id: d.id, label: d.name || d.title || d.id, auctionId: d.auctionId ?? '' })) ?? []);
    });
  }, [open]);

  useEffect(() => {
    if (open && editingRow) {
      form.reset({ lotId: editingRow.lotId, auctionId: editingRow.auctionId, auctionStageId: editingRow.auctionStageId, initialBid: editingRow.initialBid?.toString() ?? '', bidIncrement: editingRow.bidIncrement?.toString() ?? '' });
    } else if (open) {
      form.reset({ lotId: '', auctionId: '', auctionStageId: '', initialBid: '', bidIncrement: '' });
    }
  }, [open, editingRow, form]);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = isEdit ? await updateLotStagePrice({ id: editingRow!.id, ...data }) : await createLotStagePrice(data);
      if (res.success) { toast.success(isEdit ? 'Preço atualizado!' : 'Preço criado!'); onOpenChange(false); onSuccess?.(); } else { toast.error(res.error ?? 'Erro ao salvar'); }
    } finally { setLoading(false); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="lot-stage-price-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Preço' : 'Novo Preço por Praça'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os valores vinculados à praça.' : 'Selecione lote, leilão e praça para cadastrar o preço inicial.'}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="lot-stage-price-form">
          <div className="space-y-2">
            <Label htmlFor="lotId">Lote *</Label>
            <Select value={form.watch('lotId')} onValueChange={v => form.setValue('lotId', v)}>
              <SelectTrigger id="lotId" data-ai-id="lot-stage-price-lotId-select"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{lots.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
            {form.formState.errors.lotId && <p className="text-sm text-destructive">{form.formState.errors.lotId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="auctionId">Leilão *</Label>
            <Select value={form.watch('auctionId')} onValueChange={v => { form.setValue('auctionId', v); form.setValue('auctionStageId', ''); }}>
              <SelectTrigger id="auctionId" data-ai-id="lot-stage-price-auctionId-select"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{auctions.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}</SelectContent>
            </Select>
            {form.formState.errors.auctionId && <p className="text-sm text-destructive">{form.formState.errors.auctionId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="auctionStageId">Praça *</Label>
            <Select value={form.watch('auctionStageId')} onValueChange={v => form.setValue('auctionStageId', v)}>
              <SelectTrigger id="auctionStageId" data-ai-id="lot-stage-price-stageId-select"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{stages.filter(s => !s.auctionId || s.auctionId === form.watch('auctionId')).map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            {form.formState.errors.auctionStageId && <p className="text-sm text-destructive">{form.formState.errors.auctionStageId.message}</p>}
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialBid">Lance Inicial (R$)</Label>
              <Input id="initialBid" type="number" step="0.01" {...form.register('initialBid')} data-ai-id="lot-stage-price-initialBid-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bidIncrement">Incremento (R$)</Label>
              <Input id="bidIncrement" type="number" step="0.01" {...form.register('bidIncrement')} data-ai-id="lot-stage-price-bidIncrement-input" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-ai-id="lot-stage-price-cancel-btn">Cancelar</Button>
            <Button type="submit" disabled={loading} data-ai-id="lot-stage-price-submit-btn">{loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
