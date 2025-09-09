// src/app/admin/states/components/state-form.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { StateInfo } from '@bidexpert/core'; // Import the type

// Define the Zod schema for the form
const stateFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  uf: z.string().length(2, "UF deve ter 2 caracteres."),
});

export type StateFormData = Partial<Omit<StateInfo, 'id' | 'createdAt' | 'updatedAt' | 'slug'>>;

interface StateFormProps {
  initialData: StateFormData | null;
  onSubmitAction: (data: StateFormData) => Promise<any>;
}

const StateForm = React.forwardRef<HTMLFormElement, StateFormProps>(
  ({ initialData, onSubmitAction }, ref) => {
    const form = useForm<StateFormData>({
      resolver: zodResolver(stateFormSchema),
      defaultValues: initialData || {
        name: '',
        uf: '',
      },
    });

    const handleSubmit = async (data: StateFormData) => {
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
                  <Input placeholder="Nome do Estado" {...field} />
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
                  <Input placeholder="UF (Ex: SP)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  }
);

StateForm.displayName = 'StateForm';

export default StateForm;
