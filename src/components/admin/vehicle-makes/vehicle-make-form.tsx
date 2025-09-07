// src/components/admin/vehicle-makes/vehicle-make-form.tsx
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
import { vehicleMakeFormSchema, type VehicleMakeFormData } from '@/app/admin/vehicle-makes/form-schema';
import type { VehicleMake } from '@/types';

interface VehicleMakeFormProps {
  initialData?: VehicleMake | null;
  onSubmitAction: (data: VehicleMakeFormData) => Promise<any>;
}

const VehicleMakeForm = React.forwardRef<any, VehicleMakeFormProps>(({ initialData, onSubmitAction }, ref) => {
  const form = useForm<VehicleMakeFormData>({
    resolver: zodResolver(vehicleMakeFormSchema),
    defaultValues: {
      name: initialData?.name || '',
    },
  });

  React.useEffect(() => {
    form.reset({
      name: initialData?.name || '',
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
              <FormLabel>Nome da Marca</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Ford, Volkswagen, Toyota" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
});

VehicleMakeForm.displayName = 'VehicleMakeForm';
export default VehicleMakeForm;
