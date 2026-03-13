/**
 * @fileoverview Formulário de AuctionStage — Admin Plus.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { auctionStageSchema, type AuctionStageSchema, AUCTION_STAGE_STATUSES } from './schema';
import type { AuctionStageRow } from './types';
import { listAuctions } from '../auctions/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AuctionStageSchema) => Promise<void>;
  defaultValues?: AuctionStageRow | null;
}

export function AuctionStageForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues;
  const [auctions, setAuctions] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<AuctionStageSchema>({
    resolver: zodResolver(auctionStageSchema),
    defaultValues: { name: '', startDate: '', endDate: '', status: '', discountPercent: '', auctionId: '' },
  });

  useEffect(() => {
    if (!open) return;
    listAuctions({ page: 1, pageSize: 500 }).then((r) => {
      if (r?.success && r.data?.data) {
        setAuctions(r.data.data.map((x: Record<string, unknown>) => ({ id: String(x.id), name: String(x.title ?? '') })));
      }
    });
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        name: defaultValues.name ?? '',
        startDate: defaultValues.startDate ? defaultValues.startDate.slice(0, 16) : '',
        endDate: defaultValues.endDate ? defaultValues.endDate.slice(0, 16) : '',
        status: defaultValues.status ?? '',
        discountPercent: defaultValues.discountPercent != null ? String(defaultValues.discountPercent) : '',
        auctionId: defaultValues.auctionId ?? '',
      });
    } else if (open) {
      form.reset();
    }
  }, [open, defaultValues, form]);

  const handleFormSubmit = form.handleSubmit(async (v) => { await onSubmit(v); });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="auction-stage-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Praça' : 'Nova Praça'}</SheetTitle>
          <SheetDescription>{isEdit ? 'Atualize os dados da praça.' : 'Preencha os dados da nova praça.'}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleFormSubmit} className="mt-6 space-y-4" data-ai-id="auction-stage-form">
          <div className="space-y-2">
            <Label htmlFor="as-name">Nome *</Label>
            <Input id="as-name" {...form.register('name')} data-ai-id="auction-stage-field-name" />
            {form.formState.errors.name && <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="as-start">Data Início *</Label>
              <Input id="as-start" type="datetime-local" {...form.register('startDate')} data-ai-id="auction-stage-field-startDate" />
              {form.formState.errors.startDate && <p className="text-destructive text-xs">{form.formState.errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="as-end">Data Fim *</Label>
              <Input id="as-end" type="datetime-local" {...form.register('endDate')} data-ai-id="auction-stage-field-endDate" />
              {form.formState.errors.endDate && <p className="text-destructive text-xs">{form.formState.errors.endDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch('status') ?? ''} onValueChange={(v) => form.setValue('status', v)}>
                <SelectTrigger data-ai-id="auction-stage-field-status"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {AUCTION_STAGE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="as-discount">Desconto %</Label>
              <Input id="as-discount" type="number" step="0.01" {...form.register('discountPercent')} data-ai-id="auction-stage-field-discount" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Leilão</Label>
            <Select value={form.watch('auctionId') ?? ''} onValueChange={(v) => form.setValue('auctionId', v)}>
              <SelectTrigger data-ai-id="auction-stage-field-auctionId"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {auctions.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-ai-id="auction-stage-form-cancel">Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting} data-ai-id="auction-stage-form-submit">
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
