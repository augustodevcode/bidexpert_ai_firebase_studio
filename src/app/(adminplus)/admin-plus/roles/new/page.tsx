/**
 * @fileoverview Página de criação de Role no Admin Plus.
 */
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ADMIN_PLUS_BASE_PATH } from '@/lib/admin-plus/constants';
import { createRoleSchema, type CreateRoleInput } from './schema';
import { createRoleAction } from './actions';

export default function NewRolePage() {
  const router = useRouter();
  const form = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '', permissions: '' },
  });

  const onSubmit = async (values: CreateRoleInput) => {
    const result = await createRoleAction(values);
    if (result.success) {
      toast.success('Perfil criado com sucesso');
      router.push(`${ADMIN_PLUS_BASE_PATH}/roles`);
    } else {
      toast.error(result.error ?? 'Erro ao criar');
    }
  };

  return (
    <div className="space-y-6" data-ai-id="role-new-page">
      <PageHeader heading="Novo Perfil" description="Cadastre um novo perfil de acesso." />
      <CrudFormShell form={form} onSubmit={onSubmit} cancelHref={`${ADMIN_PLUS_BASE_PATH}/roles`}>
        <Field control={form.control} name="name" label="Nome" required>
          {(field) => <Input {...field} placeholder="Ex: Administrador" data-ai-id="role-name-input" />}
        </Field>
        <Field control={form.control} name="description" label="Descrição">
          {(field) => <Textarea {...field} rows={3} placeholder="Descrição do perfil" data-ai-id="role-description-input" />}
        </Field>
        <Field control={form.control} name="permissions" label="Permissões (JSON)" hint='Array JSON de permissões. Ex: ["users:read","users:write"]'>
          {(field) => (
            <Textarea {...field} rows={6} className="font-mono text-sm" placeholder='["users:read", "users:write"]' data-ai-id="role-permissions-input" />
          )}
        </Field>
      </CrudFormShell>
    </div>
  );
}
