/**
 * @fileoverview Formulário para Subcategory — Admin Plus.
 * Campos: name, slug, description, parentCategoryId (FK Select), displayOrder, iconUrl, isGlobal.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subcategorySchema } from './schema';
import { listLotCategories } from '../lot-categories/actions';
import type { SubcategoryRow } from './types';

type FormValues = z.infer<typeof subcategorySchema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: FormValues) => Promise<void>;
  defaultValues?: Partial<SubcategoryRow> | null;
}

export function SubcategoryForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      parentCategoryId: '',
      displayOrder: 0,
      iconUrl: '',
      dataAiHintIcon: '',
      isGlobal: true,
    },
  });

  useEffect(() => {
    if (open) {
      listLotCategories({ page: 1, pageSize: 200 }).then((res) => {
        if (res?.success && res.data) {
          setCategories(res.data.data.map((c) => ({ id: c.id, name: c.name })));
        }
      });
    }
  }, [open]);

  useEffect(() => {
    if (defaultValues && open) {
      form.reset({
        name: defaultValues.name ?? '',
        slug: defaultValues.slug ?? '',
        description: defaultValues.description ?? '',
        parentCategoryId: defaultValues.parentCategoryId ?? '',
        displayOrder: defaultValues.displayOrder ?? 0,
        iconUrl: defaultValues.iconUrl ?? '',
        dataAiHintIcon: '',
        isGlobal: defaultValues.isGlobal ?? true,
      });
    } else if (!defaultValues && open) {
      form.reset({
        name: '',
        slug: '',
        description: '',
        parentCategoryId: '',
        displayOrder: 0,
        iconUrl: '',
        dataAiHintIcon: '',
        isGlobal: true,
      });
    }
  }, [defaultValues, open, form]);

  return (
    <CrudFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar Subcategoria' : 'Nova Subcategoria'}
      form={form}
      onSubmit={onSubmit}
      data-ai-id="subcategory-form"
    >
      {/* Dados Básicos */}
      <Field label="Nome" error={form.formState.errors.name?.message}>
        <input
          {...form.register('name')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Nome da subcategoria"
          data-ai-id="subcategory-form-name"
        />
      </Field>
      <Field label="Slug" error={form.formState.errors.slug?.message}>
        <input
          {...form.register('slug')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="slug-da-subcategoria"
          data-ai-id="subcategory-form-slug"
        />
      </Field>
      <Field label="Descrição" error={form.formState.errors.description?.message}>
        <textarea
          {...form.register('description')}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Descrição opcional"
          data-ai-id="subcategory-form-description"
        />
      </Field>

      <Separator />

      {/* FK: Categoria Pai */}
      <Field label="Categoria Pai" error={form.formState.errors.parentCategoryId?.message}>
        <Select
          value={form.watch('parentCategoryId')}
          onValueChange={(v) => form.setValue('parentCategoryId', v, { shouldValidate: true })}
        >
          <SelectTrigger data-ai-id="subcategory-form-parent-category">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Ordem de Exibição" error={form.formState.errors.displayOrder?.message}>
        <input
          type="number"
          {...form.register('displayOrder', { valueAsNumber: true })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="0"
          data-ai-id="subcategory-form-display-order"
        />
      </Field>

      <Separator />

      {/* Imagem */}
      <Field label="URL do Ícone" error={form.formState.errors.iconUrl?.message}>
        <input
          {...form.register('iconUrl')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="https://..."
          data-ai-id="subcategory-form-icon-url"
        />
      </Field>

      <Separator />

      {/* Opções */}
      <div className="flex items-center gap-3" data-ai-id="subcategory-form-is-global">
        <Switch
          checked={form.watch('isGlobal')}
          onCheckedChange={(v) => form.setValue('isGlobal', v)}
          id="subcategory-is-global"
        />
        <Label htmlFor="subcategory-is-global">Subcategoria global (visível para todos os tenants)</Label>
      </div>
    </CrudFormShell>
  );
}
