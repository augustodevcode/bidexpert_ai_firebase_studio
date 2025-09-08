// src/components/admin/vehicle-models/vehicle-model-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { vehicleModelFormSchema } from '@/app/admin/vehicle-models/form-schema';
import type { VehicleModelFormData, VehicleModel, VehicleMake } from '@bidexpert/core';
import EntitySelector from '@/components/ui/entity-selector';
import { getVehicleMakes } from '@/app/admin/vehicle-makes/actions';

interface VehicleModelFormProps {
  initialData?: VehicleModel | null;
  makes: VehicleMake[];
  onSubmitAction: (data: VehicleModelFormData) => Promise<any>;
}

const VehicleModelForm = React.forwardRef<any, VehicleModelFormProps>(({
  initialData,
  makes: initialMakes,
  onSubmitAction,
}, ref) => {
  const [makes, setMakes] = React.useState(initialMakes);
  const [isFetchingMakes, setIsFetchingMakes] = React.useState(false);

  const form = useForm<VehicleModelFormData>({
    resolver: zodResolver(vehicleModelFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      makeId: initialData?.makeId || '',
    },
  });
  
   React.useEffect(() => {
    form.reset({
      name: initialData?.name || '',
      makeId: initialData?.makeId || '',
    });
  }, [initialData, form]);


  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  const handleRefetchMakes = React.useCallback(async () => {
    setIsFetchingMakes(true);
    const data = await getVehicleMakes();
    setMakes(data);
    setIsFetchingMakes(false);
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
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
      </form>
    </Form>
  );
});

VehicleModelForm.displayName = "VehicleModelForm";
export default VehicleModelForm;
