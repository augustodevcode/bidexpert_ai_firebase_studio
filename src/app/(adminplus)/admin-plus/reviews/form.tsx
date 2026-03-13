/**
 * Formulário de criação/edição de Review.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { reviewSchema, type ReviewFormData } from './schema';
import type { ReviewRow } from './types';
import { listLots } from '../lots/actions';
import { listAuctions } from '../auctions/actions';
import { listUsersAction } from '../users/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReviewFormData) => void;
  defaultValues?: ReviewRow | null;
}

export function ReviewForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const form = useForm<ReviewFormData>({ resolver: zodResolver(reviewSchema), defaultValues: { lotId: '', auctionId: '', userId: '', rating: 5, comment: '', userDisplayName: '' } });
  const [lots, setLots] = useState<{ id: string; title: string }[]>([]);
  const [auctions, setAuctions] = useState<{ id: string; title: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    listLots({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setLots(r.data.data.map((l: any) => ({ id: l.id, title: l.title }))); });
    listAuctions({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setAuctions(r.data.data.map((a: any) => ({ id: a.id, title: a.title }))); });
    listUsersAction({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setUsers(r.data.data.map((u: any) => ({ id: u.id, name: u.name }))); });
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({ lotId: defaultValues.lotId, auctionId: defaultValues.auctionId, userId: defaultValues.userId, rating: defaultValues.rating, comment: defaultValues.comment ?? '', userDisplayName: defaultValues.userDisplayName });
    } else if (open) {
      form.reset({ lotId: '', auctionId: '', userId: '', rating: 5, comment: '', userDisplayName: '' });
    }
  }, [open, defaultValues, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto" data-ai-id="review-form">
        <SheetHeader><SheetTitle>{defaultValues ? 'Editar Avaliação' : 'Nova Avaliação'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lotId">Lote *</Label>
              <Select value={form.watch('lotId')} onValueChange={(v) => form.setValue('lotId', v)}>
                <SelectTrigger id="lotId"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{lots.map(l => (<SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>))}</SelectContent>
              </Select>
              {form.formState.errors.lotId && <p className="text-sm text-destructive">{form.formState.errors.lotId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="auctionId">Leilão *</Label>
              <Select value={form.watch('auctionId')} onValueChange={(v) => form.setValue('auctionId', v)}>
                <SelectTrigger id="auctionId"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{auctions.map(a => (<SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>))}</SelectContent>
              </Select>
              {form.formState.errors.auctionId && <p className="text-sm text-destructive">{form.formState.errors.auctionId.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">Usuário *</Label>
              <Select value={form.watch('userId')} onValueChange={(v) => form.setValue('userId', v)}>
                <SelectTrigger id="userId"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{users.map(u => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}</SelectContent>
              </Select>
              {form.formState.errors.userId && <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Nota (1-5) *</Label>
              <Input id="rating" type="number" min={1} max={5} step={1} {...form.register('rating', { valueAsNumber: true })} />
              {form.formState.errors.rating && <p className="text-sm text-destructive">{form.formState.errors.rating.message}</p>}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="userDisplayName">Nome do Avaliador *</Label>
            <Input id="userDisplayName" {...form.register('userDisplayName')} />
            {form.formState.errors.userDisplayName && <p className="text-sm text-destructive">{form.formState.errors.userDisplayName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário</Label>
            <Textarea id="comment" {...form.register('comment')} rows={4} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{defaultValues ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
