/**
 * @fileoverview Formulário de criação de Tenant no Admin Plus.
 * Inclui campos de configuração: limites, status e estratégia de resolução.
 */
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { createTenantSchema, type CreateTenantInput } from '../schema';
import { createTenantAction } from '../actions';

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

export default function NewTenantPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      subdomain: '',
      domain: null,
      resolutionStrategy: 'SUBDOMAIN',
      status: 'PENDING',
      planId: null,
      maxUsers: 5,
      maxStorageBytes: 1073741824,
      maxAuctions: 10,
    },
  });

  const onSubmit = async (data: CreateTenantInput) => {
    setIsSubmitting(true);
    const result = await createTenantAction(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Tenant criado com sucesso');
      router.push('/admin-plus/tenants');
    } else {
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof CreateTenantInput, { message: msgs[0] });
        });
      }
      toast.error(result.error ?? 'Erro ao criar tenant');
    }
  };

  return (
    <>
      <PageHeader
        title="Novo Tenant"
        description="Cadastre um novo inquilino/leiloeiro no sistema."
        data-ai-id="tenants-new-page-header"
      />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/tenants')}
        isSubmitting={isSubmitting}
        submitLabel="Criar Tenant"
        data-ai-id="tenants-new-form"
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
                data-ai-id="tenant-field-name"
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
                data-ai-id="tenant-field-subdomain"
              />
            )}
          </Field>
        </div>

        {/* Configuração */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="status" label="Status">
            {({ field }) => (
              <Select value={field.value as string} onValueChange={field.onChange}>
                <SelectTrigger data-ai-id="tenant-field-status">
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
                <SelectTrigger data-ai-id="tenant-field-resolutionStrategy">
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
                data-ai-id="tenant-field-domain"
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
                data-ai-id="tenant-field-planId"
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
                data-ai-id="tenant-field-maxUsers"
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
                data-ai-id="tenant-field-maxAuctions"
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
                data-ai-id="tenant-field-maxStorageBytes"
              />
            )}
          </Field>
        </div>
      </CrudFormShell>
    </>
  );
}
