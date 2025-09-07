// src/app/admin/courts/court-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { courtFormSchema, type CourtFormValues } from './court-form-schema';
import type { Court, StateInfo } from '@/types';
import EntitySelector from '@/components/ui/entity-selector';
import { getStates } from '../states/actions';

interface CourtFormProps {
  initialData?: Court | null;
  states: StateInfo[];
  onSubmitAction: (data: CourtFormValues) => Promise<any>;
}

const CourtForm = React.forwardRef<any, CourtFormProps>(({
  initialData,
  states: initialStates,
  onSubmitAction,
}, ref) => {
  const [states, setStates] = React.useState(initialStates);
  const [isFetchingStates, setIsFetchingStates] = React.useState(false);

  const form = useForm<CourtFormValues>({
    resolver: zodResolver(courtFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      stateUf: initialData?.stateUf || '',
      website: initialData?.website || '',
    },
  });

  React.useEffect(() => {
    form.reset({
      name: initialData?.name || '',
      stateUf: initialData?.stateUf || '',
      website: initialData?.website || '',
    });
  }, [initialData, form]);

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  const handleRefetchStates = React.useCallback(async () => {
    setIsFetchingStates(true);
    const data = await getStates();
    setStates(data);
    setIsFetchingStates(false);
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Tribunal</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Tribunal de Justiça de São Paulo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stateUf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado (UF)</FormLabel>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                options={states.map(s => ({ value: s.uf, label: `${s.name} (${s.uf})` }))}
                placeholder="Selecione o estado"
                searchPlaceholder="Buscar estado..."
                emptyStateMessage="Nenhum estado encontrado."
                createNewUrl="/admin/states/new"
                editUrlPrefix="/admin/states"
                onRefetch={handleRefetchStates}
                isFetching={isFetchingStates}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website (Opcional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://www.tjsp.jus.br" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
});

CourtForm.displayName = "CourtForm";
export default CourtForm;
