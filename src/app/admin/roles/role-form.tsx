// src/app/admin/roles/role-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar
 * Perfis de Usuário (Roles). Utiliza react-hook-form e Zod para validação
 * e exibe uma lista de permissões agrupadas.
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
import { roleFormSchema, type RoleFormValues, predefinedPermissions } from './role-form-schema';
import type { Role } from '@/types';
import { Loader2, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RoleFormProps {
  initialData?: Role | null;
  onSubmitAction: (data: RoleFormValues) => Promise<{ success: boolean; message: string; roleId?: string }>;
  formTitle?: string;
  formDescription?: string;
  submitButtonText: string;
  onSuccess?: () => void;
}

const groupedPermissions = predefinedPermissions.reduce((acc, permission) => {
  const group = permission.group || 'Outras';
  if (!acc[group]) {
    acc[group] = [];
  }
  acc[group].push(permission);
  return acc;
}, {} as Record<string, typeof predefinedPermissions>);

export function RoleForm({
  initialData,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
  onSuccess
}: RoleFormProps) {
  const [isPending, setIsPending] = React.useState(false);
  const { toast } = useToast();

  const isProtectedRole = initialData && ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTION_ANALYST', 'BIDDER', 'TENANT_ADMIN'].includes(initialData.nameNormalized);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      permissions: initialData?.permissions && Array.isArray(initialData.permissions)
          ? initialData.permissions
          : [],
    },
  });

  async function onSubmit(values: RoleFormValues) {
    setIsPending(true);
    try {
      if (isProtectedRole) {
          toast({
              title: "Ação não Permitida",
              description: "O nome e descrição de perfis de sistema (como ADMINISTRADOR) não podem ser alterados, apenas as permissões.",
              variant: "destructive"
          });
      }

      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        if (onSuccess) {
            onSuccess();
        }
      } else {
        toast({
          title: 'Erro ao Salvar',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
       console.error("Erro inesperado no onSubmit do RoleForm:", error);
       toast({
         title: 'Erro de Sistema',
         description: 'Ocorreu um erro inesperado ao salvar o perfil.',
         variant: 'destructive',
       });
    } finally {
      setIsPending(false);
    }
  }

  const toggleAllInGroup = (groupName: string, checked: boolean) => {
    const currentPermissions = form.getValues('permissions') || [];
    const groupPermissionsIds = groupedPermissions[groupName].map(p => p.id);
    let newPermissions = [...currentPermissions];

    if (checked) {
      newPermissions = Array.from(new Set([...newPermissions, ...groupPermissionsIds]));
    } else {
      newPermissions = newPermissions.filter(id => !groupPermissionsIds.includes(id));
    }
    form.setValue('permissions', newPermissions, { shouldDirty: true, shouldValidate: true });
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {formTitle && <h3 className="text-lg font-medium">{formTitle}</h3>}
        {formDescription && <p className="text-sm text-muted-foreground">{formDescription}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
          <div className="space-y-4">
               {isProtectedRole && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-md">
                      <p className="text-sm text-amber-800 font-medium">
                          Este é um perfil de sistema. Você só pode alterar as permissões.
                      </p>
                  </div>
              )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Perfil <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Analista de Leilão" {...field} disabled={isPending || !!isProtectedRole} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva brevemente as responsabilidades deste perfil..."
                      className="resize-none h-24"
                      {...field}
                      disabled={isPending || !!isProtectedRole}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-base font-semibold">Permissões do Perfil</FormLabel>
                <div className="flex items-center space-x-2">
                      <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue('permissions', predefinedPermissions.map(p => p.id), { shouldDirty: true, shouldValidate: true })}
                          disabled={isPending}
                      >
                          Selecionar Todas
                      </Button>
                      <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => form.setValue('permissions', [], { shouldDirty: true, shouldValidate: true })}
                           disabled={isPending}
                      >
                          Limpar
                      </Button>
                </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-md p-4 bg-muted/20">
              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem>
                      <FormMessage className="mb-4" />
                      <div className="space-y-8">
                      {Object.entries(groupedPermissions).map(([groupName, permissionsInGroup]) => {
                          const currentSelected = form.watch('permissions') || [];
                          const groupIds = permissionsInGroup.map(p => p.id);
                          const isAllSelectedInGroup = groupIds.every(id => currentSelected.includes(id));
                          const isSomeSelectedInGroup = groupIds.some(id => currentSelected.includes(id));

                          return (
                              <div key={groupName} className="space-y-3">
                                  <div className="flex items-center space-x-2 pb-2 mb-2 border-b">
                                      <Checkbox
                                          id={\group-\\}
                                          checked={isAllSelectedInGroup ? true : isSomeSelectedInGroup ? "indeterminate" : false}
                                          onCheckedChange={(checked) => toggleAllInGroup(groupName, !!checked)}
                                          disabled={isPending}
                                      />
                                      <label
                                          htmlFor={\group-\\}
                                          className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-primary"
                                      >
                                          {groupName}
                                      </label>
                                       <Badge variant="secondary" className="ml-auto text-xs">
                                          {groupIds.filter(id => currentSelected.includes(id)).length} / {groupIds.length}
                                      </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                                      {permissionsInGroup.map((item) => (
                                          <FormField
                                              key={item.id}
                                              control={form.control}
                                              name="permissions"
                                              render={({ field }) => {
                                                  return (
                                                      <FormItem
                                                          key={item.id}
                                                          className="flex flex-row items-start space-x-3 space-y-0"
                                                      >
                                                          <FormControl>
                                                              <Checkbox
                                                                  checked={field.value?.includes(item.id)}
                                                                  onCheckedChange={(checked) => {
                                                                      let newValue = field.value ? [...field.value] : [];
                                                                      if (checked) {
                                                                          newValue.push(item.id);
                                                                      } else {
                                                                          newValue = newValue.filter(
                                                                              (val) => val !== item.id
                                                                          );
                                                                      }
                                                                      field.onChange(newValue);
                                                                  }}
                                                                  disabled={isPending}
                                                              />
                                                          </FormControl>
                                                          <div className="space-y-1 leading-none">
                                                              <FormLabel className="font-normal cursor-pointer">
                                                                  {item.label}
                                                              </FormLabel>
                                                              <FormDescription className="text-xs">
                                                                  {item.description}
                                                              </FormDescription>
                                                          </div>
                                                      </FormItem>
                                                  )
                                              }}
                                          />
                                      ))}
                                  </div>
                              </div>
                          );
                      })}
                      </div>
                  </FormItem>
                )}
              />
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onSuccess && onSuccess()} disabled={isPending} className="mr-2">
                Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[150px]">
            {isPending ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
                </>
            ) : (
                <>
                <Save className="mr-2 h-4 w-4" />
                {submitButtonText}
                </>
            )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
