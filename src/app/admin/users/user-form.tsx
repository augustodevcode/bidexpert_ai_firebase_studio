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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { userFormSchema, type UserFormValues } from './user-form-schema';
import type { UserProfileData, Role } from '@/types';
import { Loader2, Save, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface UserFormProps {
  initialData?: UserProfileData | null;
  roles: Role[];
  onSubmitAction: (data: UserFormValues) => Promise<{ success: boolean; message: string; userId?: string }>;
  formTitle?: string;
  formDescription?: string;
  submitButtonText?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function UserForm({
  initialData, 
  roles,
  onSubmitAction,
  formTitle = initialData ? 'Editar Usuário' : 'Novo Usuário',
  formDescription = initialData ? 'Atualize os dados do usuário.' : 'Cadastre um novo usuário na plataforma.',
  submitButtonText = initialData ? 'Salvar Alterações' : 'Criar Usuário',
  onSuccess,
  onCancel,
}: UserFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const initialRoleIds = initialData?.roles?.map(r => r.role.id) || [];

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      password: '',
      roleIds: initialRoleIds, 
    },
  });

  async function onSubmit(values: UserFormValues) {
    setIsSubmitting(true);
    try {
      const dataToSubmit = { ...values };
      
      const result = await onSubmitAction(dataToSubmit);

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/admin/users');
          router.refresh();
        }
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
      console.error("Unexpected error in user form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg" data-ai-id="admin-user-form-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserPlus className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 bg-secondary/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Nome Completo<span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email<span className="text-destructive">*</span></FormLabel><FormControl><Input type="email" placeholder="usuario@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Senha (Opcional)</FormLabel><FormControl><Input type="password" placeholder="Defina uma senha inicial" {...field} /></FormControl><FormDescription>Deixe em branco para não alterar.</FormDescription><FormMessage /></FormItem>)} />
              <FormField
                control={form.control}
                name="roleIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Perfis do Usuário</FormLabel>
                    <div className="space-y-2 rounded-md border p-2">
                    {roles.map((role) => (
                      <FormField
                        key={role.id}
                        control={form.control}
                        name="roleIds"
                        render={({ field }) => {
                          return (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), role.id])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== role.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer text-sm">{role.name}</FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    </div>
                    <FormDescription>Atribua um ou mais perfis ao usuário.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={() => onCancel ? onCancel() : router.push('/admin/users')} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {submitButtonText}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
