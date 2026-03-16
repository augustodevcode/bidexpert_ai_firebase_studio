/**
 * @fileoverview Formulário de VehicleModel em Sheet overlay — Admin Plus.
 * Inclui dropdown de Marca (makeId) como FK obrigatória.
 */
'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createVehicleModelSchema, type CreateVehicleModelInput } from './schema';
import { listVehicleMakesAction } from '../vehicle-makes/actions';
import type { VehicleModel, VehicleMake } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateVehicleModelInput) => Promise<void>;
  defaultValues?: VehicleModel | null;
}

export function VehicleModelForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;
  const [makes, setMakes] = useState<VehicleMake[]>([]);

  const form = useForm<CreateVehicleModelInput>({
    resolver: zodResolver(createVehicleModelSchema),
    defaultValues: { name: '', makeId: '' },
  });

  useEffect(() => {
    if (!open) return;
    listVehicleMakesAction(undefined as never).then((res) => {
      if (res?.success && res.data?.data) {
        setMakes(res.data.data);
      }
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: defaultValues?.name ?? '',
      makeId: defaultValues?.makeId ?? '',
    });
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto" data-ai-id="vehicle-model-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Modelo' : 'Novo Modelo'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados do modelo de veículo.' : 'Cadastre um novo modelo de veículo no sistema.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-ai-id="vehicle-model-form">
          <div className="space-y-2">
            <Label htmlFor="vmodel-name">Nome *</Label>
            <Input
              id="vmodel-name"
              {...form.register('name')}
              placeholder="Ex: Civic"
              data-ai-id="vehicle-model-field-name"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Marca *</Label>
            <Select
              value={form.watch('makeId') ?? ''}
              onValueChange={(v) => form.setValue('makeId', v, { shouldValidate: true })}
            >
              <SelectTrigger data-ai-id="vehicle-model-field-makeId">
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent>
                {makes.map((make) => (
                  <SelectItem key={make.id} value={make.id}>
                    {make.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.makeId && (
              <p className="text-destructive text-xs">{form.formState.errors.makeId.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ai-id="vehicle-model-form-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              data-ai-id="vehicle-model-form-submit"
            >
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
