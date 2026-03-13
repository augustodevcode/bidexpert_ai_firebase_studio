/**
 * @fileoverview Formulário para UserDocument — Admin Plus.
 * Dropdowns para User e DocumentType carregados via useEffect.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CrudFormShell } from '@/components/admin-plus/crud-form-shell';
import { Field } from '@/components/admin-plus/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { userDocumentSchema } from './schema';
import { listUsersAction } from '../users/actions';
import { listDocumentTypesAction } from '../document-types/actions';
import type { UserDocumentRow } from './types';

type FormValues = z.infer<typeof userDocumentSchema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: FormValues) => Promise<void>;
  defaultValues?: Partial<UserDocumentRow> | null;
}

export function UserDocumentForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [docTypes, setDocTypes] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(userDocumentSchema),
    defaultValues: {
      userId: defaultValues?.userId ?? '',
      documentTypeId: defaultValues?.documentTypeId ?? '',
      fileName: defaultValues?.fileName ?? '',
      fileUrl: defaultValues?.fileUrl ?? '',
      status: (defaultValues?.status as FormValues['status']) ?? 'PENDING_ANALYSIS',
      rejectionReason: defaultValues?.rejectionReason ?? '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      userId: defaultValues?.userId ?? '',
      documentTypeId: defaultValues?.documentTypeId ?? '',
      fileName: defaultValues?.fileName ?? '',
      fileUrl: defaultValues?.fileUrl ?? '',
      status: (defaultValues?.status as FormValues['status']) ?? 'PENDING_ANALYSIS',
      rejectionReason: defaultValues?.rejectionReason ?? '',
    });
  }, [open, defaultValues, form]);

  useEffect(() => {
    if (!open) return;
    listUsersAction({ page: 1, pageSize: 500 }).then((res) => {
      if (res?.data && 'data' in res.data) {
        setUsers(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (res.data.data as any[]).map((u) => ({
            id: String(u.id),
            name: String(u.name ?? ''),
            email: String(u.email ?? ''),
          })),
        );
      }
    });
    listDocumentTypesAction({ page: 1, pageSize: 500 }).then((res) => {
      if (res?.data && 'data' in res.data) {
        setDocTypes(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (res.data.data as any[]).map((d) => ({
            id: String(d.id),
            name: String(d.name ?? ''),
          })),
        );
      }
    });
  }, [open]);

  const statusOptions = [
    { value: 'NOT_SENT', label: 'Não Enviado' },
    { value: 'SUBMITTED', label: 'Enviado' },
    { value: 'PENDING_ANALYSIS', label: 'Em Análise' },
    { value: 'APPROVED', label: 'Aprovado' },
    { value: 'REJECTED', label: 'Rejeitado' },
  ];

  return (
    <CrudFormShell
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={isEdit ? 'Editar Documento' : 'Novo Documento'}
      data-ai-id="user-document-form"
    >
      {/* User */}
      <div className="space-y-2" data-ai-id="ud-field-user">
        <Label>Usuário *</Label>
        <Select
          value={form.watch('userId')}
          onValueChange={(v) => form.setValue('userId', v, { shouldValidate: true })}
        >
          <SelectTrigger><SelectValue placeholder="Selecione o usuário" /></SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* DocumentType */}
      <div className="space-y-2" data-ai-id="ud-field-doctype">
        <Label>Tipo de Documento *</Label>
        <Select
          value={form.watch('documentTypeId')}
          onValueChange={(v) => form.setValue('documentTypeId', v, { shouldValidate: true })}
        >
          <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
          <SelectContent>
            {docTypes.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <Field label="URL do Arquivo" name="fileUrl" form={form} required data-ai-id="ud-field-fileurl" />
      <Field label="Nome do Arquivo" name="fileName" form={form} data-ai-id="ud-field-filename" />

      <Separator />

      {/* Status */}
      <div className="space-y-2" data-ai-id="ud-field-status">
        <Label>Status</Label>
        <Select
          value={form.watch('status')}
          onValueChange={(v) => form.setValue('status', v as FormValues['status'], { shouldValidate: true })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Field label="Motivo da Rejeição" name="rejectionReason" form={form} data-ai-id="ud-field-rejection" />
    </CrudFormShell>
  );
}
