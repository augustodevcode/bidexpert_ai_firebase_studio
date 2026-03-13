/**
 * @fileoverview Formulário de JudicialBranch — Admin Plus.
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
import { judicialBranchSchema, type JudicialBranchSchema } from './schema';
import type { JudicialBranchRow } from './types';
import { listJudicialDistricts } from '../judicial-districts/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: JudicialBranchSchema) => Promise<void>;
  defaultValues?: JudicialBranchRow | null;
}

export function JudicialBranchForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues;
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<JudicialBranchSchema>({
    resolver: zodResolver(judicialBranchSchema),
    defaultValues: { name: '', slug: '', districtId: '', contactName: '', phone: '', email: '' },
  });

  useEffect(() => {
    if (!open) return;
    listJudicialDistricts({ page: 1, pageSize: 500 }).then((res) => {
      if (res?.success && res.data?.data) {
        setDistricts(res.data.data.map((d: Record<string, unknown>) => ({ id: String(d.id), name: String(d.name) })));
      }
    });
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        name: defaultValues.name ?? '',
        slug: defaultValues.slug ?? '',
        districtId: defaultValues.districtId ?? '',
        contactName: defaultValues.contactName ?? '',
        phone: defaultValues.phone ?? '',
        email: defaultValues.email ?? '',
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
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="judicial-branch-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Vara' : 'Nova Vara'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados da vara judicial.' : 'Preencha os dados da nova vara.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleFormSubmit} className="mt-6 space-y-4" data-ai-id="judicial-branch-form">
          <div className="space-y-2">
            <Label htmlFor="jb-name">Nome *</Label>
            <Input id="jb-name" {...form.register('name')} data-ai-id="judicial-branch-field-name" />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="jb-slug">Slug *</Label>
            <Input id="jb-slug" {...form.register('slug')} data-ai-id="judicial-branch-field-slug" />
            {form.formState.errors.slug && (
              <p className="text-destructive text-xs">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Comarca</Label>
            <Select
              value={form.watch('districtId') ?? ''}
              onValueChange={(v) => form.setValue('districtId', v)}
            >
              <SelectTrigger data-ai-id="judicial-branch-field-districtId">
                <SelectValue placeholder="Selecione uma comarca" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jb-contactName">Nome do Contato</Label>
            <Input id="jb-contactName" {...form.register('contactName')} data-ai-id="judicial-branch-field-contactName" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jb-phone">Telefone</Label>
            <Input id="jb-phone" {...form.register('phone')} data-ai-id="judicial-branch-field-phone" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jb-email">E-mail</Label>
            <Input id="jb-email" type="email" {...form.register('email')} data-ai-id="judicial-branch-field-email" />
            {form.formState.errors.email && (
              <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-ai-id="judicial-branch-form-cancel">
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} data-ai-id="judicial-branch-form-submit">
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
