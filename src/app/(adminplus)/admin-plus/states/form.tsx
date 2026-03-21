/**
 * @fileoverview Formulário de Estado (State) em Sheet overlay — Admin Plus.
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createStateSchema, type CreateStateInput } from './schema';
import type { StateInfo } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateStateInput) => Promise<void>;
  defaultValues?: StateInfo | null;
}

export function StateForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<CreateStateInput>({
    resolver: zodResolver(createStateSchema),
    defaultValues: { name: '', uf: '' },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: defaultValues?.name ?? '',
      uf: defaultValues?.uf ?? '',
    });
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto" data-ai-id="state-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Estado' : 'Novo Estado'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados do estado.' : 'Cadastre um novo estado no sistema.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-ai-id="state-form">
          <div className="space-y-2">
            <Label htmlFor="state-name">Nome *</Label>
            <Input
              id="state-name"
              {...form.register('name')}
              placeholder="Ex: São Paulo"
              data-ai-id="state-field-name"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state-uf">UF *</Label>
            <Input
              id="state-uf"
              {...form.register('uf')}
              placeholder="Ex: SP"
              maxLength={2}
              className="uppercase"
              data-ai-id="state-field-uf"
            />
            {form.formState.errors.uf && (
              <p className="text-destructive text-xs">{form.formState.errors.uf.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ai-id="state-form-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              data-ai-id="state-form-submit"
            >
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
