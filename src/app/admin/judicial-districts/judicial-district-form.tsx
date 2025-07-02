// src/app/admin/judicial-districts/judicial-district-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { judicialDistrictFormSchema, type JudicialDistrictFormValues } from './judicial-district-form-schema';
import type { JudicialDistrict, Court, StateInfo } from '@/types';
import { Loader2, Save, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface JudicialDistrictFormProps {
  initialData?: JudicialDistrict | null;
  courts: Court[];
  states: StateInfo[];
  onSubmitAction: (data: JudicialDistrictFormValues) => Promise<{ success: boolean; message: string; districtId?: string }>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function JudicialDistrictForm({
  initialData,
  courts,
  states,
  onSubmitAction,
  formTitle,
  formDescription,
  submitButtonText,
}: JudicialDistrictFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<JudicialDistrictFormValues>({
    resolver: zodResolver(judicialDistrictFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      courtId: initialData?.courtId || '',
      stateId: initialData?.stateId || '',
      zipCode: initialData?.zipCode || '',
    },
  });

  async function onSubmit(values: JudicialDistrictFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        router.push('/admin/judicial-districts');
        router.refresh();
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
    <Card className="max-w-xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Map className="h-6 w-6 text-primary" /> {formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Comarca</FormLabel>
                <FormControl><Input placeholder="Ex: Comarca de Lagarto" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="courtId" render={({ field }) => (
              <FormItem>
                <FormLabel>Tribunal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tribunal" /></SelectTrigger></FormControl>
                  <SelectContent>{courts.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.stateUf})</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="stateId" render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger></FormControl>
                  <SelectContent>{states.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="zipCode" render={({ field }) => (
              <FormItem>
                <FormLabel>CEP (Opcional)</FormLabel>
                <FormControl><Input placeholder="49400-000" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/judicial-districts')} disabled={isSubmitting}>Cancelar</Button>
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