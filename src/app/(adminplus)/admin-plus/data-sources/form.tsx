/**
 * @fileoverview Formulário de DataSource em Sheet overlay — Admin Plus.
 */
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createDataSourceSchema, type CreateDataSourceInput } from './schema';

interface DSRow {
  id: string;
  name: string;
  modelName: string;
  fields: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateDataSourceInput) => Promise<void>;
  defaultValues?: DSRow | null;
}

export function DataSourceForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<CreateDataSourceInput>({
    resolver: zodResolver(createDataSourceSchema),
    defaultValues: { name: '', modelName: '', fields: '[]' },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: defaultValues?.name ?? '',
      modelName: defaultValues?.modelName ?? '',
      fields: defaultValues?.fields ?? '[]',
    });
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="data-source-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar DataSource' : 'Novo DataSource'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados da fonte de dados.' : 'Cadastre uma nova fonte de dados para relatórios.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-ai-id="data-source-form">
          <div className="space-y-2">
            <Label htmlFor="ds-name">Nome *</Label>
            <Input
              id="ds-name"
              {...form.register('name')}
              placeholder="Ex: Leilões Ativos"
              data-ai-id="data-source-field-name"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ds-modelName">Nome do Model *</Label>
            <Input
              id="ds-modelName"
              {...form.register('modelName')}
              placeholder="Ex: Auction"
              data-ai-id="data-source-field-modelName"
            />
            {form.formState.errors.modelName && (
              <p className="text-destructive text-xs">{form.formState.errors.modelName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ds-fields">Campos (JSON) *</Label>
            <Textarea
              id="ds-fields"
              {...form.register('fields')}
              placeholder='[{"name": "id", "type": "string"}, {"name": "title", "type": "string"}]'
              rows={6}
              className="font-mono text-xs"
              data-ai-id="data-source-field-fields"
            />
            {form.formState.errors.fields && (
              <p className="text-destructive text-xs">{form.formState.errors.fields.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ai-id="data-source-form-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              data-ai-id="data-source-form-submit"
            >
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
