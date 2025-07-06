
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { userRoleFormSchema, type UserRoleFormValues } from './user-role-form-schema';
import type { Role, UserProfileData } from '@/types';
import { Loader2, Save, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface UserRoleFormProps {
  user: UserProfileData;
  roles: Role[];
  onSubmitAction: (userId: string, roleId: string | null) => Promise<{ success: boolean; message: string }>;
}

export default function UserRoleForm({
  user,
  roles,
  onSubmitAction,
}: UserRoleFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UserRoleFormValues>({
    resolver: zodResolver(userRoleFormSchema),
    defaultValues: {
      roleId: user?.roleId || null, // Handle case where roleId might be undefined or null
    },
  });

  async function onSubmit(values: UserRoleFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(user.uid, values.roleId || null);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        router.push('/admin/users');
        router.refresh();
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
      console.error("Unexpected error in user role form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" /> Atribuir Perfil para {user.fullName}
        </CardTitle>
        <CardDescription>Email: {user.email}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 bg-secondary/30">
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil do Usuário</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "---NONE---" ? null : value)} 
                    value={field.value || undefined} // Ensure undefined for placeholder
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="---NONE---">Nenhum (Remover Perfil)</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/users')} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Perfil
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
