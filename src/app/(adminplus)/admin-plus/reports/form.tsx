/**
 * @fileoverview Formulário lateral para criação e edição de Report no Admin Plus.
 */
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { reportSchema, type ReportFormData } from './schema';
import type { ReportRow } from './types';

interface ReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReportFormData) => void;
  defaultValues?: ReportRow | null;
}

const EMPTY_JSON = JSON.stringify({ blocks: [], filters: [], version: 1 }, null, 2);

export function ReportForm({ open, onOpenChange, onSubmit, defaultValues }: ReportFormProps) {
  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: '',
      description: '',
      definitionText: EMPTY_JSON,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      definitionText: defaultValues?.definitionText ?? EMPTY_JSON,
    });
  }, [defaultValues, form, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[640px] overflow-y-auto" data-ai-id="report-form-sheet">
        <SheetHeader>
          <SheetTitle>{defaultValues ? 'Editar relatório' : 'Novo relatório'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-name">Nome</Label>
            <Input id="report-name" {...form.register('name')} />
            {form.formState.errors.name ? <p className="text-sm text-destructive">{form.formState.errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-description">Descrição</Label>
            <Textarea id="report-description" rows={3} {...form.register('description')} />
            {form.formState.errors.description ? <p className="text-sm text-destructive">{form.formState.errors.description.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-definition">Definição JSON</Label>
            <Textarea id="report-definition" rows={16} className="font-mono text-xs" {...form.register('definitionText')} />
            {form.formState.errors.definitionText ? <p className="text-sm text-destructive">{form.formState.errors.definitionText.message}</p> : null}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{defaultValues ? 'Salvar alterações' : 'Criar relatório'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}