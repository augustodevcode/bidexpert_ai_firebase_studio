/**
 * @fileoverview Formulário de edição de Tipo de Documento no Admin Plus.
 */
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { createDocumentTypeSchema, appliesToOptions, type CreateDocumentTypeInput } from '../schema';
import { getDocumentTypeByIdAction, updateDocumentTypeAction } from '../actions';

const appliesToLabels: Record<string, string> = {
  PHYSICAL: 'Pessoa Física',
  LEGAL: 'Pessoa Jurídica',
  BOTH: 'Ambos',
};

export default function EditDocumentTypePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateDocumentTypeInput>({
    resolver: zodResolver(createDocumentTypeSchema),
    defaultValues: { name: '', description: '', isRequired: true, appliesTo: 'BOTH' },
  });

  useEffect(() => {
    (async () => {
      const result = await getDocumentTypeByIdAction({ id });
      if (result.success && result.data) {
        form.reset({
          name: result.data.name,
          description: result.data.description ?? '',
          isRequired: result.data.isRequired,
          appliesTo: result.data.appliesTo as CreateDocumentTypeInput['appliesTo'],
        });
      } else {
        toast.error('Tipo de documento não encontrado');
        router.push('/admin-plus/document-types');
      }
      setIsLoading(false);
    })();
  }, [id, form, router]);

  const onSubmit = async (data: CreateDocumentTypeInput) => {
    setIsSubmitting(true);
    const result = await updateDocumentTypeAction({ id, data });
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Tipo de documento atualizado');
      router.push('/admin-plus/document-types');
    } else {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof CreateDocumentTypeInput, { message: msgs[0] });
        });
      }
      toast.error(result.error ?? 'Erro ao atualizar');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-ai-id="document-types-edit-loading">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
        <Skeleton className="h-20" /><Skeleton className="h-10 w-24" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Editar Tipo de Documento" description="Atualize os dados do tipo de documento." data-ai-id="document-types-edit-page-header" />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/document-types')}
        isSubmitting={isSubmitting}
        submitLabel="Salvar Alterações"
        data-ai-id="document-types-edit-form"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nome" required>
            {({ field }) => (
              <Input {...field} value={field.value as string} placeholder="Ex: RG - Identidade" autoFocus data-ai-id="doctype-field-name" />
            )}
          </Field>

          <Field name="appliesTo" label="Aplica-se a" required>
            {({ field }) => (
              <Select value={field.value as string} onValueChange={field.onChange}>
                <SelectTrigger data-ai-id="doctype-field-applies">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {appliesToOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{appliesToLabels[opt]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        </div>

        <Field name="description" label="Descrição" hint="Opcional">
          {({ field }) => (
            <Textarea {...field} value={field.value as string} placeholder="Descreva o tipo de documento..." rows={3} data-ai-id="doctype-field-desc" />
          )}
        </Field>

        <Field name="isRequired" label="Obrigatório">
          {({ field }) => (
            <div className="flex items-center gap-2">
              <Switch checked={field.value as boolean} onCheckedChange={field.onChange} data-ai-id="doctype-field-required" />
              <span className="text-sm text-muted-foreground">{field.value ? 'Sim' : 'Não'}</span>
            </div>
          )}
        </Field>
      </CrudFormShell>
    </>
  );
}
