// src/components/admin/judicial-branches/judicial-branch-form.tsx
/**
 * @fileoverview Componente de formulário reutilizável para criar e editar Varas Judiciais.
 * Utiliza `react-hook-form` para gerenciamento de estado e Zod para validação.
 * Inclui o `EntitySelector` para permitir a seleção de uma comarca existente
 * e busca dinâmica de dados para manter as opções atualizadas.
 */
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { judicialBranchFormSchema, type JudicialBranchFormValues } from '@/app/admin/judicial-branches/judicial-branch-form-schema';
import type { JudicialBranch, JudicialDistrict } from '@/types';
import { Loader2, Save, Building2 } from 'lucide-react';
import EntitySelector from '@/components/ui/entity-selector';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';

interface JudicialBranchFormProps {
  initialData?: JudicialBranch | null;
  districts: JudicialDistrict[];
  onSubmitAction: (data: JudicialBranchFormValues) => Promise<{ success: boolean; message: string; branchId?: string }>;
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
}

export default function JudicialBranchForm({
  initialData,
  districts: initialDistricts,
  onSubmitAction,
  onSuccess,
  onCancel,
}: JudicialBranchFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [districts, setDistricts] = React.useState(initialDistricts);
  const [isFetchingDistricts, setIsFetchingDistricts] = React.useState(false);

  const form = useForm<JudicialBranchFormValues>({
    resolver: zodResolver(judicialBranchFormSchema),
    mode: 'onChange',
    defaultValues: initialData || {},
  });

  const { formState } = form;

  const handleRefetchDistricts = React.useCallback(async () => {
    setIsFetchingDistricts(true);
    const data = await getJudicialDistricts();
    setDistricts(data);
    setIsFetchingDistricts(false);
  }, []);

  async function onSubmit(values: JudicialBranchFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({ title: 'Sucesso!', description: result.message });
        if(onSuccess) onSuccess(result.branchId);
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
           <FormField
            control={form.control}
            name="districtId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comarca<span className="text-destructive">*</span></FormLabel>
                 <EntitySelector
                    entityName="Comarca"
                    value={field.value}
                    onChange={field.onChange}
                    options={districts.map(d => ({ value: d.id, label: `${d.name} (${d.stateUf})` }))}
                    placeholder="Selecione a comarca"
                    searchPlaceholder="Buscar comarca..."
                    emptyStateMessage="Nenhuma comarca encontrada."
                    onRefetch={handleRefetchDistricts}
                    isFetching={isFetchingDistricts}
                  />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Vara<span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="Ex: 1ª Vara Cível e Criminal" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="contactName" render={({ field }) => (
              <FormItem><FormLabel>Nome do Contato (Opcional)</FormLabel><FormControl><Input placeholder="Nome do escrivão ou diretor" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )}/>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem> <FormLabel>Telefone (Opcional)</FormLabel><FormControl><Input placeholder="(00) 0000-0000" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input type="email" placeholder="contato@vara.jus.br" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )}/>
          </div>
        </div>
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

