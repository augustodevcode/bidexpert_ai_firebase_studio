/**
 * @fileoverview Formulário de VehicleMake em Sheet overlay — Admin Plus.
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
import { createVehicleMakeSchema, type CreateVehicleMakeInput } from './schema';
import type { VehicleMake } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateVehicleMakeInput) => Promise<void>;
  defaultValues?: VehicleMake | null;
}

export function VehicleMakeForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<CreateVehicleMakeInput>({
    resolver: zodResolver(createVehicleMakeSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ name: defaultValues?.name ?? '' });
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto" data-ai-id="vehicle-make-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Marca' : 'Nova Marca'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize o nome da marca de veículo.' : 'Cadastre uma nova marca de veículo. O slug será gerado automaticamente.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-ai-id="vehicle-make-form">
          <div className="space-y-2">
            <Label htmlFor="vm-name">Nome *</Label>
            <Input
              id="vm-name"
              {...form.register('name')}
              placeholder="Ex: Toyota"
              data-ai-id="vehicle-make-name-input"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ai-id="vehicle-make-form-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              data-ai-id="vehicle-make-form-submit"
            >
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
