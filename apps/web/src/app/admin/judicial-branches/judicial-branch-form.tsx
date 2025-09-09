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
import { JudicialBranch } from '@bidexpert/core'; // Assuming JudicialBranch type is exported from core

const judicialBranchFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  districtId: z.string().optional(), // This will likely be a selector in a real app
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
});

type JudicialBranchFormValues = z.infer<typeof judicialBranchFormSchema>;

interface JudicialBranchFormProps {
  initialData?: JudicialBranch | null;
  formRef: React.RefObject<HTMLFormElement>;
  onSubmit: (data: JudicialBranchFormValues) => Promise<void>;
}

export function JudicialBranchForm({ initialData, formRef, onSubmit }: JudicialBranchFormProps) {
  const form = useForm<JudicialBranchFormValues>({
    resolver: zodResolver(judicialBranchFormSchema),
    defaultValues: initialData || {
      name: '',
      districtId: '',
      contactName: '',
      email: '',
      phone: '',
    },
  });

  async function handleSubmit(data: JudicialBranchFormValues) {
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
                <Input placeholder="Judicial Branch Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="districtId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District ID</FormLabel>
              <FormControl>
                <Input placeholder="District ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name</FormLabel>
              <FormControl>
                <Input placeholder="Contact Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="(XX) XXXXX-XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
