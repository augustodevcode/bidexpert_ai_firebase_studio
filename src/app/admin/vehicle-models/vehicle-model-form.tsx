// src/app/admin/vehicle-models/vehicle-model-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { vehicleModelFormSchema, type VehicleModelFormData } from './form-schema';
import type { VehicleModel, VehicleMake } from '@/types';
import { Loader2, Save, Car } from 'lucide-react';
import EntitySelector from '@/components/ui/entity-selector';
import { getVehicleMakes } from '../vehicle-makes/actions';

interface VehicleModelFormProps {
  initialData?: VehicleModel | null;
  makes: VehicleMake[];
  onSubmitAction: (data: VehicleModelFormData) => Promise<{ success: boolean; message: string; modelId?: string }>;
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  onAddNewEntity?: (entity: 'make') => void;
}

export default function VehicleModelForm({
  initialData,
  makes: initialMakes,
  onSubmitAction,
  onSuccess,
  onCancel,
  onAddNewEntity,
}: VehicleModelFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [makes, setMakes] = React.useState(initialMakes);
  const [isFetchingMakes, setIsFetchingMakes] = React.useState(false);

  const form = useForm<VehicleModelFormData>({
    resolver: zodResolver(vehicleModelFormSchema),
    mode: 'onChange',
    defaultValues: initialData || { name: '', makeId: '' },
  });

  const { formState } = form;

  React.useEffect(() => {
    form.reset(initialData || {});
  }, [initialData, form]);

  const handleRefetchMakes = React.useCallback(async () => {
    setIsFetchingMakes(true);
    const data = await getVehicleMakes();
    setMakes(data);
    setIsFetchingMakes(false);
  }, []);

  async function onSubmit(values: VehicleModelFormData) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        if(onSuccess) onSuccess(result.modelId);
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro ao processar sua solicitação.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="makeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca do Veículo</FormLabel>
              <EntitySelector
                value={field.value}
                onChange={field.onChange}
                options={makes.map(m => ({ value: m.id, label: m.name }))}
                placeholder="Selecione a marca"
                searchPlaceholder="Buscar marca..."
                emptyStateMessage="Nenhuma marca encontrada."
                createNewUrl="/admin/vehicle-makes/new"
                editUrlPrefix="/admin/vehicle-makes"
                onRefetch={handleRefetchMakes}
                isFetching={isFetchingMakes}
                onAddNew={() => onAddNewEntity?.('make')}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Ka, Gol, Corolla" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
