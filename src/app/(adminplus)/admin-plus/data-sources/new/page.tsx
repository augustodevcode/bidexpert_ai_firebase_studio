/**
 * @fileoverview Página de criação de DataSource no Admin Plus.
 */
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { ADMIN_PLUS_BASE_PATH } from '@/lib/admin-plus/constants';
import { createDataSourceSchema, type CreateDataSourceInput } from './schema';
import { createDataSourceAction } from './actions';

export default function NewDataSourcePage() {
  const router = useRouter();
  const form = useForm<CreateDataSourceInput>({
    resolver: zodResolver(createDataSourceSchema),
    defaultValues: { name: '', modelName: '', fields: '[]' },
  });

  const onSubmit = async (values: CreateDataSourceInput) => {
    const result = await createDataSourceAction(values);
    if (result.success) {
      toast.success('DataSource criado com sucesso');
      router.push(`${ADMIN_PLUS_BASE_PATH}/data-sources`);
    } else {
      toast.error(result.error ?? 'Erro ao criar');
    }
  };

  return (
    <div className="space-y-6" data-ai-id="data-source-new-page">
      <PageHeader heading="Novo Data Source" description="Cadastre uma nova fonte de dados." />
      <CrudFormShell form={form} onSubmit={onSubmit} cancelHref={`${ADMIN_PLUS_BASE_PATH}/data-sources`}>
        <Field control={form.control} name="name" label="Nome" required>
          {(field) => <Input {...field} placeholder="Ex: Leilões Judiciais" data-ai-id="datasource-name-input" />}
        </Field>
        <Field control={form.control} name="modelName" label="Model Name" required hint="Nome do modelo Prisma associado">
          {(field) => <Input {...field} placeholder="Ex: Auction" data-ai-id="datasource-model-input" />}
        </Field>
        <Field control={form.control} name="fields" label="Fields (JSON)" required hint="Array ou objeto JSON com a definição dos campos">
          {(field) => (
            <Textarea {...field} rows={8} className="font-mono text-sm" placeholder='[{"name":"title","type":"string"}]' data-ai-id="datasource-fields-input" />
          )}
        </Field>
      </CrudFormShell>
    </div>
  );
}
