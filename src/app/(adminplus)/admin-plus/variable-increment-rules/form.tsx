/**
 * @fileoverview Formulário Dialog para criação/edição de VariableIncrementRule — Admin Plus.
 */
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { variableIncrementRuleSchema, type VariableIncrementRuleFormValues } from './schema';
import type { VariableIncrementRuleRow } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row?: VariableIncrementRuleRow | null;
  onSubmit: (data: VariableIncrementRuleFormValues) => Promise<void>;
  loading?: boolean;
}

export function VariableIncrementRuleForm({ open, onOpenChange, row, onSubmit, loading }: Props) {
  const isEditing = !!row;

  const form = useForm<VariableIncrementRuleFormValues>({
    resolver: zodResolver(variableIncrementRuleSchema),
    defaultValues: { from: 0, to: undefined, increment: 0 },
  });

  useEffect(() => {
    if (row) {
      form.reset({
        from: row.from,
        to: row.to ?? undefined,
        increment: row.increment,
      });
    } else {
      form.reset({ from: 0, to: undefined, increment: 0 });
    }
  }, [row, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ai-id="variable-increment-rule-form-dialog">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Regra de Incremento' : 'Nova Regra de Incremento'}</DialogTitle>
        </DialogHeader>
        <CrudFormShell onSubmit={handleSubmit}>
          <Field label="De (R$)" error={form.formState.errors.from?.message} required>
            <Input
              type="number"
              step="0.01"
              {...form.register('from', { valueAsNumber: true })}
              data-ai-id="variable-increment-rule-from-input"
            />
          </Field>
          <Field label="Até (R$)" error={form.formState.errors.to?.message}>
            <Input
              type="number"
              step="0.01"
              placeholder="Sem limite (opcional)"
              {...form.register('to', { valueAsNumber: true, setValueAs: (v) => (v === '' || v === undefined ? null : Number(v)) })}
              data-ai-id="variable-increment-rule-to-input"
            />
          </Field>
          <Field label="Incremento (R$)" error={form.formState.errors.increment?.message} required>
            <Input
              type="number"
              step="0.01"
              {...form.register('increment', { valueAsNumber: true })}
              data-ai-id="variable-increment-rule-increment-input"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} data-ai-id="variable-increment-rule-save-btn">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </CrudFormShell>
      </DialogContent>
    </Dialog>
  );
}
