// src/app/admin/vehicle-makes/vehicle-make-form.tsx
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
import { vehicleMakeFormSchema, type VehicleMakeFormData } from './form-schema';
import type { VehicleMake } from '@/types';
import { Loader2, Save, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface VehicleMakeFormProps {
  initialData?: VehicleMake | null;
  onSubmitAction: (data: VehicleMakeFormData) => Promise<{ success: boolean; message: string; makeId?: string }>;
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
}

export default function VehicleMakeForm({
  initialData,
  onSubmitAction,
  onSuccess,
  onCancel,
}: VehicleMakeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<VehicleMakeFormData>({
    resolver: zodResolver(vehicleMakeFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: initialData?.name || '',
    },
  });
  
  const { formState } = form;

  React.useEffect(() => {
    form.reset(initialData || {});
  }, [initialData, form]);

  async function onSubmit(values: VehicleMakeFormData) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        if(onSuccess) onSuccess(result.makeId);
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
