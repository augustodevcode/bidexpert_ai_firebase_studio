
// src/app/admin/users/user-role-form.tsx
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Import RadioGroup
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import type { Role, UserProfileData } from '@/types';
import { Loader2, Save, UserCog, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

// Schema for a single role selection
const userRoleFormSchema = z.object({
  roleId: z.string().optional().nullable(), // Can be null if no role is assigned
});

type UserRoleFormValues = z.infer<typeof userRoleFormSchema>;

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
      roleId: user?.roleId || null,
    },
  });

  async function onSubmit(values: UserRoleFormValues) {
    setIsSubmitting(true);
    try {
      // The action expects an array, so we wrap the single roleId in an array
      const roleIds = values.roleId ? [values.roleId] : [];
      const result = await onSubmitAction(user.uid, roleIds);
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
          <CardContent className="p-6 bg-secondary/30">
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Perfil de Usuário</FormLabel>
                   <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      className="space-y-2 mt-2"
                    >
                      {roles.map((role) => (
                        <FormItem key={role.id} className="flex items-center space-x-3 space-y-0 rounded-md border p-3 bg-background">
                            <FormControl>
                                <RadioGroupItem value={role.id} />
                            </FormControl>
                            <FormLabel className="font-medium flex items-center gap-2 cursor-pointer w-full">
                                <Shield className="h-4 w-4 text-muted-foreground"/> 
                                <div>
                                    {role.name}
                                    <p className="text-xs text-muted-foreground font-normal">{role.description}</p>
                                </div>
                            </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
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
