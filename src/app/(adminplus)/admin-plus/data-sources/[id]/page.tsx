/**
 * @fileoverview Página de edição de DataSource no Admin Plus.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ADMIN_PLUS_BASE_PATH } from '@/lib/admin-plus/constants';
import { createDataSourceSchema, type CreateDataSourceInput } from '../schema';
import { getDataSourceByIdAction, updateDataSourceAction } from '../actions';

export default function EditDataSourcePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const form = useForm<CreateDataSourceInput>({
    resolver: zodResolver(createDataSourceSchema),
    defaultValues: { name: '', modelName: '', fields: '[]' },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await getDataSourceByIdAction({ id });
    if (result.success && result.data) {
      const ds = result.data;
      form.reset({ name: ds.name, modelName: ds.modelName, fields: ds.fields });
    } else {
      toast.error(result.error ?? 'DataSource não encontrado');
      router.push(`${ADMIN_PLUS_BASE_PATH}/data-sources`);
    }
    setLoading(false);
  }, [id, form, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const onSubmit = async (values: CreateDataSourceInput) => {
    const result = await updateDataSourceAction({ id, data: values });
    if (result.success) {
      toast.success('DataSource atualizado com sucesso');
      router.push(`${ADMIN_PLUS_BASE_PATH}/data-sources`);
    } else {
      toast.error(result.error ?? 'Erro ao atualizar');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-ai-id="data-source-edit-skeleton">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ai-id="data-source-edit-page">
      <PageHeader title="Editar Data Source" description="Altere os dados da fonte de dados." />
      <CrudFormShell form={form} onSubmit={onSubmit} onCancel={() => router.push(`${ADMIN_PLUS_BASE_PATH}/data-sources`)}>
        <Field control={form.control} name="name" label="Nome" required>
          {({ field }) => <Input {...field} value={String(field.value ?? '')} placeholder="Ex: Leilões Judiciais" data-ai-id="datasource-name-input" />}
        </Field>
        <Field control={form.control} name="modelName" label="Model Name" required hint="Nome do modelo Prisma associado">
          {({ field }) => <Input {...field} value={String(field.value ?? '')} placeholder="Ex: Auction" data-ai-id="datasource-model-input" />}
        </Field>
        <Field control={form.control} name="fields" label="Fields (JSON)" required hint="Array ou objeto JSON com a definição dos campos">
          {({ field }) => (
            <Textarea {...field} value={String(field.value ?? '')} rows={8} className="font-mono text-sm" placeholder='[{"name":"title","type":"string"}]' data-ai-id="datasource-fields-input" />
          )}
        </Field>
      </CrudFormShell>
    </div>
  );
}
