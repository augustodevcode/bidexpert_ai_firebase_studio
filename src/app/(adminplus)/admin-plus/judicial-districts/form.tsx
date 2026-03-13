/**
 * @fileoverview Formulário de JudicialDistrict — Admin Plus.
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
import { judicialDistrictSchema, type JudicialDistrictSchema } from './schema';
import type { JudicialDistrictRow } from './types';
import { listCourtsAction } from '../courts/actions';
import { listStatesAction } from '../states/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: JudicialDistrictSchema) => Promise<void>;
  defaultValues?: JudicialDistrictRow | null;
}

export function JudicialDistrictForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues;
  const [courts, setCourts] = useState<{ id: string; name: string }[]>([]);
  const [states, setStates] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<JudicialDistrictSchema>({
    resolver: zodResolver(judicialDistrictSchema),
    defaultValues: { name: '', slug: '', courtId: '', stateId: '', zipCode: '' },
  });

  useEffect(() => {
    if (!open) return;
    listCourtsAction({ page: 1, pageSize: 500 }).then((res) => {
      if (res?.success && res.data?.data) setCourts(res.data.data.map((c: Record<string, unknown>) => ({ id: String(c.id), name: String(c.name) })));
    });
    listStatesAction({ page: 1, pageSize: 500 }).then((res) => {
      if (res?.success && res.data?.data) setStates(res.data.data.map((s: Record<string, unknown>) => ({ id: String(s.id), name: String(s.name) })));
    });
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        name: defaultValues.name ?? '',
        slug: defaultValues.slug ?? '',
        courtId: defaultValues.courtId ?? '',
        stateId: defaultValues.stateId ?? '',
        zipCode: defaultValues.zipCode ?? '',
      });
    } else if (open) {
      form.reset();
    }
  }, [open, defaultValues, form]);

  const handleFormSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="judicial-district-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Comarca' : 'Nova Comarca'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados da comarca.' : 'Preencha os dados da nova comarca.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleFormSubmit} className="mt-6 space-y-4" data-ai-id="judicial-district-form">
          <div className="space-y-2">
            <Label htmlFor="jd-name">Nome *</Label>
            <Input id="jd-name" {...form.register('name')} data-ai-id="judicial-district-field-name" />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="jd-slug">Slug *</Label>
            <Input id="jd-slug" {...form.register('slug')} data-ai-id="judicial-district-field-slug" />
            {form.formState.errors.slug && (
              <p className="text-destructive text-xs">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tribunal</Label>
            <Select
              value={form.watch('courtId') ?? ''}
              onValueChange={(v) => form.setValue('courtId', v)}
            >
              <SelectTrigger data-ai-id="judicial-district-field-courtId">
                <SelectValue placeholder="Selecione um tribunal" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={form.watch('stateId') ?? ''}
              onValueChange={(v) => form.setValue('stateId', v)}
            >
              <SelectTrigger data-ai-id="judicial-district-field-stateId">
                <SelectValue placeholder="Selecione um estado" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jd-zipCode">CEP</Label>
            <Input id="jd-zipCode" {...form.register('zipCode')} data-ai-id="judicial-district-field-zipCode" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-ai-id="judicial-district-form-cancel">
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} data-ai-id="judicial-district-form-submit">
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
