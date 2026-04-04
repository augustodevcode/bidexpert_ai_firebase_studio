/**
 * @fileoverview Formulário de criação/edição de BidderProfile — Admin Plus.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { bidderProfileSchema, type BidderProfileFormValues } from './schema';
import { createBidderProfile, updateBidderProfile } from './actions';
import { listUsers } from '../users/actions';
import type { BidderProfileRow } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: BidderProfileRow | null;
  onSuccess: () => void;
}

export function BidderProfileForm({ open, onOpenChange, editItem, onSuccess }: Props) {
  const isEdit = !!editItem;
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  const form = useForm<BidderProfileFormValues>({
    resolver: zodResolver(bidderProfileSchema),
    defaultValues: {
      userId: '',
      fullName: '',
      cpf: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      documentStatus: 'PENDING',
      emailNotifications: true,
      smsNotifications: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    listUsers({ page: 1, pageSize: 500, search: '', sortField: 'name', sortOrder: 'asc' })
      .then((res) => {
        if (res?.success && res.data?.data) {
          setUsers(res.data.data.map((u: { id: string; name: string; email: string }) => ({ id: u.id, name: u.name, email: u.email })));
        }
      });
  }, [open]);

  useEffect(() => {
    if (open && editItem) {
      form.reset({
        id: editItem.id,
        userId: editItem.userId,
        fullName: editItem.fullName ?? '',
        cpf: editItem.cpf ?? '',
        phone: editItem.phone ?? '',
        dateOfBirth: editItem.dateOfBirth ? editItem.dateOfBirth.slice(0, 10) : '',
        city: editItem.city ?? '',
        state: editItem.state ?? '',
        documentStatus: editItem.documentStatus as BidderProfileFormValues['documentStatus'],
        emailNotifications: editItem.emailNotifications,
        smsNotifications: editItem.smsNotifications,
        isActive: editItem.isActive,
      });
    } else if (open) {
      form.reset({
        userId: '',
        fullName: '',
        cpf: '',
        phone: '',
        dateOfBirth: '',
        city: '',
        state: '',
        documentStatus: 'PENDING',
        emailNotifications: true,
        smsNotifications: false,
        isActive: true,
      });
    }
  }, [open, editItem, form]);

  const onSubmit = async (values: BidderProfileFormValues) => {
    const action = isEdit ? updateBidderProfile : createBidderProfile;
    const res = await action(values);
    if (res?.success) {
      toast.success(isEdit ? 'Perfil atualizado' : 'Perfil criado');
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(res?.error ?? 'Erro ao salvar');
    }
  };

  const statusOptions = [
    { value: 'PENDING', label: 'Pendente' },
    { value: 'UNDER_REVIEW', label: 'Em Análise' },
    { value: 'APPROVED', label: 'Aprovado' },
    { value: 'REJECTED', label: 'Rejeitado' },
    { value: 'EXPIRED', label: 'Expirado' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto" data-ai-id="bidder-profile-form-dialog">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Perfil de Arrematante' : 'Novo Perfil de Arrematante'}</SheetTitle>
        </SheetHeader>
        <CrudFormShell form={form} onSubmit={onSubmit}>
      <div className="space-y-6" data-ai-id="bidder-profile-form-content">
        {/* Usuário */}
        <Field label="Usuário" name="userId" form={form}>
          {(field) => (
            <Select value={(field.value as string) ?? ''} onValueChange={field.onChange}>
              <SelectTrigger data-ai-id="bidder-profile-user-select">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome Completo" name="fullName" form={form} />
          <Field label="CPF" name="cpf" form={form} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefone" name="phone" form={form} />
          <Field label="Data de Nascimento" name="dateOfBirth" form={form} type="date" />
        </div>

        <Separator />

        <Field label="Endereço" name="address" form={form} />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Cidade" name="city" form={form} />
          <Field label="UF" name="state" form={form} />
          <Field label="CEP" name="zipCode" form={form} />
        </div>

        <Separator />

        <Field label="Status dos Documentos" name="documentStatus" form={form}>
          {(field) => (
            <Select value={(field.value as string) ?? 'PENDING'} onValueChange={field.onChange}>
              <SelectTrigger data-ai-id="bidder-profile-status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>

        <div className="flex items-center justify-between gap-4">
          <Field label="Notificações por Email" name="emailNotifications" form={form}>
            {(field) => (
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
                data-ai-id="bidder-profile-email-notif-switch"
              />
            )}
          </Field>
          <Field label="Notificações por SMS" name="smsNotifications" form={form}>
            {(field) => (
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
                data-ai-id="bidder-profile-sms-notif-switch"
              />
            )}
          </Field>
          <Field label="Ativo" name="isActive" form={form}>
            {(field) => (
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
                data-ai-id="bidder-profile-active-switch"
              />
            )}
          </Field>
        </div>
      </div>
        </CrudFormShell>
      </SheetContent>
    </Sheet>
  );
}
