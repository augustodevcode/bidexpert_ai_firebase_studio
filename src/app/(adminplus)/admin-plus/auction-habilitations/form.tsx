/**
 * Formulário de criação/edição de AuctionHabilitation.
 * Composite PK: userId + auctionId.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auctionHabilitationSchema, type AuctionHabilitationFormData } from './schema';
import type { AuctionHabilitationRow } from './types';
import { listUsersAction } from '../users/actions';
import { listAuctions } from '../auctions/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AuctionHabilitationFormData) => void;
  defaultValues?: AuctionHabilitationRow | null;
}

export function AuctionHabilitationForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const form = useForm<AuctionHabilitationFormData>({ resolver: zodResolver(auctionHabilitationSchema), defaultValues: { userId: '', auctionId: '' } });
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [auctions, setAuctions] = useState<{ id: string; title: string }[]>([]);
  const isEditing = !!defaultValues;

  useEffect(() => {
    if (!open) return;
    listUsersAction({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setUsers(r.data.data.map((u: any) => ({ id: u.id, name: u.name }))); });
    listAuctions({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setAuctions(r.data.data.map((a: any) => ({ id: a.id, title: a.title }))); });
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({ userId: defaultValues.userId, auctionId: defaultValues.auctionId });
    } else if (open) {
      form.reset({ userId: '', auctionId: '' });
    }
  }, [open, defaultValues, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto" data-ai-id="auction-habilitation-form">
        <SheetHeader><SheetTitle>{isEditing ? 'Editar Habilitação' : 'Nova Habilitação'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Usuário *</Label>
            <Select value={form.watch('userId')} onValueChange={(v) => form.setValue('userId', v)} disabled={isEditing}>
              <SelectTrigger id="userId"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{users.map(u => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.userId && <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="auctionId">Leilão *</Label>
            <Select value={form.watch('auctionId')} onValueChange={(v) => form.setValue('auctionId', v)} disabled={isEditing}>
              <SelectTrigger id="auctionId"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{auctions.map(a => (<SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.auctionId && <p className="text-sm text-destructive">{form.formState.errors.auctionId.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{isEditing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
