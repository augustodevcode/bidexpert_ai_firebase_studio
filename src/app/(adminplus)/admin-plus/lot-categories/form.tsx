/**
 * @fileoverview Formulário para LotCategory — Admin Plus.
 * Campos: name, slug, description, URLs de imagem, flags.
 */
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { lotCategorySchema } from './schema';
import type { LotCategoryRow } from './types';

type FormValues = z.infer<typeof lotCategorySchema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: FormValues) => Promise<void>;
  defaultValues?: Partial<LotCategoryRow> | null;
}

export function LotCategoryForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(lotCategorySchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      slug: defaultValues?.slug ?? '',
      description: defaultValues?.description ?? '',
      logoUrl: defaultValues?.logoUrl ?? '',
      coverImageUrl: defaultValues?.coverImageUrl ?? '',
      megaMenuImageUrl: defaultValues?.megaMenuImageUrl ?? '',
      dataAiHintLogo: '',
      dataAiHintCover: '',
      dataAiHintMegaMenu: '',
      hasSubcategories: defaultValues?.hasSubcategories ?? false,
      isGlobal: defaultValues?.isGlobal ?? true,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: defaultValues?.name ?? '',
      slug: defaultValues?.slug ?? '',
      description: defaultValues?.description ?? '',
      logoUrl: defaultValues?.logoUrl ?? '',
      coverImageUrl: defaultValues?.coverImageUrl ?? '',
      megaMenuImageUrl: defaultValues?.megaMenuImageUrl ?? '',
      dataAiHintLogo: '',
      dataAiHintCover: '',
      dataAiHintMegaMenu: '',
      hasSubcategories: defaultValues?.hasSubcategories ?? false,
      isGlobal: defaultValues?.isGlobal ?? true,
    });
  }, [open, defaultValues, form]);

  return (
    <CrudFormShell
      title={isEdit ? 'Editar Categoria' : 'Nova Categoria'}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      data-ai-id="lot-category-form"
    >
      {/* ── Dados Básicos ── */}
      <Field label="Nome" name="name" register={form.register} error={form.formState.errors.name} required data-ai-id="lot-category-field-name" />
      <Field label="Slug" name="slug" register={form.register} error={form.formState.errors.slug} required data-ai-id="lot-category-field-slug" />
      <Field label="Descrição" name="description" register={form.register} error={form.formState.errors.description} multiline data-ai-id="lot-category-field-description" />

      <Separator className="my-4" />
      <p className="text-sm font-semibold text-foreground">Imagens</p>

      <Field label="URL do Logo" name="logoUrl" register={form.register} error={form.formState.errors.logoUrl} data-ai-id="lot-category-field-logo-url" />
      <Field label="URL da Capa" name="coverImageUrl" register={form.register} error={form.formState.errors.coverImageUrl} data-ai-id="lot-category-field-cover-url" />
      <Field label="URL Mega Menu" name="megaMenuImageUrl" register={form.register} error={form.formState.errors.megaMenuImageUrl} data-ai-id="lot-category-field-mega-menu-url" />

      <Separator className="my-4" />
      <p className="text-sm font-semibold text-foreground">Opções</p>

      <div className="flex items-center justify-between gap-4" data-ai-id="lot-category-toggle-subcategories">
        <Label htmlFor="hasSubcategories">Possui Subcategorias</Label>
        <Switch
          id="hasSubcategories"
          checked={form.watch('hasSubcategories')}
          onCheckedChange={(v) => form.setValue('hasSubcategories', v)}
        />
      </div>
      <div className="flex items-center justify-between gap-4" data-ai-id="lot-category-toggle-global">
        <Label htmlFor="isGlobal">Global (visível em todos os tenants)</Label>
        <Switch
          id="isGlobal"
          checked={form.watch('isGlobal')}
          onCheckedChange={(v) => form.setValue('isGlobal', v)}
        />
      </div>
    </CrudFormShell>
  );
}
