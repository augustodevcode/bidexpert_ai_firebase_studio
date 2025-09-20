// src/app/admin/states/state-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar Estados.
 * Utiliza `react-hook-form` para gerenciamento de estado e Zod para validação,
 * garantindo que nome e UF do estado sejam fornecidos corretamente.
 */
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
import { stateFormSchema, type StateFormValues } from './state-form-schema';
import type { StateInfo } from '@/types';
import { Loader2, Save, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface StateFormProps {
  initialData?: StateInfo | null;
  onSubmitAction: (data: StateFormValues) => Promise<{ success: boolean; message: string; stateId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function StateForm({
  initialData,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: StateFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<StateFormValues>({
    resolver: zodResolver(stateFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      uf: initialData?.uf || '',
    },
  });

  async function onSubmit(values: StateFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        router.push('/admin/states');
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
      console.error("Unexpected error in state form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Landmark className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
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
                  <FormLabel>Nome do Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: São Paulo, Bahia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="uf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF (Sigla)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: SP, BA" {...field} maxLength={2} style={{ textTransform: 'uppercase' }} />
                  </FormControl>
                  <FormDescription>Sigla do estado com 2 letras maiúsculas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/states')} disabled={isSubmitting}>
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
