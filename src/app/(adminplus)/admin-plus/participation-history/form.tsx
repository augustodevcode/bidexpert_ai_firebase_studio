/**
 * Formulário de criação/edição de ParticipationHistory no Admin Plus.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { participationHistorySchema, PARTICIPATION_RESULT_OPTIONS, type ParticipationHistoryFormData } from './schema';
import type { ParticipationHistoryRow } from './types';
import { listBidderProfiles } from '../bidder-profiles/actions';
import { listAuctions } from '../auctions/actions';
import { listLots } from '../lots/actions';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (data: ParticipationHistoryFormData) => void; initialData?: ParticipationHistoryRow | null; }

export function ParticipationHistoryForm({ open, onOpenChange, onSubmit, initialData }: Props) {
  const form = useForm<ParticipationHistoryFormData>({ resolver: zodResolver(participationHistorySchema), defaultValues: { bidderId: '', lotId: '', auctionId: '', title: '', auctionName: '', maxBid: '', finalBid: '', result: '', bidCount: 0 } });
  const [bidders, setBidders] = useState<{ id: string; label: string }[]>([]);
  const [auctions, setAuctions] = useState<{ id: string; label: string }[]>([]);
  const [lots, setLots] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    listBidderProfiles({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setBidders((r.data as any).data?.map((b: any) => ({ id: b.id, label: b.userName || b.id })) ?? []); });
    listAuctions({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setAuctions((r.data as any).data?.map((a: any) => ({ id: a.id, label: a.title || a.id })) ?? []); });
    listLots({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setLots((r.data as any).data?.map((l: any) => ({ id: l.id, label: l.title || l.id })) ?? []); });
  }, [open]);

  useEffect(() => {
    if (open && initialData) {
      form.reset({ bidderId: initialData.bidderId, lotId: initialData.lotId, auctionId: initialData.auctionId, title: initialData.title, auctionName: initialData.auctionName, maxBid: initialData.maxBid, finalBid: initialData.finalBid, result: initialData.result, bidCount: initialData.bidCount });
    } else if (open) {
      form.reset({ bidderId: '', lotId: '', auctionId: '', title: '', auctionName: '', maxBid: '', finalBid: '', result: '', bidCount: 0 });
    }
  }, [open, initialData, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="ph-form-sheet">
        <SheetHeader><SheetTitle>{initialData ? 'Editar Participação' : 'Nova Participação'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="ph-form">
          {/* FK Selects */}
          <div>
            <Label>Arrematante *</Label>
            <Select value={form.watch('bidderId')} onValueChange={v => form.setValue('bidderId', v)}>
              <SelectTrigger data-ai-id="ph-bidder-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{bidders.map(b => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}</SelectContent>
            </Select>
            {form.formState.errors.bidderId && <p className="text-sm text-destructive mt-1">{form.formState.errors.bidderId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Leilão *</Label>
              <Select value={form.watch('auctionId')} onValueChange={v => form.setValue('auctionId', v)}>
                <SelectTrigger data-ai-id="ph-auction-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{auctions.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lote *</Label>
              <Select value={form.watch('lotId')} onValueChange={v => form.setValue('lotId', v)}>
                <SelectTrigger data-ai-id="ph-lot-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{lots.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="title">Título *</Label>
            <Input id="title" {...form.register('title')} data-ai-id="ph-title-input" />
            {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="auctionName">Nome do Leilão *</Label>
            <Input id="auctionName" {...form.register('auctionName')} data-ai-id="ph-auction-name-input" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Resultado *</Label>
              <Select value={form.watch('result')} onValueChange={v => form.setValue('result', v)}>
                <SelectTrigger data-ai-id="ph-result-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{PARTICIPATION_RESULT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxBid">Lance Máximo</Label>
              <Input id="maxBid" type="number" step="0.01" {...form.register('maxBid')} data-ai-id="ph-max-bid-input" />
            </div>
            <div>
              <Label htmlFor="finalBid">Lance Final</Label>
              <Input id="finalBid" type="number" step="0.01" {...form.register('finalBid')} data-ai-id="ph-final-bid-input" />
            </div>
          </div>

          <div>
            <Label htmlFor="bidCount">Qtd. Lances</Label>
            <Input id="bidCount" type="number" {...form.register('bidCount')} data-ai-id="ph-bid-count-input" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" data-ai-id="ph-submit-btn">{initialData ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
