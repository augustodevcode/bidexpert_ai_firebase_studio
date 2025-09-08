// src/components/admin/states/state-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { stateFormSchema } from '@/app/admin/states/state-form-schema';
import type { StateFormValues, StateInfo } from '@bidexpert/core';

interface StateFormProps {
  initialData?: StateInfo | null;
  onSubmitAction: (data: StateFormValues) => Promise<any>;
}

const StateForm = React.forwardRef<any, StateFormProps>(({ initialData, onSubmitAction }, ref) => {
  const form = useForm<StateFormValues>({
    resolver: zodResolver(stateFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      uf: initialData?.uf || '',
      // cityCount não é editável aqui
    },
  });
  
  React.useEffect(() => {
    form.reset({
      name: initialData?.name || '',
      uf: initialData?.uf || '',
    });
  }, [initialData, form]);

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Estado</FormLabel>
              <FormControl>
                <Input placeholder="Ex: São Paulo, Bahia" {...field} />
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
              <FormLabel>UF (Sigla)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: SP, BA" {...field} maxLength={2} style={{ textTransform: 'uppercase' }} />
              </FormControl>
              <FormDescription>Sigla do estado com 2 letras maiúsculas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
});
StateForm.displayName = "StateForm";
export default StateForm;
