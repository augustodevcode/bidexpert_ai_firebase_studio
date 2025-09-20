// src/components/admin/judicial-districts/judicial-district-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar Comarcas.
 * Utiliza `react-hook-form` para gerenciamento de estado, Zod para validação e
 * o `EntitySelector` para permitir a seleção de um estado e tribunal da lista.
 */
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { judicialDistrictFormSchema, type JudicialDistrictFormValues } from './judicial-district-form-schema';
import type { JudicialDistrict, Court, StateInfo } from '@/types';
import { Loader2, Save, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import EntitySelector from '@/components/ui/entity-selector';
import { getCourts } from '../courts/actions';
import { getStates } from '../states/actions';

interface JudicialDistrictFormProps {
  initialData?: JudicialDistrict | null;
  courts: Court[];
  states: StateInfo[];
  onSubmitAction: (data: JudicialDistrictFormValues) => Promise<{ success: boolean; message: string; districtId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function JudicialDistrictForm({
  initialData,
  courts: initialCourts,
  states: initialStates,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: JudicialDistrictFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  async function onSubmit(values: JudicialDistrictFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        router.push('/admin/judicial-districts');
        router.refresh();
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro Inesperado', description: 'Ocorreu um erro ao processar sua solicitação.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Map className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 bg-secondary/30">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome da Comarca</FormLabel><FormControl><Input placeholder="Ex: Comarca de Lagarto" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="courtId" render={({ field }) => (
                <FormItem><FormLabel>Tribunal</FormLabel>
                    <EntitySelector
                      entityName="court"
                      value={field.value}
                      onChange={field.onChange}
                      options={courts.map(c => ({ value: c.id, label: `${c.name} (${c.stateUf})` }))}
                      placeholder="Selecione o tribunal"
                      searchPlaceholder="Buscar tribunal..."
                      emptyStateMessage="Nenhum tribunal."
                      createNewUrl="/admin/courts/new"
                      editUrlPrefix="/admin/courts"
                      onRefetch={() => handleRefetch('courts')}
                      isFetching={isFetchingCourts}
                    />
                <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="stateId" render={({ field }) => (
                <FormItem><FormLabel>Estado</FormLabel>
                    <EntitySelector
                      entityName="state"
                      value={field.value}
                      onChange={field.onChange}
                      options={states.map(s => ({ value: s.id, label: s.name }))}
                      placeholder="Selecione o estado"
                      searchPlaceholder="Buscar estado..."
                      emptyStateMessage="Nenhum estado."
                      createNewUrl="/admin/states/new"
                      editUrlPrefix="/admin/states"
                      onRefetch={() => handleRefetch('states')}
                      isFetching={isFetchingStates}
                    />
                <FormMessage /></FormItem>
                )} />
            </div>
            <FormField control={form.control} name="zipCode" render={({ field }) => (
              <FormItem><FormLabel>CEP (Opcional)</FormLabel><FormControl><Input placeholder="49400-000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/judicial-districts')} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {submitButtonText}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
