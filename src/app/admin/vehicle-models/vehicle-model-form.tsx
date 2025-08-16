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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import EntitySelector from '@/components/ui/entity-selector';
import { getVehicleMakes } from '../vehicle-makes/actions';

interface VehicleModelFormProps {
  initialData?: VehicleModel | null;
  makes: VehicleMake[];
  onSubmitAction: (data: VehicleModelFormData) => Promise<{ success: boolean; message: string; modelId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function VehicleModelForm({
  initialData,
  makes: initialMakes,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: VehicleModelFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [makes, setMakes] = React.useState(initialMakes);
  const [isFetchingMakes, setIsFetchingMakes] = React.useState(false);

  const form = useForm<VehicleModelFormData>({
    resolver: zodResolver(vehicleModelFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      makeId: initialData?.makeId || '',
    },
  });

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
        router.push('/admin/vehicle-models');
        router.refresh();
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
    <Card className="max-w-xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Car className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 bg-secondary/30">
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
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/vehicle-models')} disabled={isSubmitting}>
              Cancelar
            </Button>
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
