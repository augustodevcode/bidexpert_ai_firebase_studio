
// src/app/admin/courts/court-form.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { courtFormSchema, type CourtFormValues } from './court-form-schema';
import type { Court, StateInfo } from '@/types';
import { Loader2, Save, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface CourtFormProps {
  initialData?: Court | null;
  states: StateInfo[];
  onSubmitAction: (data: CourtFormValues) => Promise<{ success: boolean; message: string; courtId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function CourtForm({
  initialData,
  states,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: CourtFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CourtFormValues>({
    resolver: zodResolver(courtFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      stateUf: initialData?.stateUf || '',
      website: initialData?.website || '',
    },
  });

  async function onSubmit(values: CourtFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        router.push('/admin/courts');
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
        <CardTitle className="flex items-center gap-2"><Scale className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
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
                  <FormLabel>Nome do Tribunal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Tribunal de Justiça de São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stateUf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado (UF)</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.uf} value={state.uf}>
                          {state.name} ({state.uf})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://www.tjsp.jus.br" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2 p-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/courts')} disabled={isSubmitting}>
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
