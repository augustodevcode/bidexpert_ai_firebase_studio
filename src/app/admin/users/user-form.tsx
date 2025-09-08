// src/app/admin/users/user-form.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { userFormSchema, type UserFormValues } from './user-form-schema';
import type { UserProfileData, Role } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';


interface UserFormProps {
  initialData?: UserProfileData | null;
  roles: Role[];
  onSubmitAction: (data: UserFormValues) => Promise<{ success: boolean; message: string; userId?: string }>;
}

const UserForm = React.forwardRef<any, UserFormProps>(({
  initialData, 
  roles,
  onSubmitAction,
}, ref) => {

  // Remapeia a estrutura de roles do usuário inicial para um array de IDs
  const initialRoleIds = initialData?.roles?.map((r: any) => r.role.id) || [];

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      password: '', // Senha sempre vazia no formulário de admin por segurança
      roleId: initialRoleIds.length > 0 ? initialRoleIds[0] : null, // Apenas para compatibilidade
    },
  });

  // Expor o método de submit do formulário via ref para o FormPageLayout
  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

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
                    Se deixado em branco, o usuário pode precisar redefinir a senha no primeiro login ou um email será enviado.
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
                   <Select
                    onValueChange={(value) => field.onChange(value === "---NONE---" ? null : value)}
                    value={field.value || "---NONE---"}
                   >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="---NONE---">Nenhum Perfil</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

