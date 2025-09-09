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
import { VehicleMake } from '@bidexpert/core'; // Assuming VehicleMake type is exported from core

const vehicleMakeFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  slug: z.string().min(2, {
    message: 'Slug must be at least 2 characters.',
  }),
});

type VehicleMakeFormValues = z.infer<typeof vehicleMakeFormSchema>;

interface VehicleMakeFormProps {
  initialData?: VehicleMake | null;
  formRef: React.RefObject<HTMLFormElement>;
  onSubmit: (data: VehicleMakeFormValues) => Promise<void>;
}

export function VehicleMakeForm({ initialData, formRef, onSubmit }: VehicleMakeFormProps) {
  const form = useForm<VehicleMakeFormValues>({
    resolver: zodResolver(vehicleMakeFormSchema),
    defaultValues: initialData || {
      name: '',
      slug: '',
    },
  });

  async function handleSubmit(data: VehicleMakeFormValues) {
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
                <Input placeholder="Vehicle Make Name" {...field} />
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
                <Input placeholder="vehicle-make-slug" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
