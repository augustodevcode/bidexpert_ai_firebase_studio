/**
 * @fileoverview Formulário Dialog para criar associação UserOnTenant — Admin Plus.
 */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CrudFormShell } from '@/components/admin-plus/crud-form-shell';
import { Field } from '@/components/admin-plus/field';
import { userOnTenantSchema, type UserOnTenantInput } from './schema';
import { createUserOnTenant } from './actions';
import { listUsers } from '../users/actions';
import { listTenants } from '../tenants/actions';

interface UserOnTenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserOnTenantForm({ open, onOpenChange, onSuccess }: UserOnTenantFormProps) {
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<UserOnTenantInput>({
    resolver: zodResolver(userOnTenantSchema),
    defaultValues: { userId: '', tenantId: '', assignedBy: '' },
  });

  useEffect(() => {
    if (!open) return;
    listUsers({ page: 1, pageSize: 500 }).then((res) => {
      if (res?.success && res.data?.data) {
        setUsers(res.data.data.map((u: any) => ({ id: u.id, name: u.name ?? '', email: u.email ?? '' })));
      }
    });
    listTenants({ page: 1, pageSize: 500 }).then((res) => {
      if (res?.success && res.data?.data) {
        setTenants(res.data.data.map((t: any) => ({ id: t.id, name: t.name ?? '' })));
      }
    });
  }, [open]);

  const onSubmit = async (data: UserOnTenantInput) => {
    const res = await createUserOnTenant(data);
    if (res?.success) {
      toast.success('Associação criada com sucesso');
      form.reset();
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(res?.error ?? 'Erro ao criar associação');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ai-id="user-on-tenant-form-dialog">
        <DialogHeader>
          <DialogTitle>Associar Usuário ao Tenant</DialogTitle>
        </DialogHeader>
        <CrudFormShell form={form} onSubmit={onSubmit} submitLabel="Associar">
          <Field label="Usuário" required error={form.formState.errors.userId?.message}>
            <Select
              value={form.watch('userId')}
              onValueChange={(v) => form.setValue('userId', v, { shouldValidate: true })}
            >
              <SelectTrigger data-ai-id="user-on-tenant-user-select">
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
          </Field>

          <Field label="Tenant" required error={form.formState.errors.tenantId?.message}>
            <Select
              value={form.watch('tenantId')}
              onValueChange={(v) => form.setValue('tenantId', v, { shouldValidate: true })}
            >
              <SelectTrigger data-ai-id="user-on-tenant-tenant-select">
                <SelectValue placeholder="Selecione um tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Atribuído por" error={form.formState.errors.assignedBy?.message}>
            <input
              {...form.register('assignedBy')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              placeholder="Nome ou ID de quem atribuiu"
              data-ai-id="user-on-tenant-assigned-by-input"
            />
          </Field>
        </CrudFormShell>
      </DialogContent>
    </Dialog>
  );
}
