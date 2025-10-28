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
import { stateFormSchema, type StateFormValues } from './state-form-schema';
import type { StateInfo } from '@/types';
import { Loader2, Save } from 'lucide-react';

interface StateFormProps {
  initialData?: StateInfo | null;
  onSubmitAction: (data: StateFormValues) => Promise<{ success: boolean; message: string; stateId?: string }>;
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
}

export default function StateForm({
  initialData,
  onSubmitAction,
  onSuccess,
  onCancel,
}: StateFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<StateFormValues>({
    resolver: zodResolver(stateFormSchema),
    mode: 'onChange',
    defaultValues: initialData || { name: '', uf: '' },
  });
  
  const { formState } = form;

  React.useEffect(() => {
    form.reset(initialData || { name: '', uf: '' });
  }, [initialData, form]);


  async function onSubmit(values: StateFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        if(onSuccess) onSuccess(result.stateId);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Estado<span className="text-destructive">*</span></FormLabel>
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
                <FormLabel>UF (Sigla)<span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Ex: SP, BA" {...field} maxLength={2} style={{ textTransform: 'uppercase' }} />
                </FormControl>
                <FormDescription>Sigla do estado com 2 letras maiúsculas.</FormDescription>
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
