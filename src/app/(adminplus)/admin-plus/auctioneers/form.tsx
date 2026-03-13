/**
 * @fileoverview Formulário de criação/edição de Auctioneer (Leiloeiro) — Admin Plus.
 */
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CrudFormShell } from '@/components/admin-plus/crud-form-shell';
import { Field } from '@/components/admin-plus/field';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { auctioneerSchema, type AuctioneerFormValues } from './schema';
import { createAuctioneer, updateAuctioneer } from './actions';
import type { AuctioneerRow } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: AuctioneerRow | null;
  onSuccess: () => void;
}

export function AuctioneerForm({ open, onOpenChange, editItem, onSuccess }: Props) {
  const isEdit = !!editItem;
  const form = useForm<AuctioneerFormValues>({
    resolver: zodResolver(auctioneerSchema),
    defaultValues: {
      publicId: '',
      name: '',
      slug: '',
      description: '',
      registrationNumber: '',
      email: '',
      phone: '',
      supportWhatsApp: '',
      contactName: '',
      website: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  useEffect(() => {
    if (open && editItem) {
      form.reset({
        id: editItem.id,
        publicId: editItem.publicId,
        name: editItem.name,
        slug: editItem.slug,
        description: editItem.description ?? '',
        registrationNumber: editItem.registrationNumber ?? '',
        email: editItem.email ?? '',
        phone: editItem.phone ?? '',
        contactName: editItem.contactName ?? '',
        city: editItem.city ?? '',
        state: editItem.state ?? '',
      });
    } else if (open) {
      form.reset({
        publicId: '',
        name: '',
        slug: '',
        description: '',
        registrationNumber: '',
        email: '',
        phone: '',
        contactName: '',
        city: '',
        state: '',
      });
    }
  }, [open, editItem, form]);

  const onSubmit = async (values: AuctioneerFormValues) => {
    const action = isEdit ? updateAuctioneer : createAuctioneer;
    const res = await action(values);
    if (res?.success) {
      toast.success(isEdit ? 'Leiloeiro atualizado' : 'Leiloeiro criado');
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(res?.error ?? 'Erro ao salvar');
    }
  };

  return (
    <CrudFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar Leiloeiro' : 'Novo Leiloeiro'}
      form={form}
      onSubmit={onSubmit}
      className="max-w-2xl"
      data-ai-id="auctioneer-form-dialog"
    >
      <div className="max-h-[85vh] overflow-y-auto space-y-6 pr-2" data-ai-id="auctioneer-form-content">
        {/* Identificação */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Identificação</h4>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ID Público" name="publicId" form={form} />
            <Field label="Slug" name="slug" form={form} />
          </div>
          <div className="mt-3">
            <Field label="Nome" name="name" form={form} />
          </div>
          <div className="mt-3">
            <Field label="Matrícula / Registro" name="registrationNumber" form={form} />
          </div>
          <div className="mt-3">
            <Field label="Descrição" name="description" form={form}>
              {(field) => (
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Descrição do leiloeiro"
                  rows={3}
                  data-ai-id="auctioneer-description-textarea"
                />
              )}
            </Field>
          </div>
        </div>

        <Separator />

        {/* Contato */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Contato</h4>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" name="email" form={form} />
            <Field label="Telefone" name="phone" form={form} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <Field label="WhatsApp Suporte" name="supportWhatsApp" form={form} />
            <Field label="Nome do Contato" name="contactName" form={form} />
          </div>
          <div className="mt-3">
            <Field label="Website" name="website" form={form} />
          </div>
        </div>

        <Separator />

        {/* Endereço */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Endereço</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Field label="Rua" name="street" form={form} />
            </div>
            <Field label="Número" name="number" form={form} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <Field label="Complemento" name="complement" form={form} />
            <Field label="Bairro" name="neighborhood" form={form} />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <Field label="Cidade" name="city" form={form} />
            <Field label="UF" name="state" form={form} />
            <Field label="CEP" name="zipCode" form={form} />
          </div>
        </div>
      </div>
    </CrudFormShell>
  );
}
