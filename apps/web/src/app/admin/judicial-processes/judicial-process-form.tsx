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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { JudicialProcess } from '@bidexpert/core'; // Assuming JudicialProcess type is exported from core

const judicialProcessFormSchema = z.object({
  publicId: z.string().optional(),
  processNumber: z.string().min(1, { message: 'Process number is required.' }),
  isElectronic: z.boolean().default(true),
  courtId: z.string().optional(), // Selector
  districtId: z.string().optional(), // Selector
  branchId: z.string().optional(), // Selector
  sellerId: z.string().optional(), // Selector
});

type JudicialProcessFormValues = z.infer<typeof judicialProcessFormSchema>;

interface JudicialProcessFormProps {
  initialData?: JudicialProcess | null;
  formRef: React.RefObject<HTMLFormElement>;
  onSubmit: (data: JudicialProcessFormValues) => Promise<void>;
}

export function JudicialProcessForm({ initialData, formRef, onSubmit }: JudicialProcessFormProps) {
  const form = useForm<JudicialProcessFormValues>({
    resolver: zodResolver(judicialProcessFormSchema),
    defaultValues: initialData || {
      publicId: '',
      processNumber: '',
      isElectronic: true,
      courtId: '',
      districtId: '',
      branchId: '',
      sellerId: '',
    },
  });

  async function handleSubmit(data: JudicialProcessFormValues) {
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="publicId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Public ID</FormLabel>
              <FormControl>
                <Input placeholder="Public ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="processNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Process Number</FormLabel>
              <FormControl>
                <Input placeholder="Process Number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isElectronic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Is Electronic</FormLabel>
                <FormDescription>
                  Check if this is an electronic process.
                </FormDescription>
              </div>
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
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch ID</FormLabel>
              <FormControl>
                <Input placeholder="Branch ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sellerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seller ID</FormLabel>
              <FormControl>
                <Input placeholder="Seller ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
