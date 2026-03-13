/**
 * Formulário de criação/edição de UserWin (Arrematações).
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
import { toast } from 'sonner';
import { userWinSchema, type UserWinFormValues, PAYMENT_STATUS_OPTIONS, RETRIEVAL_STATUS_OPTIONS } from './schema';
import { createUserWin, updateUserWin } from './actions';
import { listLots } from '../lots/actions';
import { listUsersAction } from '../users/actions';
import type { UserWinRow } from './types';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editingItem: UserWinRow | null;
  onSuccess: () => void;
}

export default function UserWinForm({ open, onOpenChange, editingItem, onSuccess }: Props) {
  const [lots, setLots] = useState<{ id: string; title: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; label: string }[]>([]);

  const form = useForm<UserWinFormValues>({ resolver: zodResolver(userWinSchema), defaultValues: { lotId: '', userId: '', winningBidAmount: '', winDate: '', paymentStatus: 'PENDENTE', retrievalStatus: 'PENDENTE', invoiceUrl: '' } });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      listLots({ page: 1, pageSize: 200 }),
      listUsersAction({ page: 1, pageSize: 500 }),
    ]).then(([lr, ur]) => {
      if (lr?.success && lr.data) setLots((lr.data as any).data?.map((l: any) => ({ id: l.id, title: l.title })) ?? []);
      if (ur?.success && ur.data) setUsers((ur.data as any).data?.map((u: any) => ({ id: u.id, label: u.fullName || u.email })) ?? []);
    });
  }, [open]);

  useEffect(() => {
    if (open && editingItem) {
      form.reset({
        lotId: editingItem.lotId,
        userId: editingItem.userId,
        winningBidAmount: String(editingItem.winningBidAmount),
        winDate: editingItem.winDate ? editingItem.winDate.substring(0, 10) : '',
        paymentStatus: editingItem.paymentStatus,
        retrievalStatus: editingItem.retrievalStatus,
        invoiceUrl: editingItem.invoiceUrl ?? '',
      });
    } else if (open) {
      form.reset({ lotId: '', userId: '', winningBidAmount: '', winDate: '', paymentStatus: 'PENDENTE', retrievalStatus: 'PENDENTE', invoiceUrl: '' });
    }
  }, [open, editingItem, form]);

  const onSubmit = async (values: UserWinFormValues) => {
    const res = editingItem ? await updateUserWin({ id: editingItem.id, ...values }) : await createUserWin(values);
    if (res?.success) { toast.success(editingItem ? 'Atualizado!' : 'Criado!'); onSuccess(); onOpenChange(false); }
    else toast.error(res?.error ?? 'Erro');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>{editingItem ? 'Editar' : 'Nova'} Arrematação</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Lote *</Label>
            <Select value={form.watch('lotId')} onValueChange={v => form.setValue('lotId', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{lots.map(l => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}</SelectContent>
            </Select>
            {form.formState.errors.lotId && <p className="text-sm text-destructive">{form.formState.errors.lotId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Usuário *</Label>
            <Select value={form.watch('userId')} onValueChange={v => form.setValue('userId', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}</SelectContent>
            </Select>
            {form.formState.errors.userId && <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Valor do Lance Vencedor *</Label>
            <Input type="number" step="0.01" {...form.register('winningBidAmount')} />
            {form.formState.errors.winningBidAmount && <p className="text-sm text-destructive">{form.formState.errors.winningBidAmount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Data da Arrematação *</Label>
            <Input type="date" {...form.register('winDate')} />
            {form.formState.errors.winDate && <p className="text-sm text-destructive">{form.formState.errors.winDate.message}</p>}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Status Pagamento *</Label>
            <Select value={form.watch('paymentStatus')} onValueChange={v => form.setValue('paymentStatus', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAYMENT_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status Retirada *</Label>
            <Select value={form.watch('retrievalStatus')} onValueChange={v => form.setValue('retrievalStatus', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RETRIEVAL_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>URL da Fatura</Label>
            <Input {...form.register('invoiceUrl')} placeholder="https://..." />
          </div>

          <Button type="submit" className="w-full">{editingItem ? 'Salvar' : 'Criar'}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
