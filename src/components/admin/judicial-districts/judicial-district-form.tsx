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
import { judicialDistrictFormSchema, type JudicialDistrictFormValues } from '@/app/admin/judicial-districts/judicial-district-form-schema';
import type { JudicialDistrict, Court, StateInfo } from '@/types';
import { Loader2, Save, Map } from 'lucide-react';
import EntitySelector from '@/components/ui/entity-selector';
import { getCourts } from '@/app/admin/courts/actions';
import { getStates } from '@/app/admin/states/actions';

interface JudicialDistrictFormProps {
  initialData?: JudicialDistrict | null;
  courts: Court[];
  states: StateInfo[];
  onSubmitAction: (data: JudicialDistrictFormValues) => Promise<{ success: boolean; message: string; districtId?: string }>;
  onSuccess?: (districtId?: string) => void;
  onCancel?: () => void;
  onAddNewEntity?: (entity: 'court' | 'state') => void;
}

export default function JudicialDistrictForm({
  initialData,
  courts: initialCourts,
  states: initialStates,
  onSubmitAction,
  onSuccess,
  onCancel,
  onAddNewEntity,
}: JudicialDistrictFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [courts, setCourts] = React.useState(initialCourts);
  const [states, setStates] = React.useState(initialStates);
  const [isFetchingCourts, setIsFetchingCourts] = React.useState(false);
  const [isFetchingStates, setIsFetchingStates] = React.useState(false);

  const form = useForm<JudicialDistrictFormValues>({
    resolver: zodResolver(judicialDistrictFormSchema),
    mode: 'onChange',
    defaultValues: initialData || {},
  });

  const { formState } = form;

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
        if(onSuccess) onSuccess(result.districtId);
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Nome da Comarca<span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input placeholder="Ex: Comarca de Lagarto" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="courtId" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tribunal<span className="text-destructive">*</span></FormLabel>
                        <EntitySelector
                        entityName="Tribunal"
                        value={field.value}
                        onChange={field.onChange}
                        options={courts.map(c => ({ value: c.id, label: `${c.name} (${c.stateUf})` }))}
                        placeholder="Selecione o tribunal"
                        searchPlaceholder="Buscar tribunal..."
                        emptyStateMessage="Nenhum tribunal."
                        onAddNew={() => onAddNewEntity?.('court')}
                        onRefetch={() => handleRefetch('courts')}
                        isFetching={isFetchingCourts}
                        />
                    <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="stateId" render={({ field }) => (
                    <FormItem>
                    <FormLabel>Estado<span className="text-destructive">*</span></FormLabel>
                        <EntitySelector
                        entityName="Estado"
                        value={field.value}
                        onChange={field.onChange}
                        options={states.map(s => ({ value: s.id, label: s.name }))}
                        placeholder="Selecione o estado"
                        searchPlaceholder="Buscar estado..."
                        emptyStateMessage="Nenhum estado."
                        onAddNew={() => onAddNewEntity?.('state')}
                        onRefetch={() => handleRefetch('states')}
                        isFetching={isFetchingStates}
                        />
                    <FormMessage />
                    </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="zipCode" render={({ field }) => (
                <FormItem><FormLabel>CEP (Opcional)</FormLabel><FormControl><Input placeholder="49400-000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>}
                <Button type="submit" disabled={isSubmitting || !formState.isValid}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar
                </Button>
            </div>
        </form>
      </Form>
  );
}
