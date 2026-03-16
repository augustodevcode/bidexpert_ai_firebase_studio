/**
 * @fileoverview Formulário de Tenant em Sheet overlay — Admin Plus.
 */
'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTenantSchema, type CreateTenantInput } from './schema';
import type { TenantRow } from './columns';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'SUSPENDED', label: 'Suspenso' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'EXPIRED', label: 'Expirado' },
] as const;

const RESOLUTION_OPTIONS = [
  { value: 'SUBDOMAIN', label: 'Subdomínio' },
  { value: 'PATH', label: 'Caminho (Path)' },
  { value: 'CUSTOM_DOMAIN', label: 'Domínio Customizado' },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateTenantInput) => Promise<void>;
  defaultValues?: TenantRow | null;
}

export function TenantForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      subdomain: '',
      domain: '',
      resolutionStrategy: 'SUBDOMAIN',
      status: 'PENDING',
      planId: '',
      maxUsers: undefined,
      maxAuctions: undefined,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: defaultValues?.name ?? '',
      subdomain: defaultValues?.subdomain ?? '',
      domain: defaultValues?.domain ?? '',
      resolutionStrategy: (defaultValues?.resolutionStrategy as CreateTenantInput['resolutionStrategy']) ?? 'SUBDOMAIN',
      status: (defaultValues?.status as CreateTenantInput['status']) ?? 'PENDING',
      planId: defaultValues?.planId ?? '',
      maxUsers: defaultValues?.maxUsers ?? undefined,
      maxAuctions: defaultValues?.maxAuctions ?? undefined,
    });
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="tenant-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Tenant' : 'Novo Tenant'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados do tenant (leiloeiro/organização).' : 'Cadastre um novo tenant na plataforma.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-ai-id="tenant-form">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Nome *</Label>
            <Input
              id="tenant-name"
              {...form.register('name')}
              placeholder="Ex: Leiloeiro ABC"
              data-ai-id="tenant-field-name"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-subdomain">Subdomínio *</Label>
            <Input
              id="tenant-subdomain"
              {...form.register('subdomain')}
              placeholder="ex: leiloeiro-abc"
              data-ai-id="tenant-field-subdomain"
            />
            {form.formState.errors.subdomain && (
              <p className="text-destructive text-xs">{form.formState.errors.subdomain.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-domain">Domínio Customizado</Label>
            <Input
              id="tenant-domain"
              {...form.register('domain')}
              placeholder="leiloeiro.com.br"
              data-ai-id="tenant-field-domain"
            />
          </div>

          <div className="space-y-2">
            <Label>Estratégia de Resolução *</Label>
            <Controller
              control={form.control}
              name="resolutionStrategy"
              render={({ field }) => (
                <Select value={field.value ?? 'SUBDOMAIN'} onValueChange={field.onChange}>
                  <SelectTrigger data-ai-id="tenant-field-resolutionStrategy">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Status *</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select value={field.value ?? 'PENDING'} onValueChange={field.onChange}>
                  <SelectTrigger data-ai-id="tenant-field-status">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tenant-maxUsers">Máx. Usuários</Label>
              <Input
                id="tenant-maxUsers"
                type="number"
                min={1}
                {...form.register('maxUsers')}
                placeholder="100"
                data-ai-id="tenant-field-maxUsers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-maxAuctions">Máx. Leilões</Label>
              <Input
                id="tenant-maxAuctions"
                type="number"
                min={1}
                {...form.register('maxAuctions')}
                placeholder="50"
                data-ai-id="tenant-field-maxAuctions"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ai-id="tenant-form-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              data-ai-id="tenant-form-submit"
            >
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
