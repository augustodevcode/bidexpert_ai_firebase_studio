/**
 * @fileoverview Formulário de Cidade (City) em Sheet overlay — Admin Plus.
 * Inclui dropdown de Estado (stateId) como FK obrigatória.
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
import { createCitySchema, type CreateCityInput } from './schema';
import { listStatesAction } from '../states/actions';
import type { CityInfo, StateInfo } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateCityInput) => Promise<void>;
  defaultValues?: CityInfo | null;
}

export function CityForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;
  const [states, setStates] = useState<StateInfo[]>([]);

  const form = useForm<CreateCityInput>({
    resolver: zodResolver(createCitySchema),
    defaultValues: { name: '', stateId: '', ibgeCode: '', latitude: null, longitude: null },
  });

  useEffect(() => {
    if (!open) return;
    listStatesAction(undefined as never).then((res) => {
      if (res?.success && res.data?.data) {
        setStates(res.data.data);
      }
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: defaultValues?.name ?? '',
      stateId: defaultValues?.stateId ?? '',
      ibgeCode: defaultValues?.ibgeCode ?? '',
      latitude: defaultValues?.latitude ?? null,
      longitude: defaultValues?.longitude ?? null,
    });
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto" data-ai-id="city-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Cidade' : 'Nova Cidade'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados da cidade.' : 'Cadastre uma nova cidade no sistema.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-ai-id="city-form">
          <div className="space-y-2">
            <Label htmlFor="city-name">Nome *</Label>
            <Input
              id="city-name"
              {...form.register('name')}
              placeholder="Ex: São Paulo"
              data-ai-id="city-field-name"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Estado *</Label>
            <Select
              value={form.watch('stateId') ?? ''}
              onValueChange={(v) => form.setValue('stateId', v, { shouldValidate: true })}
            >
              <SelectTrigger data-ai-id="city-field-stateId">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name} ({state.uf})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.stateId && (
              <p className="text-destructive text-xs">{form.formState.errors.stateId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city-ibgeCode">Código IBGE</Label>
            <Input
              id="city-ibgeCode"
              {...form.register('ibgeCode')}
              placeholder="Ex: 3550308"
              data-ai-id="city-field-ibgeCode"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city-latitude">Latitude</Label>
              <Input
                id="city-latitude"
                type="number"
                step="any"
                {...form.register('latitude')}
                placeholder="-23.5505"
                data-ai-id="city-field-latitude"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city-longitude">Longitude</Label>
              <Input
                id="city-longitude"
                type="number"
                step="any"
                {...form.register('longitude')}
                placeholder="-46.6333"
                data-ai-id="city-field-longitude"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ai-id="city-form-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              data-ai-id="city-form-submit"
            >
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
