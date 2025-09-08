// src/components/admin/users/user-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { userFormSchema, type UserFormValues } from '@/app/admin/users/user-form-schema';
import type { UserProfileData, Role } from '@bidexpert/core';
import EntitySelector from '@/components/ui/entity-selector';
import { getRoles } from '@/app/admin/roles/actions';

interface UserFormProps {
  initialData?: UserProfileData | null;
  roles: Role[];
  onSubmitAction: (data: UserFormValues) => Promise<{ success: boolean; message: string; userId?: string }>;
}

const UserForm = React.forwardRef<any, UserFormProps>(({
  initialData, 
  roles: initialRoles,
  onSubmitAction,
}, ref) => {
  const [roles, setRoles] = React.useState(initialRoles);
  const [isFetchingRoles, setIsFetchingRoles] = React.useState(false);
  
  const initialRoleIds = initialData?.roles?.map((r: any) => r.id) || [];

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      password: '',
      roleId: initialRoleIds.length > 0 ? initialRoleIds[0] : null,
    },
  });

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  const handleRefetchRoles = React.useCallback(async () => {
    setIsFetchingRoles(true);
    const data = await getRoles();
    setRoles(data);
    setIsFetchingRoles(false);
  }, []);

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="usuario@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Defina uma senha inicial" {...field} />
                  </FormControl>
                  <FormDescription>
                    Deixe em branco para não alterar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil Principal do Usuário</FormLabel>
                   <EntitySelector
                      value={field.value}
                      onChange={field.onChange}
                      options={roles.map(r => ({ value: r.id, label: r.name }))}
                      placeholder="Selecione o perfil"
                      searchPlaceholder="Buscar perfil..."
                      emptyStateMessage="Nenhum perfil encontrado."
                      createNewUrl="/admin/roles/new"
                      onRefetch={handleRefetchRoles}
                      isFetching={isFetchingRoles}
                    />
                  <FormDescription>
                    Atribua o perfil principal. Perfis adicionais podem ser gerenciados na página de edição do usuário.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </form>
      </Form>
  );
});

UserForm.displayName = 'UserForm';
export default UserForm;
