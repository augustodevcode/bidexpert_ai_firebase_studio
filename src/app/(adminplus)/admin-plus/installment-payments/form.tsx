/**
 * Formulário de criação/edição de InstallmentPayment (Parcelas de Pagamento).
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
import { installmentPaymentSchema, type InstallmentPaymentFormValues, INSTALLMENT_STATUS_OPTIONS } from './schema';
import { createInstallmentPayment, updateInstallmentPayment } from './actions';
import { listUserWins } from '../user-wins/actions';
import type { InstallmentPaymentRow } from './types';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editingItem: InstallmentPaymentRow | null;
  onSuccess: () => void;
}

export default function InstallmentPaymentForm({ open, onOpenChange, editingItem, onSuccess }: Props) {
  const [wins, setWins] = useState<{ id: string; label: string }[]>([]);

  const form = useForm<InstallmentPaymentFormValues>({ resolver: zodResolver(installmentPaymentSchema), defaultValues: { userWinId: '', installmentNumber: '', amount: '', dueDate: '', paidAt: '', status: 'PENDENTE', paymentMethod: '', transactionId: '' } });

  useEffect(() => {
    if (!open) return;
    listUserWins({ page: 1, pageSize: 500 }).then(r => {
      if (r?.success && r.data) setWins((r.data as any).data?.map((w: any) => ({ id: w.id, label: `#${w.id} - ${w.lotTitle}` })) ?? []);
    });
  }, [open]);

  useEffect(() => {
    if (open && editingItem) {
      form.reset({
        userWinId: editingItem.userWinId,
        installmentNumber: String(editingItem.installmentNumber),
        amount: String(editingItem.amount),
        dueDate: editingItem.dueDate ? editingItem.dueDate.substring(0, 10) : '',
        paidAt: editingItem.paidAt ? editingItem.paidAt.substring(0, 10) : '',
        status: editingItem.status,
        paymentMethod: editingItem.paymentMethod ?? '',
        transactionId: editingItem.transactionId ?? '',
      });
    } else if (open) {
      form.reset({ userWinId: '', installmentNumber: '', amount: '', dueDate: '', paidAt: '', status: 'PENDENTE', paymentMethod: '', transactionId: '' });
    }
  }, [open, editingItem, form]);

  const onSubmit = async (values: InstallmentPaymentFormValues) => {
    const res = editingItem ? await updateInstallmentPayment({ id: editingItem.id, ...values }) : await createInstallmentPayment(values);
    if (res?.success) { toast.success(editingItem ? 'Atualizado!' : 'Criado!'); onSuccess(); onOpenChange(false); }
    else toast.error(res?.error ?? 'Erro');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>{editingItem ? 'Editar' : 'Nova'} Parcela</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Arrematação *</Label>
            <Select value={form.watch('userWinId')} onValueChange={v => form.setValue('userWinId', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{wins.map(w => <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>)}</SelectContent>
            </Select>
            {form.formState.errors.userWinId && <p className="text-sm text-destructive">{form.formState.errors.userWinId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nº Parcela *</Label>
              <Input type="number" {...form.register('installmentNumber')} />
              {form.formState.errors.installmentNumber && <p className="text-sm text-destructive">{form.formState.errors.installmentNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input type="number" step="0.01" {...form.register('amount')} />
              {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vencimento *</Label>
              <Input type="date" {...form.register('dueDate')} />
            </div>
            <div className="space-y-2">
              <Label>Data Pagamento</Label>
              <Input type="date" {...form.register('paidAt')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status *</Label>
            <Select value={form.watch('status')} onValueChange={v => form.setValue('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INSTALLMENT_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Método Pagamento</Label>
              <Input {...form.register('paymentMethod')} />
            </div>
            <div className="space-y-2">
              <Label>ID Transação</Label>
              <Input {...form.register('transactionId')} />
            </div>
          </div>

          <Button type="submit" className="w-full">{editingItem ? 'Salvar' : 'Criar'}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
