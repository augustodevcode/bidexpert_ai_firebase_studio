/**
 * @fileoverview Formulário de edição de Tenant no Admin Plus.
 * Carrega tenant existente e permite edição de todos os campos configuráveis.
 */
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
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
import { updateTenantSchema, type UpdateTenantInput } from '../schema';
import { getTenantByIdAction, updateTenantAction } from '../actions';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'SUSPENDED', label: 'Suspenso' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'EXPIRED', label: 'Expirado' },
];

const RESOLUTION_OPTIONS = [
  { value: 'SUBDOMAIN', label: 'Subdomínio' },
  { value: 'PATH', label: 'Path' },
  { value: 'CUSTOM_DOMAIN', label: 'Domínio personalizado' },
];

export default function EditTenantPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<UpdateTenantInput>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      name: '',
      subdomain: '',
      domain: null,
      resolutionStrategy: 'SUBDOMAIN',
      status: 'PENDING',
      planId: null,
      maxUsers: null,
      maxStorageBytes: null,
      maxAuctions: null,
    },
  });

  useEffect(() => {
    (async () => {
      const result = await getTenantByIdAction({ id });
      if (result.success && result.data) {
        const t = result.data;
        form.reset({
          name: t.name,
          subdomain: t.subdomain,
          domain: t.domain ?? null,
          resolutionStrategy: t.resolutionStrategy as UpdateTenantInput['resolutionStrategy'],
          status: t.status as UpdateTenantInput['status'],
          planId: t.planId ?? null,
          maxUsers: t.maxUsers ?? null,
          maxStorageBytes: t.maxStorageBytes ? Number(t.maxStorageBytes) : null,
          maxAuctions: t.maxAuctions ?? null,
        });
      } else {
        toast.error('Tenant não encontrado');
        router.push('/admin-plus/tenants');
      }
      setIsLoading(false);
    })();
  }, [id, form, router]);

  const onSubmit = async (data: UpdateTenantInput) => {
    setIsSubmitting(true);
    const result = await updateTenantAction({ id, data });
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Tenant atualizado com sucesso');
      router.push('/admin-plus/tenants');
    } else {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof UpdateTenantInput, { message: msgs[0] });
        });
      }
      toast.error(result.error ?? 'Erro ao atualizar tenant');
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Editar Tenant" description="Carregando..." data-ai-id="tenants-edit-page-header-loading" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Editar Tenant"
        description="Altere os dados e configurações do tenant."
        data-ai-id="tenants-edit-page-header"
      />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/tenants')}
        isSubmitting={isSubmitting}
        submitLabel="Salvar Alterações"
        data-ai-id="tenants-edit-form"
      >
        {/* Identificação */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nome" required>
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string}
                onChange={field.onChange}
                placeholder="Ex: Construtora ABC"
                autoFocus
                data-ai-id="tenant-edit-field-name"
              />
            )}
          </Field>

          <Field name="subdomain" label="Subdomínio" required>
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string}
                onChange={field.onChange}
                placeholder="Ex: construtora-abc"
                data-ai-id="tenant-edit-field-subdomain"
              />
            )}
          </Field>
        </div>

        {/* Configuração */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="status" label="Status">
            {({ field }) => (
              <Select value={field.value as string} onValueChange={field.onChange}>
                <SelectTrigger data-ai-id="tenant-edit-field-status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          <Field name="resolutionStrategy" label="Estratégia de Resolução">
            {({ field }) => (
              <Select value={field.value as string} onValueChange={field.onChange}>
                <SelectTrigger data-ai-id="tenant-edit-field-resolutionStrategy">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          <Field name="domain" label="Domínio Personalizado">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="Ex: leiloes.empresa.com"
                data-ai-id="tenant-edit-field-domain"
              />
            )}
          </Field>
        </div>

        {/* Limites */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Field name="planId" label="Plano">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="Ex: pro"
                data-ai-id="tenant-edit-field-planId"
              />
            )}
          </Field>

          <Field name="maxUsers" label="Máx. Usuários">
            {({ field }) => (
              <Input
                type="number"
                value={field.value != null ? String(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                placeholder="5"
                data-ai-id="tenant-edit-field-maxUsers"
              />
            )}
          </Field>

          <Field name="maxAuctions" label="Máx. Leilões">
            {({ field }) => (
              <Input
                type="number"
                value={field.value != null ? String(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                placeholder="10"
                data-ai-id="tenant-edit-field-maxAuctions"
              />
            )}
          </Field>

          <Field name="maxStorageBytes" label="Máx. Storage (bytes)">
            {({ field }) => (
              <Input
                type="number"
                value={field.value != null ? String(field.value) : ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                placeholder="1073741824"
                data-ai-id="tenant-edit-field-maxStorageBytes"
              />
            )}
          </Field>
        </div>
      </CrudFormShell>
    </>
  );
}
