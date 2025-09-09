// src/app/admin/roles/components/role-form.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Role } from '@bidexpert/core'; // Import the type

// Define the Zod schema for the form
const roleFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

export type RoleFormData = Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'nameNormalized' | 'slug'>>;

interface RoleFormProps {
  initialData: RoleFormData | null;
  onSubmitAction: (data: RoleFormData) => Promise<any>;
}

const RoleForm = React.forwardRef<HTMLFormElement, RoleFormProps>(
  ({ initialData, onSubmitAction }, ref) => {
    const form = useForm<RoleFormData>({
      resolver: zodResolver(roleFormSchema),
      defaultValues: initialData || {
        name: '',
        description: '',
        permissions: [],
      },
    });

    const handleSubmit = async (data: RoleFormData) => {
      await onSubmitAction(data);
    };

    React.useImperativeHandle(ref, () => ({
      requestSubmit: () => form.handleSubmit(handleSubmit)(),
    }));

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8" ref={ref}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da Função" {...field} />
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
                  <Textarea placeholder="Descrição da Função" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Add permissions field if needed */}
        </form>
      </Form>
    );
  }
);

RoleForm.displayName = 'RoleForm';

export default RoleForm;
