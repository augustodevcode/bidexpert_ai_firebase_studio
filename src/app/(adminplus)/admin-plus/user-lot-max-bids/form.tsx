/**
 * Formulário de criação/edição de UserLotMaxBid.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { userLotMaxBidSchema, type UserLotMaxBidFormData } from './schema';
import type { UserLotMaxBidRow } from './types';
import { listUsersAction } from '../users/actions';
import { listLots } from '../lots/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserLotMaxBidFormData) => void;
  defaultValues?: UserLotMaxBidRow | null;
}

export function UserLotMaxBidForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const form = useForm<UserLotMaxBidFormData>({ resolver: zodResolver(userLotMaxBidSchema), defaultValues: { userId: '', lotId: '', maxAmount: 0, isActive: true } });
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [lots, setLots] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    listUsersAction({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setUsers(r.data.data.map((u: any) => ({ id: u.id, name: u.name }))); });
    listLots({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setLots(r.data.data.map((l: any) => ({ id: l.id, title: l.title }))); });
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({ userId: defaultValues.userId, lotId: defaultValues.lotId, maxAmount: defaultValues.maxAmount, isActive: defaultValues.isActive });
    } else if (open) {
      form.reset({ userId: '', lotId: '', maxAmount: 0, isActive: true });
    }
  }, [open, defaultValues, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto" data-ai-id="user-lot-max-bid-form">
        <SheetHeader><SheetTitle>{defaultValues ? 'Editar Lance Máximo' : 'Novo Lance Máximo'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Usuário *</Label>
            <Select value={form.watch('userId')} onValueChange={(v) => form.setValue('userId', v)}>
              <SelectTrigger id="userId"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{users.map(u => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.userId && <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lotId">Lote *</Label>
            <Select value={form.watch('lotId')} onValueChange={(v) => form.setValue('lotId', v)}>
              <SelectTrigger id="lotId"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{lots.map(l => (<SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.lotId && <p className="text-sm text-destructive">{form.formState.errors.lotId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAmount">Valor Máximo (R$) *</Label>
            <Input id="maxAmount" type="number" step={0.01} min={0} {...form.register('maxAmount', { valueAsNumber: true })} />
            {form.formState.errors.maxAmount && <p className="text-sm text-destructive">{form.formState.errors.maxAmount.message}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Switch id="isActive" checked={form.watch('isActive')} onCheckedChange={(v) => form.setValue('isActive', v)} />
            <Label htmlFor="isActive">Ativo</Label>
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
