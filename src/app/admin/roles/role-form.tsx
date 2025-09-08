// src/app/admin/roles/role-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
import type { Role } from '@/types';
import { roleFormSchema, type RoleFormValues, predefinedPermissions } from './role-form-schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface RoleFormProps {
  initialData?: Role | null;
  onSubmitAction: (data: RoleFormValues) => Promise<any>;
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


const RoleForm = React.forwardRef<any, RoleFormProps>(({
  initialData,
  onSubmitAction,
}, ref) => {

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      permissions: initialData?.permissions || [],
    },
  });

  React.useEffect(() => {
    form.reset({
      name: initialData?.name || '',
      description: initialData?.description || '',
      permissions: initialData?.permissions || [],
    });
  }, [initialData, form]);

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
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
                  <Accordion type="multiple" className="w-full bg-background p-2 rounded-md border" defaultValue={Object.keys(groupedPermissions)}>
                    {Object.entries(groupedPermissions).map(([groupName, permissions]) => (
                      <AccordionItem value={groupName} key={groupName}>
                        <AccordionTrigger className="text-sm font-medium">{groupName}</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 p-2 max-h-80 overflow-y-auto">
                            {permissions.map((permission) => (
                              <FormItem key={permission.id} className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(permission.id)}
                                    onCheckedChange={(checked) => {
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
        </form>
      </Form>
  );
});

RoleForm.displayName = 'RoleForm';
export default RoleForm;
