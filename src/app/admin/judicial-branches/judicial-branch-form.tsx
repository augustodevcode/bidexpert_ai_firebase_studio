// src/app/admin/judicial-branches/judicial-branch-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { judicialBranchFormSchema, type JudicialBranchFormValues } from './judicial-branch-form-schema';
import type { JudicialBranch, JudicialDistrict } from '@/types';
import EntitySelector from '@/components/ui/entity-selector';
import { getJudicialDistricts } from '../judicial-districts/actions';

interface JudicialBranchFormProps {
  initialData?: JudicialBranch | null;
  districts: JudicialDistrict[];
  onSubmitAction: (data: JudicialBranchFormValues) => Promise<any>;
}

const JudicialBranchForm = React.forwardRef<any, JudicialBranchFormProps>(({
  initialData,
  districts: initialDistricts,
  onSubmitAction,
}, ref) => {
  const [districts, setDistricts] = React.useState(initialDistricts);
  const [isFetchingDistricts, setIsFetchingDistricts] = React.useState(false);

  const form = useForm<JudicialBranchFormValues>({
    resolver: zodResolver(judicialBranchFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      districtId: initialData?.districtId || '',
      contactName: initialData?.contactName || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
    },
  });
  
  React.useEffect(() => {
      form.reset({
        name: initialData?.name || '',
        districtId: initialData?.districtId || '',
        contactName: initialData?.contactName || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
      });
  }, [initialData, form]);

  React.useImperativeHandle(ref, () => ({
    requestSubmit: form.handleSubmit(onSubmitAction),
  }));

  const handleRefetchDistricts = React.useCallback(async () => {
    setIsFetchingDistricts(true);
    const data = await getJudicialDistricts();
    setDistricts(data);
    setIsFetchingDistricts(false);
  }, []);

  return (
    <Form {...form}>
      <form data-ai-id="admin-judicial-branch-form-card" onSubmit={form.handleSubmit(onSubmitAction)} className="space-y-6">
        <FormField
          control={form.control}
          name="districtId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comarca</FormLabel>
               <EntitySelector
                  value={field.value}
                  onChange={field.onChange}
                  options={districts.map(d => ({ value: d.id, label: `${d.name} (${d.stateUf})` }))}
                  placeholder="Selecione a comarca"
                  searchPlaceholder="Buscar comarca..."
                  emptyStateMessage="Nenhuma comarca encontrada."
                  createNewUrl="/admin/judicial-districts/new"
                  editUrlPrefix="/admin/judicial-districts"
                  onRefetch={handleRefetchDistricts}
                  isFetching={isFetchingDistricts}
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
              <FormLabel>Nome da Vara</FormLabel>
              <FormControl><Input placeholder="Ex: 1ª Vara Cível e Criminal" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Contato (Opcional)</FormLabel>
              <FormControl><Input placeholder="Nome do escrivão ou diretor" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Telefone (Opcional)</FormLabel>
                <FormControl><Input placeholder="(00) 0000-0000" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email (Opcional)</FormLabel>
                <FormControl><Input type="email" placeholder="contato@vara.jus.br" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
      </form>
    </Form>
  );
});
JudicialBranchForm.displayName = "JudicialBranchForm";
export default JudicialBranchForm;
