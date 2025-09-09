// src/app/admin/judicial-districts/components/judicial-district-form.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { JudicialDistrict } from '@bidexpert/core'; // Import the type

// Define the Zod schema for the form
const judicialDistrictFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  courtId: z.string().min(1, "Tribunal é obrigatório."),
  stateId: z.string().min(1, "Estado é obrigatório."),
  zipCode: z.string().optional(),
});

export type JudicialDistrictFormData = Partial<Omit<JudicialDistrict, 'id' | 'createdAt' | 'updatedAt'>>;

interface JudicialDistrictFormProps {
  initialData: JudicialDistrictFormData | null;
  onSubmitAction: (data: JudicialDistrictFormData) => Promise<any>;
}

const JudicialDistrictForm = React.forwardRef<HTMLFormElement, JudicialDistrictFormProps>(
  ({ initialData, onSubmitAction }, ref) => {
    const form = useForm<JudicialDistrictFormData>({
      resolver: zodResolver(judicialDistrictFormSchema),
      defaultValues: initialData || {
        name: '',
        courtId: '',
        stateId: '',
        zipCode: '',
      },
    });

    const handleSubmit = async (data: JudicialDistrictFormData) => {
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
                  <Input placeholder="Nome da Comarca" {...field} />
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
                <FormLabel>Tribunal</FormLabel>
                <FormControl>
                  <Input placeholder="ID do Tribunal" {...field} />
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
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input placeholder="ID do Estado" {...field} />
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
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input placeholder="CEP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Add other fields as necessary based on JudicialDistrict */}
        </form>
      </Form>
    );
  }
);

JudicialDistrictForm.displayName = 'JudicialDistrictForm';

export default JudicialDistrictForm;
