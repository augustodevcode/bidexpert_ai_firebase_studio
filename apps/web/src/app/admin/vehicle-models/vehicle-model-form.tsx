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
import { VehicleModel } from '@bidexpert/core'; // Assuming VehicleModel type is exported from core

const vehicleModelFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  slug: z.string().min(2, {
    message: 'Slug must be at least 2 characters.',
  }),
  makeId: z.string().optional(), // This will likely be a selector in a real app
});

type VehicleModelFormValues = z.infer<typeof vehicleModelFormSchema>;

interface VehicleModelFormProps {
  initialData?: VehicleModel | null;
  formRef: React.RefObject<HTMLFormElement>;
  onSubmit: (data: VehicleModelFormValues) => Promise<void>;
}

export function VehicleModelForm({ initialData, formRef, onSubmit }: VehicleModelFormProps) {
  const form = useForm<VehicleModelFormValues>({
    resolver: zodResolver(vehicleModelFormSchema),
    defaultValues: initialData || {
      name: '',
      slug: '',
      makeId: '',
    },
  });

  async function handleSubmit(data: VehicleModelFormValues) {
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
                <Input placeholder="Vehicle Model Name" {...field} />
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
                <Input placeholder="vehicle-model-slug" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="makeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Make ID</FormLabel>
              <FormControl>
                <Input placeholder="Make ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
