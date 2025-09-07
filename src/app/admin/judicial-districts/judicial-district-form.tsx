// src/app/admin/judicial-districts/judicial-district-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { judicialDistrictFormSchema, type JudicialDistrictFormValues } from './judicial-district-form-schema';
import type { JudicialDistrict, Court, StateInfo } from '@/types';
import EntitySelector from '@/components/ui/entity-selector';
import { getCourts } from '../courts/actions';
import { getStates } from '../states/actions';

interface JudicialDistrictFormProps {
  initialData?: JudicialDistrict | null;
  courts: Court[];
  states: StateInfo[];
  onSubmitAction: (data: JudicialDistrictFormValues) => Promise<any>;
}

const JudicialDistrictForm = React.forwardRef<any, JudicialDistrictFormProps>(({
  initialData,
  courts: initialCourts,
  states: initialStates,
  onSubmitAction,
}, ref) => {
  const [courts, setCourts] = React.useState(initialCourts);
  const [states, setStates] = React.useState(initialStates);
  const [isFetchingCourts, setIsFetchingCourts] = React.useState(false);
  const [isFetchingStates, setIsFetchingStates] = React.useState(false);

  const form = useForm<JudicialDistrictFormValues>({
    resolver: zodResolver(judicialDistrictFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      courtId: initialData?.courtId || '',
      stateId: initialData?.stateId || '',
      zipCode: initialData?.zipCode || '',
    },
  });

  React.useEffect(() => {
    form.reset({
      name: initialData?.name || '',
      courtId: initialData?.courtId || '',
      stateId: initialData?.stateId || '',
      zipCode: initialData?.zipCode || '',
    });
  }, [initialData, form]);

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));
  
  const handleRefetch = React.useCallback(async (entity: 'courts' | 'states') => {
    if (entity === 'courts') {
      setIsFetchingCourts(true);
      const data = await getCourts();
      setCourts(data);
      setIsFetchingCourts(false);
    } else if (entity === 'states') {
      setIsFetchingStates(true);
      const data = await getStates();
      setStates(data);
      setIsFetchingStates(false);
    }
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Nome da Comarca</FormLabel><FormControl><Input placeholder="Ex: Comarca de Lagarto" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="courtId" render={({ field }) => (
          <FormItem><FormLabel>Tribunal</FormLabel>
            <EntitySelector value={field.value} onChange={field.onChange} options={courts.map(c => ({ value: c.id, label: `${c.name} (${c.stateUf})` }))} placeholder="Selecione o tribunal" searchPlaceholder="Buscar tribunal..." emptyStateMessage="Nenhum tribunal." createNewUrl="/admin/courts/new" editUrlPrefix="/admin/courts" onRefetch={() => handleRefetch('courts')} isFetching={isFetchingCourts} />
          <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="stateId" render={({ field }) => (
          <FormItem><FormLabel>Estado</FormLabel>
            <EntitySelector value={field.value} onChange={field.onChange} options={states.map(s => ({ value: s.id, label: s.name }))} placeholder="Selecione o estado" searchPlaceholder="Buscar estado..." emptyStateMessage="Nenhum estado." createNewUrl="/admin/states/new" editUrlPrefix="/admin/states" onRefetch={() => handleRefetch('states')} isFetching={isFetchingStates} />
          <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="zipCode" render={({ field }) => (
          <FormItem><FormLabel>CEP (Opcional)</FormLabel><FormControl><Input placeholder="49400-000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
      </form>
    </Form>
  );
});

JudicialDistrictForm.displayName = "JudicialDistrictForm";
export default JudicialDistrictForm;
