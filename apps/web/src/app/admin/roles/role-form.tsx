'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Role } from '@bidexpert/core'; // Assuming Role type is exported from core

const roleFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  nameNormalized: z.string().min(2, {
    message: 'Normalized name must be at least 2 characters.',
  }),
  description: z.string().optional(),
  permissions: z.string().optional(), // This should be a JSON object, but using string for simplicity
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  initialData?: Role | null;
  formRef: React.RefObject<HTMLFormElement>;
  onSubmit: (data: RoleFormValues) => Promise<void>;
}

export function RoleForm({ initialData, formRef, onSubmit }: RoleFormProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: initialData || {
      name: '',
      nameNormalized: '',
      description: '',
      permissions: '',
    },
  });

  async function handleSubmit(data: RoleFormValues) {
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Role Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nameNormalized"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Normalized Name</FormLabel>
              <FormControl>
                <Input placeholder="role-name" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description of the role" {...field} />
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
              <FormLabel>Permissions (JSON)</FormLabel>
              <FormControl>
                <Textarea placeholder="{}" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
