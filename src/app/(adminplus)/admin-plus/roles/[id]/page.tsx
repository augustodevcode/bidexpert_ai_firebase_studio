/**
 * @fileoverview Página de edição de Role no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ADMIN_PLUS_BASE_PATH } from '@/lib/admin-plus/constants';
import { createRoleSchema, type CreateRoleInput } from '../schema';
import { getRoleByIdAction, updateRoleAction } from '../actions';

export default function EditRolePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const form = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '', permissions: '' },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await getRoleByIdAction({ id });
    if (result.success && result.data) {
      const role = result.data;
      form.reset({
        name: role.name,
        description: role.description ?? '',
        permissions: role.permissions ? JSON.stringify(role.permissions, null, 2) : '',
      });
    } else {
      toast.error(result.error ?? 'Perfil não encontrado');
      router.push(`${ADMIN_PLUS_BASE_PATH}/roles`);
    }
    setLoading(false);
  }, [id, form, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const onSubmit = async (values: CreateRoleInput) => {
    const result = await updateRoleAction({ id, data: values });
    if (result.success) {
      toast.success('Perfil atualizado com sucesso');
      router.push(`${ADMIN_PLUS_BASE_PATH}/roles`);
    } else {
      toast.error(result.error ?? 'Erro ao atualizar');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-ai-id="role-edit-skeleton">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ai-id="role-edit-page">
      <PageHeader title="Editar Perfil" description="Altere os dados do perfil de acesso." />
      <CrudFormShell form={form} onSubmit={onSubmit} onCancel={() => router.push(`${ADMIN_PLUS_BASE_PATH}/roles`)}>
        <Field control={form.control} name="name" label="Nome" required>
          {({ field }) => <Input {...field} value={String(field.value ?? '')} placeholder="Ex: Administrador" data-ai-id="role-name-input" />}
        </Field>
        <Field control={form.control} name="description" label="Descrição">
          {({ field }) => <Textarea {...field} value={String(field.value ?? '')} rows={3} placeholder="Descrição do perfil" data-ai-id="role-description-input" />}
        </Field>
        <Field control={form.control} name="permissions" label="Permissões (JSON)" hint='Array JSON de permissões. Ex: ["users:read","users:write"]'>
          {({ field }) => (
            <Textarea {...field} value={String(field.value ?? '')} rows={6} className="font-mono text-sm" placeholder='["users:read", "users:write"]' data-ai-id="role-permissions-input" />
          )}
        </Field>
      </CrudFormShell>
    </div>
  );
}
