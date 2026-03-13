/**
 * @fileoverview Formulário Dialog para criar associação UsersOnRoles — Admin Plus.
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
import { usersOnRolesSchema, type UsersOnRolesInput } from './schema';
import { createUsersOnRoles } from './actions';
import { listUsers } from '../users/actions';
import { listRoles } from '../roles/actions';

interface UsersOnRolesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UsersOnRolesForm({ open, onOpenChange, onSuccess }: UsersOnRolesFormProps) {
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<UsersOnRolesInput>({
    resolver: zodResolver(usersOnRolesSchema),
    defaultValues: { userId: '', roleId: '', assignedBy: '' },
  });

  useEffect(() => {
    if (!open) return;
    listUsers({ page: 1, pageSize: 500 }).then((res) => {
      if (res?.success && res.data?.data) {
        setUsers(res.data.data.map((u: any) => ({ id: u.id, name: u.name ?? '', email: u.email ?? '' })));
      }
    });
    listRoles({ page: 1, pageSize: 500 }).then((res) => {
      if (res?.success && res.data?.data) {
        setRoles(res.data.data.map((r: any) => ({ id: r.id, name: r.name ?? '' })));
      }
    });
  }, [open]);

  const onSubmit = async (data: UsersOnRolesInput) => {
    const res = await createUsersOnRoles(data);
    if (res?.success) {
      toast.success('Perfil atribuído com sucesso');
      form.reset();
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(res?.error ?? 'Erro ao atribuir perfil');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ai-id="users-on-roles-form-dialog">
        <DialogHeader>
          <DialogTitle>Atribuir Perfil ao Usuário</DialogTitle>
        </DialogHeader>
        <CrudFormShell form={form} onSubmit={onSubmit} submitLabel="Atribuir">
          <Field label="Usuário" required error={form.formState.errors.userId?.message}>
            <Select
              value={form.watch('userId')}
              onValueChange={(v) => form.setValue('userId', v, { shouldValidate: true })}
            >
              <SelectTrigger data-ai-id="users-on-roles-user-select">
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

          <Field label="Perfil" required error={form.formState.errors.roleId?.message}>
            <Select
              value={form.watch('roleId')}
              onValueChange={(v) => form.setValue('roleId', v, { shouldValidate: true })}
            >
              <SelectTrigger data-ai-id="users-on-roles-role-select">
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
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
              data-ai-id="users-on-roles-assigned-by-input"
            />
          </Field>
        </CrudFormShell>
      </DialogContent>
    </Dialog>
  );
}
