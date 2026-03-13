/**
 * @fileoverview Formulário de edição de Estado no Admin Plus.
 */
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { createStateSchema, type CreateStateInput } from '../schema';
import { getStateByIdAction, updateStateAction } from '../actions';

export default function EditStatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateStateInput>({
    resolver: zodResolver(createStateSchema),
    defaultValues: { name: '', uf: '' },
  });

  useEffect(() => {
    (async () => {
      const result = await getStateByIdAction({ id });
      if (result.success && result.data) {
        const state = result.data;
        form.reset({ name: state.name, uf: state.uf });
      } else {
        toast.error('Estado não encontrado');
        router.push('/admin-plus/states');
      }
      setIsLoading(false);
    })();
  }, [id, form, router]);

  const onSubmit = async (data: CreateStateInput) => {
    setIsSubmitting(true);
    const result = await updateStateAction({ id, data });
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Estado atualizado com sucesso');
      router.push('/admin-plus/states');
    } else {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof CreateStateInput, { message: msgs[0] });
        });
      }
      toast.error(result.error ?? 'Erro ao atualizar estado');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-ai-id="states-edit-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Editar Estado"
        description="Atualize os dados do estado."
        data-ai-id="states-edit-page-header"
      />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/states')}
        isSubmitting={isSubmitting}
        submitLabel="Salvar Alterações"
        data-ai-id="states-edit-form"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nome" required>
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string}
                onChange={field.onChange}
                placeholder="Ex: São Paulo"
                autoFocus
                data-ai-id="state-field-name"
              />
            )}
          </Field>

          <Field name="uf" label="UF" required hint="Sigla com 2 caracteres (ex: SP)">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string}
                onChange={field.onChange}
                placeholder="SP"
                maxLength={2}
                className="uppercase"
                data-ai-id="state-field-uf"
              />
            )}
          </Field>
        </div>
      </CrudFormShell>
    </>
  );
}
