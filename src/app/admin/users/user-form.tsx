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
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function UserForm({
  initialData, 
  roles,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: UserFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Remapeia a estrutura de roles do usuário inicial para um array de IDs
  const initialRoleIds = initialData?.roles?.map(r => r.role.id) || [];

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      password: '', // Senha sempre vazia no formulário de admin por segurança
      roleId: initialRoleIds.length > 0 ? initialRoleIds[0] : null, // Apenas para compatibilidade
    },
  });

  async function onSubmit(values: UserFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
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
      console.error("Unexpected error in user form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserPlus className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 bg-secondary/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="usuario@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Senha (Opcional)</FormLabel><FormControl><Input type="password" placeholder="Defina uma senha inicial" {...field} /></FormControl><FormDescription>Deixe em branco para não alterar.</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="roleId" render={({ field }) => (<FormItem><FormLabel>Perfil Principal do Usuário</FormLabel><Select onValueChange={(value) => field.onChange(value === "---NONE---" ? null : value)} value={field.value || "---NONE---"}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um perfil" /></SelectTrigger></FormControl><SelectContent><SelectItem value="---NONE---">Nenhum Perfil</SelectItem>{roles.map((role) => (<SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>))}</SelectContent></Select><FormDescription>Atribua o perfil principal. Perfis adicionais podem ser gerenciados na página de edição do usuário.</FormDescription><FormMessage /></FormItem>)} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/users')} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{submitButtonText}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
