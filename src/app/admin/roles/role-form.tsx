// src/app/admin/roles/role-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar
 * Perfis de Usuário (Roles). Utiliza `react-hook-form` e Zod para validação
 * e exibe uma lista de permissões agrupadas, permitindo uma configuração
 * granular e intuitiva dos direitos de acesso para cada perfil.
 */
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { roleFormSchema, type RoleFormValues, predefinedPermissions } from './role-form-schema';
import type { Role } from '@/types';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface RoleFormProps {
  initialData?: Role | null;
  onSubmitAction: (data: RoleFormValues) => Promise<{ success: boolean; message: string; roleId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

// Group permissions by their group property
const groupedPermissions = predefinedPermissions.reduce((acc, permission) => {
  const group = permission.group || 'Outras';
  if (!acc[group]) {
    acc[group] = [];
  }
  acc[group].push(permission);
  return acc;
}, {} as Record<string, typeof predefinedPermissions>);


export default function RoleForm({
  initialData,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: RoleFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      permissions: initialData?.permissions || [],
    },
  });

  // Check if the role has manage_all permission (super admin)
  const hasManageAll = form.watch('permissions')?.includes('manage_all') || initialData?.permissions?.includes('manage_all');

  // Get effective permissions - if has manage_all, consider all permissions as selected
  const getEffectivePermissions = (): string[] => {
    const currentPermissions = form.watch('permissions') || [];
    if (hasManageAll) {
      return predefinedPermissions.map(p => p.id);
    }
    return currentPermissions;
  };

  async function onSubmit(values: RoleFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        router.push('/admin/roles');
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
      console.error("Unexpected error in role form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg" data-ai-id="role-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> {formTitle}
        </CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 bg-secondary/30">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Perfil</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Administrador, Comitente, Usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Uma breve descrição sobre este perfil de usuário."
                      {...field}
                      value={field.value ?? ""}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Permissões</FormLabel>
                  <FormDescription>
                    Selecione as permissões que este perfil terá.
                  </FormDescription>
                  <Accordion type="multiple" className="w-full bg-background p-2 rounded-md border">
                    {Object.entries(groupedPermissions).map(([groupName, permissions]) => (
                      <AccordionItem value={groupName} key={groupName}>
                        <AccordionTrigger className="text-sm font-medium">{groupName}</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 p-2 max-h-80 overflow-y-auto">
                            {permissions.map((permission) => (
                              <FormItem key={permission.id} className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={
                                      hasManageAll || 
                                      field.value?.includes(permission.id) ||
                                      getEffectivePermissions().includes(permission.id)
                                    }
                                    disabled={hasManageAll && permission.id !== 'manage_all'}
                                    onCheckedChange={(checked) => {
                                      // Special handling for manage_all
                                      if (permission.id === 'manage_all') {
                                        if (checked) {
                                          // When selecting manage_all, only keep manage_all
                                          field.onChange(['manage_all']);
                                        } else {
                                          // When deselecting manage_all, remove it
                                          field.onChange(
                                            (field.value || []).filter(value => value !== 'manage_all')
                                          );
                                        }
                                        return;
                                      }

                                      // Regular permission handling
                                      if (hasManageAll) return; // Don't allow changes if manage_all is selected
                                      
                                      return checked
                                        ? field.onChange([...(field.value || []), permission.id])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== permission.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-xs font-normal cursor-pointer">
                                  {permission.label}
                                  {hasManageAll && permission.id !== 'manage_all' && (
                                    <span className="text-muted-foreground ml-1">(via Acesso Total)</span>
                                  )}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/roles')} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {submitButtonText}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
