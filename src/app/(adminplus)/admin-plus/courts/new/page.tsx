/**
 * @fileoverview Formulário de criação de Tribunal no Admin Plus.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { createCourtSchema, type CreateCourtInput } from '../schema';
import { createCourtAction } from '../actions';

export default function NewCourtPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCourtInput>({
    resolver: zodResolver(createCourtSchema),
    defaultValues: { name: '', stateUf: '', website: '' },
  });

  const onSubmit = async (data: CreateCourtInput) => {
    setIsSubmitting(true);
    const result = await createCourtAction(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Tribunal criado com sucesso');
      router.push('/admin-plus/courts');
    } else {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof CreateCourtInput, { message: msgs[0] });
        });
      }
      toast.error(result.error ?? 'Erro ao criar tribunal');
    }
  };

  return (
    <>
      <PageHeader title="Novo Tribunal" description="Cadastre um novo tribunal ou comarca." data-ai-id="courts-new-page-header" />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/courts')}
        isSubmitting={isSubmitting}
        submitLabel="Criar Tribunal"
        data-ai-id="courts-new-form"
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
