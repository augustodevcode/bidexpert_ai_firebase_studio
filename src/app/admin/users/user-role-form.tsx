
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { userRoleFormSchema, type UserRoleFormValues } from './user-role-form-schema';
import type { Role, UserProfileData } from '@/types';
import { Loader2, Save, UserCog, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface UserRoleFormProps {
  user: UserProfileData;
  roles: Role[];
  onSubmitAction: (userId: string, roleIds: string[]) => Promise<{ success: boolean; message: string }>;
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
      roleIds: user?.roleIds || [],
    },
  });

  async function onSubmit(values: UserRoleFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(user.uid, values.roleIds || []);
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
          <UserCog className="h-6 w-6 text-primary" /> Atribuir Perfis para {user.fullName}
        </CardTitle>
        <CardDescription>Email: {user.email}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 bg-secondary/30">
            <FormField
              control={form.control}
              name="roleIds"
              render={() => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Perfis Disponíveis</FormLabel>
                   <div className="space-y-2 mt-2">
                    {roles.map((role) => (
                      <FormField
                        key={role.id}
                        control={form.control}
                        name="roleIds"
                        render={({ field }) => {
                          return (
                            <FormItem key={role.id} className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-background">
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
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium flex items-center gap-2 cursor-pointer">
                                  <Shield className="h-4 w-4 text-muted-foreground"/> {role.name}
                                </FormLabel>
                                <FormDescription className="text-xs">
                                  {role.description}
                                </FormDescription>
                              </div>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
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
              Salvar Perfis
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
