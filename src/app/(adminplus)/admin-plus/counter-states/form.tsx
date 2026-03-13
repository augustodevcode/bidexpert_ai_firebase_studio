/**
 * @fileoverview Formulário dialog para CounterState — Admin Plus.
 * Campos: entityType (text) + currentValue (number).
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';

import { counterStateSchema, type CounterStateFormValues } from './schema';
import { createCounterStateAction, updateCounterStateAction } from './actions';
import type { CounterStateRow } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRow?: CounterStateRow | null;
  onSuccess: () => void;
}

export function CounterStateForm({ open, onOpenChange, editRow, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);
  const isEdit = !!editRow;

  const form = useForm<CounterStateFormValues>({
    resolver: zodResolver(counterStateSchema),
    defaultValues: { entityType: '', currentValue: 0 },
  });

  useEffect(() => {
    if (open && editRow) {
      form.reset({ entityType: editRow.entityType, currentValue: editRow.currentValue });
    } else if (open) {
      form.reset({ entityType: '', currentValue: 0 });
    }
  }, [open, editRow, form]);

  const onSubmit = async (values: CounterStateFormValues) => {
    setSaving(true);
    try {
      const action = isEdit
        ? updateCounterStateAction({ ...values, id: editRow!.id })
        : createCounterStateAction(values);
      const res = await action;
      if (res?.success) {
        toast.success(isEdit ? 'Contador atualizado.' : 'Contador criado.');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res?.error ?? 'Erro ao salvar.');
      }
    } catch {
      toast.error('Erro inesperado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]" data-ai-id="counter-state-dialog">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Contador' : 'Novo Contador'}</DialogTitle>
        </DialogHeader>
        <CrudFormShell form={form} onSubmit={onSubmit}>
          <div className="grid gap-4">
            <Field label="Tipo de Entidade *">
              <Input {...form.register('entityType')} placeholder="ex: Auction, Lot, Invoice" data-ai-id="counter-entity-type" />
            </Field>
            <Field label="Valor Atual">
              <Input type="number" {...form.register('currentValue', { valueAsNumber: true })} data-ai-id="counter-current-value" />
            </Field>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={saving} data-ai-id="counter-state-save">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </CrudFormShell>
      </DialogContent>
    </Dialog>
  );
}
