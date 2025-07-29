// src/app/admin/cities/city-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cityFormSchema, type CityFormValues } from './city-form-schema';
import type { CityInfo, StateInfo } from '@/types';
import { Loader2, Save, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import EntitySelector from '@/components/ui/entity-selector';
import { getStates } from '../states/actions';

interface CityFormProps {
  initialData?: CityInfo | null;
  states: StateInfo[];
  onSubmitAction: (data: CityFormValues) => Promise<{ success: boolean; message: string; cityId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function CityForm({
  initialData,
  states: initialStates,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: CityFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [states, setStates] = React.useState(initialStates);
  const [isFetchingStates, setIsFetchingStates] = React.useState(false);

  const form = useForm<CityFormValues>({
    resolver: zodResolver(cityFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      stateId: initialData?.stateId || '',
      ibgeCode: initialData?.ibgeCode || '',
    },
  });

  const handleRefetchStates = React.useCallback(async () => {
    setIsFetchingStates(true);
    const data = await getStates();
    setStates(data);
    setIsFetchingStates(false);
  }, []);

  async function onSubmit(values: CityFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        router.push('/admin/cities');
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
      console.error("Unexpected error in city form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 p-6 bg-secondary/30">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Salvador, Rio de Janeiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                   <EntitySelector
                      value={field.value}
                      onChange={field.onChange}
                      options={states.map(s => ({ value: s.id, label: `${s.name} (${s.uf})` }))}
                      placeholder="Selecione o estado"
                      searchPlaceholder="Buscar estado..."
                      emptyStateMessage="Nenhum estado encontrado."
                      createNewUrl="/admin/states/new"
                      editUrlPrefix="/admin/states"
                      onRefetch={handleRefetchStates}
                      isFetching={isFetchingStates}
                    />
                  <FormDescription>Selecione o estado ao qual esta cidade pertence.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ibgeCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código IBGE da Cidade (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 2927408 (7 dígitos)" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>Código numérico de 7 dígitos do IBGE para o município.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/cities')} disabled={isSubmitting}>
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
