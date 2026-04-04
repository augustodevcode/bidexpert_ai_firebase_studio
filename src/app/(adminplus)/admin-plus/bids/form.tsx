/**
 * Form component for creating/editing Bids in Admin Plus.
 * Provides FK selectors for Lot, Auction, and User/Bidder.
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

import { bidSchema, BID_STATUSES, BID_ORIGINS } from './schema';
import type { BidRow } from './types';
import { createBid, updateBid } from './actions';
import { listLots } from '../lots/actions';
import { listAuctions } from '../auctions/actions';
import { listUsersAction } from '../users/actions';
import { toast } from 'sonner';

type FormValues = z.infer<typeof bidSchema>;

interface BidFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: BidRow | null;
  onSuccess: () => void;
}

export default function BidForm({ open, onOpenChange, editItem, onSuccess }: BidFormProps) {
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState<{ id: string; title: string }[]>([]);
  const [auctions, setAuctions] = useState<{ id: string; title: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      lotId: '',
      auctionId: '',
      bidderId: '',
      amount: 0,
      status: 'ATIVO',
      bidOrigin: 'MANUAL',
      isAutoBid: false,
      bidderDisplay: '',
      bidderAlias: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      listLots({ page: 1, pageSize: 200 }),
      listAuctions({ page: 1, pageSize: 200 }),
      listUsersAction({ page: 1, pageSize: 200 }),
    ]).then(([lotsRes, auctionsRes, usersRes]) => {
      if (lotsRes.success && lotsRes.data) {
        setLots(lotsRes.data.data.map((l) => ({ id: l.id, title: l.title ?? l.id })));
      }
      if (auctionsRes.success && auctionsRes.data) {
        setAuctions(auctionsRes.data.data.map((a) => ({ id: a.id, title: a.title ?? a.id })));
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.data.map((u: Record<string, unknown>) => ({ id: String(u.id), name: String((u as Record<string, unknown>).name ?? u.id) })));
      }
    });
  }, [open]);

  useEffect(() => {
    if (open && editItem) {
      form.reset({
        lotId: editItem.lotId,
        auctionId: editItem.auctionId,
        bidderId: editItem.bidderId,
        amount: editItem.amount,
        status: editItem.status,
        bidOrigin: editItem.bidOrigin,
        isAutoBid: editItem.isAutoBid,
        bidderDisplay: editItem.bidderDisplay ?? '',
        bidderAlias: editItem.bidderAlias ?? '',
      });
    } else if (open) {
      form.reset({
        lotId: '',
        auctionId: '',
        bidderId: '',
        amount: 0,
        status: 'ATIVO',
        bidOrigin: 'MANUAL',
        isAutoBid: false,
        bidderDisplay: '',
        bidderAlias: '',
      });
    }
  }, [open, editItem, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const result = editItem
        ? await updateBid({ ...values, id: editItem.id })
        : await createBid(values);
      if (result.success) {
        toast.success(editItem ? 'Lance atualizado!' : 'Lance criado!');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? 'Erro ao salvar lance.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="bid-form-sheet">
        <SheetHeader>
          <SheetTitle>{editItem ? 'Editar Lance' : 'Novo Lance'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="bid-form">
          {/* FK: Lote */}
          <div className="space-y-1">
            <Label htmlFor="bid-lotId">Lote *</Label>
            <Select value={form.watch('lotId')} onValueChange={(v) => form.setValue('lotId', v)}>
              <SelectTrigger id="bid-lotId" data-ai-id="bid-lot-select">
                <SelectValue placeholder="Selecione o lote" />
              </SelectTrigger>
              <SelectContent>
                {lots.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.lotId && <p className="text-sm text-destructive">{form.formState.errors.lotId.message}</p>}
          </div>

          {/* FK: Leilão */}
          <div className="space-y-1">
            <Label htmlFor="bid-auctionId">Leilão *</Label>
            <Select value={form.watch('auctionId')} onValueChange={(v) => form.setValue('auctionId', v)}>
              <SelectTrigger id="bid-auctionId" data-ai-id="bid-auction-select">
                <SelectValue placeholder="Selecione o leilão" />
              </SelectTrigger>
              <SelectContent>
                {auctions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.auctionId && <p className="text-sm text-destructive">{form.formState.errors.auctionId.message}</p>}
          </div>

          {/* FK: Arrematante */}
          <div className="space-y-1">
            <Label htmlFor="bid-bidderId">Arrematante *</Label>
            <Select value={form.watch('bidderId')} onValueChange={(v) => form.setValue('bidderId', v)}>
              <SelectTrigger id="bid-bidderId" data-ai-id="bid-bidder-select">
                <SelectValue placeholder="Selecione o arrematante" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.bidderId && <p className="text-sm text-destructive">{form.formState.errors.bidderId.message}</p>}
          </div>

          <Separator />

          {/* Valor */}
          <div className="space-y-1">
            <Label htmlFor="bid-amount">Valor (R$) *</Label>
            <Input
              id="bid-amount"
              type="number"
              step="0.01"
              min="0"
              data-ai-id="bid-amount-input"
              {...form.register('amount', { valueAsNumber: true })}
            />
            {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label htmlFor="bid-status">Status</Label>
            <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
              <SelectTrigger id="bid-status" data-ai-id="bid-status-select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {BID_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Origem */}
          <div className="space-y-1">
            <Label htmlFor="bid-bidOrigin">Origem</Label>
            <Select value={form.watch('bidOrigin')} onValueChange={(v) => form.setValue('bidOrigin', v)}>
              <SelectTrigger id="bid-bidOrigin" data-ai-id="bid-origin-select">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                {BID_ORIGINS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto Bid */}
          <div className="flex items-center gap-2">
            <Switch
              id="bid-isAutoBid"
              checked={form.watch('isAutoBid')}
              onCheckedChange={(v) => form.setValue('isAutoBid', v)}
              data-ai-id="bid-auto-bid-switch"
            />
            <Label htmlFor="bid-isAutoBid">Lance Automático</Label>
          </div>

          <Separator />

          {/* Display / Alias */}
          <div className="space-y-1">
            <Label htmlFor="bid-bidderDisplay">Exibição do Arrematante</Label>
            <Input id="bid-bidderDisplay" data-ai-id="bid-bidder-display-input" {...form.register('bidderDisplay')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bid-bidderAlias">Alias do Arrematante</Label>
            <Input id="bid-bidderAlias" data-ai-id="bid-bidder-alias-input" {...form.register('bidderAlias')} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-ai-id="bid-form-cancel-btn">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} data-ai-id="bid-form-submit-btn">
              {loading ? 'Salvando...' : editItem ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
