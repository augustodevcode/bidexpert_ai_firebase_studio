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
import { JudicialDistrict } from '@bidexpert/core'; // Assuming JudicialDistrict type is exported from core

const judicialDistrictFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  slug: z.string().min(2, {
    message: 'Slug must be at least 2 characters.',
  }),
  courtId: z.string().optional(), // This will likely be a selector in a real app
  stateId: z.string().optional(), // This will likely be a selector in a real app
  zipCode: z.string().optional(),
});

type JudicialDistrictFormValues = z.infer<typeof judicialDistrictFormSchema>;

interface JudicialDistrictFormProps {
  initialData?: JudicialDistrict | null;
  formRef: React.RefObject<HTMLFormElement>;
  onSubmit: (data: JudicialDistrictFormValues) => Promise<void>;
}

export function JudicialDistrictForm({ initialData, formRef, onSubmit }: JudicialDistrictFormProps) {
  const form = useForm<JudicialDistrictFormValues>({
    resolver: zodResolver(judicialDistrictFormSchema),
    defaultValues: initialData || {
      name: '',
      slug: '',
      courtId: '',
      stateId: '',
      zipCode: '',
    },
  });

  async function handleSubmit(data: JudicialDistrictFormValues) {
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
                <Input placeholder="Judicial District Name" {...field} />
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
                <Input placeholder="judicial-district-slug" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="courtId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Court ID</FormLabel>
              <FormControl>
                <Input placeholder="Court ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State ID</FormLabel>
              <FormControl>
                <Input placeholder="State ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="zipCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zip Code</FormLabel>
              <FormControl>
                <Input placeholder="XXXXX-XXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
