/**
 * @fileoverview Formulário Dialog para Seller (create/edit) — Admin Plus.
 */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { CrudFormShell } from '@/components/admin-plus/crud-form-shell';
import { Field } from '@/components/admin-plus/field';
import { sellerSchema, type SellerInput } from './schema';
import { createSeller, updateSeller } from './actions';
import type { SellerRow } from './types';

interface SellerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: SellerRow | null;
  onSuccess: () => void;
}

export function SellerForm({ open, onOpenChange, editItem, onSuccess }: SellerFormProps) {
  const form = useForm<SellerInput>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      publicId: '', name: '', slug: '', description: '',
      email: '', phone: '', contactName: '', website: '',
      address: '', city: '', state: '', zipCode: '',
      street: '', number: '', complement: '', neighborhood: '',
      isJudicial: false, logoUrl: '',
    },
  });

  useEffect(() => {
    if (editItem) {
      form.reset({
        publicId: editItem.publicId,
        name: editItem.name,
        slug: editItem.slug,
        description: editItem.description ?? '',
        email: editItem.email ?? '',
        phone: editItem.phone ?? '',
        contactName: editItem.contactName ?? '',
        city: editItem.city ?? '',
        state: editItem.state ?? '',
        isJudicial: editItem.isJudicial,
      });
    } else {
      form.reset({
        publicId: '', name: '', slug: '', description: '',
        email: '', phone: '', contactName: '', website: '',
        address: '', city: '', state: '', zipCode: '',
        street: '', number: '', complement: '', neighborhood: '',
        isJudicial: false, logoUrl: '',
      });
    }
  }, [editItem, form]);

  const onSubmit = async (data: SellerInput) => {
    const action = editItem
      ? updateSeller({ ...data, id: editItem.id })
      : createSeller(data);
    const res = await action;
    if (res?.success) {
      toast.success(editItem ? 'Vendedor atualizado' : 'Vendedor criado');
      form.reset();
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(res?.error ?? 'Erro ao salvar vendedor');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-ai-id="seller-form-dialog">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Editar Vendedor' : 'Novo Vendedor'}</DialogTitle>
        </DialogHeader>
        <CrudFormShell form={form} onSubmit={onSubmit} submitLabel={editItem ? 'Salvar' : 'Criar'}>
          {/* --- Identificação --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ID Público" required error={form.formState.errors.publicId?.message}>
              <input {...form.register('publicId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-publicId-input" />
            </Field>
            <Field label="Slug" required error={form.formState.errors.slug?.message}>
              <input {...form.register('slug')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-slug-input" />
            </Field>
          </div>

          <Field label="Nome" required error={form.formState.errors.name?.message}>
            <input {...form.register('name')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-name-input" />
          </Field>

          <Field label="Descrição" error={form.formState.errors.description?.message}>
            <textarea {...form.register('description')} rows={3} className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" data-ai-id="seller-description-input" />
          </Field>

          <Separator />

          {/* --- Contato --- */}
          <h3 className="text-sm font-semibold text-muted-foreground">Contato</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" error={form.formState.errors.email?.message}>
              <input {...form.register('email')} type="email" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-email-input" />
            </Field>
            <Field label="Telefone" error={form.formState.errors.phone?.message}>
              <input {...form.register('phone')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-phone-input" />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome do contato" error={form.formState.errors.contactName?.message}>
              <input {...form.register('contactName')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-contactName-input" />
            </Field>
            <Field label="Website" error={form.formState.errors.website?.message}>
              <input {...form.register('website')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-website-input" />
            </Field>
          </div>

          <Separator />

          {/* --- Endereço --- */}
          <h3 className="text-sm font-semibold text-muted-foreground">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Rua" error={form.formState.errors.street?.message}>
              <input {...form.register('street')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-street-input" />
            </Field>
            <Field label="Número" error={form.formState.errors.number?.message}>
              <input {...form.register('number')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-number-input" />
            </Field>
            <Field label="Complemento" error={form.formState.errors.complement?.message}>
              <input {...form.register('complement')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-complement-input" />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Bairro" error={form.formState.errors.neighborhood?.message}>
              <input {...form.register('neighborhood')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-neighborhood-input" />
            </Field>
            <Field label="Cidade" error={form.formState.errors.city?.message}>
              <input {...form.register('city')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-city-input" />
            </Field>
            <Field label="UF" error={form.formState.errors.state?.message}>
              <input {...form.register('state')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-state-input" />
            </Field>
          </div>
          <Field label="CEP" error={form.formState.errors.zipCode?.message}>
            <input {...form.register('zipCode')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" data-ai-id="seller-zipCode-input" />
          </Field>

          <Separator />

          {/* --- Flags --- */}
          <Field label="Vendedor Judicial">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch('isJudicial')}
                onCheckedChange={(v) => form.setValue('isJudicial', v)}
                data-ai-id="seller-isJudicial-switch"
              />
              <span className="text-sm text-muted-foreground">
                {form.watch('isJudicial') ? 'Sim' : 'Não'}
              </span>
            </div>
          </Field>
        </CrudFormShell>
      </DialogContent>
    </Dialog>
  );
}
