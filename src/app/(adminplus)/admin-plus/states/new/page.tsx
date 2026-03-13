/**
 * @fileoverview Formulário de criação de Estado no Admin Plus.
 */
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { createStateSchema, type CreateStateInput } from '../schema';
import { createStateAction } from '../actions';
import { useState } from 'react';

export default function NewStatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateStateInput>({
    resolver: zodResolver(createStateSchema),
    defaultValues: { name: '', uf: '' },
  });

  const onSubmit = async (data: CreateStateInput) => {
    setIsSubmitting(true);
    const result = await createStateAction(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Estado criado com sucesso');
      router.push('/admin-plus/states');
    } else {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof CreateStateInput, { message: msgs[0] });
        });
      }
      toast.error(result.error ?? 'Erro ao criar estado');
    }
  };

  return (
    <>
      <PageHeader
        title="Novo Estado"
        description="Cadastre um novo estado (UF) no sistema."
        data-ai-id="states-new-page-header"
      />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/states')}
        isSubmitting={isSubmitting}
        submitLabel="Criar Estado"
        data-ai-id="states-new-form"
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
