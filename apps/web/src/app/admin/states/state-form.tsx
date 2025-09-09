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
import { toast } from '@/hooks/use-toast';
import { State } from '@bidexpert/core'; // Assuming State type is exported from core

const stateFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  uf: z.string().length(2, { message: 'UF must be 2 characters.' }),
  slug: z.string().min(2, {
    message: 'Slug must be at least 2 characters.',
  }),
});

type StateFormValues = z.infer<typeof stateFormSchema>;

interface StateFormProps {
  initialData?: State | null;
  formRef: React.RefObject<HTMLFormElement>;
  onSubmit: (data: StateFormValues) => Promise<void>;
}

export function StateForm({ initialData, formRef, onSubmit }: StateFormProps) {
  const form = useForm<StateFormValues>({
    resolver: zodResolver(stateFormSchema),
    defaultValues: initialData || {
      name: '',
      uf: '',
      slug: '',
    },
  });

  async function handleSubmit(data: StateFormValues) {
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
                <Input placeholder="State Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="uf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UF</FormLabel>
              <FormControl>
                <Input placeholder="UF" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="state-slug" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
