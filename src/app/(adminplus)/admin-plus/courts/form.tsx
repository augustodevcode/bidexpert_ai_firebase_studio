/**
 * @fileoverview Formulário de Comarca/Tribunal (Court) em Sheet overlay — Admin Plus.
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
import { createCourtSchema, type CreateCourtInput } from './schema';

interface CourtRow {
  id: string;
  name: string;
  stateUf: string;
  website?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateCourtInput) => Promise<void>;
  defaultValues?: CourtRow | null;
}

export function CourtForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<CreateCourtInput>({
    resolver: zodResolver(createCourtSchema),
    defaultValues: { name: '', stateUf: '', website: '' },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: defaultValues?.name ?? '',
      stateUf: defaultValues?.stateUf ?? '',
      website: defaultValues?.website ?? '',
    });
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto" data-ai-id="court-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Tribunal' : 'Novo Tribunal'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados da comarca/tribunal.' : 'Cadastre uma nova comarca ou tribunal.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-ai-id="court-form">
          <div className="space-y-2">
            <Label htmlFor="court-name">Nome *</Label>
            <Input
              id="court-name"
              {...form.register('name')}
              placeholder="Ex: Tribunal de Justiça de São Paulo"
              data-ai-id="court-field-name"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="court-stateUf">UF *</Label>
            <Input
              id="court-stateUf"
              {...form.register('stateUf')}
              placeholder="Ex: SP"
              maxLength={2}
              className="uppercase"
              data-ai-id="court-field-stateUf"
            />
            {form.formState.errors.stateUf && (
              <p className="text-destructive text-xs">{form.formState.errors.stateUf.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="court-website">Website</Label>
            <Input
              id="court-website"
              type="url"
              {...form.register('website')}
              placeholder="https://www.tjsp.jus.br"
              data-ai-id="court-field-website"
            />
            {form.formState.errors.website && (
              <p className="text-destructive text-xs">{form.formState.errors.website.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ai-id="court-form-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              data-ai-id="court-form-submit"
            >
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
