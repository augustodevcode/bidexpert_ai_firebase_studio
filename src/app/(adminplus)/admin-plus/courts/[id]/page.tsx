/**
 * @fileoverview Formulário de edição de Tribunal no Admin Plus.
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
import { createCourtSchema, type CreateCourtInput } from '../schema';
import { getCourtByIdAction, updateCourtAction } from '../actions';

export default function EditCourtPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCourtInput>({
    resolver: zodResolver(createCourtSchema),
    defaultValues: { name: '', stateUf: '', website: '' },
  });

  useEffect(() => {
    (async () => {
      const result = await getCourtByIdAction({ id });
      if (result.success && result.data) {
        form.reset({
          name: result.data.name,
          stateUf: result.data.stateUf,
          website: result.data.website ?? '',
        });
      } else {
        toast.error('Tribunal não encontrado');
        router.push('/admin-plus/courts');
      }
      setIsLoading(false);
    })();
  }, [id, form, router]);

  const onSubmit = async (data: CreateCourtInput) => {
    setIsSubmitting(true);
    const result = await updateCourtAction({ id, data });
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Tribunal atualizado com sucesso');
      router.push('/admin-plus/courts');
    } else {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof CreateCourtInput, { message: msgs[0] });
        });
      }
      toast.error(result.error ?? 'Erro ao atualizar tribunal');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-ai-id="courts-edit-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
        <Skeleton className="h-10" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Editar Tribunal" description="Atualize os dados do tribunal." data-ai-id="courts-edit-page-header" />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/courts')}
        isSubmitting={isSubmitting}
        submitLabel="Salvar Alterações"
        data-ai-id="courts-edit-form"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nome" required>
            {({ field }) => (
              <Input {...field} value={field.value as string} placeholder="Ex: Tribunal de Justiça de SP" autoFocus data-ai-id="court-field-name" />
            )}
          </Field>

          <Field name="stateUf" label="UF" required hint="Sigla com 2 caracteres">
            {({ field }) => (
              <Input {...field} value={field.value as string} placeholder="SP" maxLength={2} className="uppercase" data-ai-id="court-field-uf" />
            )}
          </Field>
        </div>

        <Field name="website" label="Website" hint="URL completa (opcional)">
          {({ field }) => (
            <Input {...field} value={field.value as string} placeholder="https://www.tjsp.jus.br" type="url" data-ai-id="court-field-website" />
          )}
        </Field>
      </CrudFormShell>
    </>
  );
}
