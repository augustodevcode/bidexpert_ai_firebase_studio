/**
 * @fileoverview Formulário de edição de Usuário no Admin Plus.
 * Carrega dados do usuário e lista de perfis em paralelo.
 * Seções: Autenticação, Dados Pessoais, Configuração + Perfis, Endereço, Dados Empresariais.
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/admin-plus/forms/page-header';
import { CrudFormShell } from '@/components/admin-plus/forms/crud-form-shell';
import { Field } from '@/components/admin-plus/forms/field';
import { updateUserSchema, type UpdateUserInput } from '../schema';
import { getUserByIdAction, updateUserAction } from '../actions';
import { listRolesAction } from '../../roles/actions';

const STATUS_OPTIONS = [
  { value: 'PENDING_DOCUMENTS', label: 'Pendente Docs' },
  { value: 'PENDING_ANALYSIS', label: 'Em Análise' },
  { value: 'HABILITADO', label: 'Habilitado' },
  { value: 'REJECTED_DOCUMENTS', label: 'Rejeitado' },
  { value: 'BLOCKED', label: 'Bloqueado' },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'PHYSICAL', label: 'Pessoa Física' },
  { value: 'LEGAL', label: 'Pessoa Jurídica' },
  { value: 'DIRECT_SALE_CONSIGNOR', label: 'Comitente' },
];

interface RoleOption {
  id: string;
  name: string;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      cpf: null,
      cellPhone: null,
      accountType: 'PHYSICAL',
      habilitationStatus: 'PENDING_DOCUMENTS',
      optInMarketing: false,
      roleIds: [],
      zipCode: null,
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
      razaoSocial: null,
      cnpj: null,
      inscricaoEstadual: null,
      website: null,
    },
  });

  const watchAccountType = form.watch('accountType');

  useEffect(() => {
    (async () => {
      const [userResult, rolesResult] = await Promise.all([
        getUserByIdAction({ id }),
        listRolesAction({}),
      ]);

      if (rolesResult.success && rolesResult.data) {
        setRoles(
          rolesResult.data.data.map((r: { id: string; name: string }) => ({
            id: r.id,
            name: r.name,
          })),
        );
      }

      if (userResult.success && userResult.data) {
        const u = userResult.data;
        form.reset({
          email: u.email ?? '',
          password: '',
          fullName: u.fullName ?? '',
          cpf: u.cpf ?? null,
          cellPhone: u.cellPhone ?? null,
          accountType: (u.accountType as UpdateUserInput['accountType']) ?? 'PHYSICAL',
          habilitationStatus:
            (u.habilitationStatus as UpdateUserInput['habilitationStatus']) ?? 'PENDING_DOCUMENTS',
          optInMarketing: u.optInMarketing ?? false,
          roleIds: u.roleIds ?? [],
          zipCode: u.zipCode ?? null,
          street: u.street ?? null,
          number: u.number ?? null,
          complement: u.complement ?? null,
          neighborhood: u.neighborhood ?? null,
          city: u.city ?? null,
          state: u.state ?? null,
          razaoSocial: u.razaoSocial ?? null,
          cnpj: u.cnpj ?? null,
          inscricaoEstadual: u.inscricaoEstadual ?? null,
          website: u.website ?? null,
        });
      } else {
        toast.error('Usuário não encontrado');
        router.push('/admin-plus/users');
      }

      setIsLoading(false);
    })();
  }, [id, form, router]);

  const selectedRoleIds = form.watch('roleIds') ?? [];

  const toggleRole = (roleId: string) => {
    const current = form.getValues('roleIds') ?? [];
    const next = current.includes(roleId)
      ? current.filter((rid) => rid !== roleId)
      : [...current, roleId];
    form.setValue('roleIds', next, { shouldValidate: true });
  };

  const onSubmit = async (data: UpdateUserInput) => {
    setIsSubmitting(true);
    const result = await updateUserAction({ id, data });
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Usuário atualizado com sucesso');
      router.push('/admin-plus/users');
    } else {
      toast.error(result.error ?? 'Erro ao atualizar usuário');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-ai-id="users-edit-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Editar Usuário"
        description="Altere os campos desejados e salve."
        data-ai-id="users-edit-page-header"
      />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/users')}
        isSubmitting={isSubmitting}
        submitLabel="Salvar Alterações"
        data-ai-id="users-edit-form"
      >
        {/* Seção: Autenticação */}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Autenticação
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="email" label="Email" required>
            {({ field }) => (
              <Input
                {...field}
                type="email"
                value={field.value as string}
                placeholder="usuario@empresa.com"
                data-ai-id="user-edit-field-email"
              />
            )}
          </Field>

          <Field name="password" label="Senha">
            {({ field }) => (
              <Input
                {...field}
                type="password"
                value={field.value as string}
                placeholder="Deixe vazio para manter a atual"
                data-ai-id="user-edit-field-password"
              />
            )}
          </Field>
        </div>

        <Separator />

        {/* Seção: Dados Pessoais */}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Dados Pessoais
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="fullName" label="Nome Completo" required>
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string}
                placeholder="Nome completo"
                data-ai-id="user-edit-field-fullName"
              />
            )}
          </Field>

          <Field name="cpf" label="CPF">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="000.000.000-00"
                data-ai-id="user-edit-field-cpf"
              />
            )}
          </Field>

          <Field name="cellPhone" label="Celular">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="(00) 00000-0000"
                data-ai-id="user-edit-field-cellPhone"
              />
            )}
          </Field>
        </div>

        <Separator />

        {/* Seção: Configuração */}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Configuração
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="accountType" label="Tipo de Conta">
            {({ field }) => (
              <Select value={field.value as string} onValueChange={field.onChange}>
                <SelectTrigger data-ai-id="user-edit-field-accountType">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          <Field name="habilitationStatus" label="Habilitação">
            {({ field }) => (
              <Select value={field.value as string} onValueChange={field.onChange}>
                <SelectTrigger data-ai-id="user-edit-field-habilitationStatus">
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
          </Field>

          <div className="flex items-end pb-2">
            <Field name="optInMarketing" label="">
              {({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={field.value as boolean}
                    onCheckedChange={field.onChange}
                    id="optInMarketingEdit"
                    data-ai-id="user-edit-field-optInMarketing"
                  />
                  <Label htmlFor="optInMarketingEdit" className="text-sm cursor-pointer">
                    Aceita marketing
                  </Label>
                </div>
              )}
            </Field>
          </div>
        </div>

        {/* Perfis (Roles) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Perfis</Label>
          <div
            className="flex flex-wrap gap-3 rounded-md border p-3"
            role="group"
            aria-label="Seleção de perfis"
            data-ai-id="user-edit-field-roleIds"
          >
            {roles.length === 0 && (
              <span className="text-sm text-muted-foreground">Carregando perfis...</span>
            )}
            {roles.map((role) => (
              <div key={role.id} className="flex items-center gap-1.5">
                <Checkbox
                  id={`role-edit-${role.id}`}
                  checked={selectedRoleIds.includes(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                  data-ai-id={`user-edit-role-checkbox-${role.name}`}
                />
                <Label htmlFor={`role-edit-${role.id}`} className="text-sm cursor-pointer">
                  {role.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Seção: Endereço */}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Endereço
        </h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field name="zipCode" label="CEP">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="00000-000"
                data-ai-id="user-edit-field-zipCode"
              />
            )}
          </Field>

          <Field name="street" label="Rua">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="Rua / Avenida"
                data-ai-id="user-edit-field-street"
              />
            )}
          </Field>

          <Field name="number" label="Número">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="Nº"
                data-ai-id="user-edit-field-number"
              />
            )}
          </Field>

          <Field name="complement" label="Complemento">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="Apto, Sala"
                data-ai-id="user-edit-field-complement"
              />
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="neighborhood" label="Bairro">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="Bairro"
                data-ai-id="user-edit-field-neighborhood"
              />
            )}
          </Field>

          <Field name="city" label="Cidade">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="Cidade"
                data-ai-id="user-edit-field-city"
              />
            )}
          </Field>

          <Field name="state" label="Estado">
            {({ field }) => (
              <Input
                {...field}
                value={field.value as string ?? ''}
                onChange={field.onChange}
                placeholder="UF"
                data-ai-id="user-edit-field-state"
              />
            )}
          </Field>
        </div>

        {/* Seção: Dados Empresariais (conditional) */}
        {watchAccountType === 'LEGAL' && (
          <>
            <Separator />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Dados Empresariais
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="razaoSocial" label="Razão Social">
                {({ field }) => (
                  <Input
                    {...field}
                    value={field.value as string ?? ''}
                    onChange={field.onChange}
                    placeholder="Razão Social"
                    data-ai-id="user-edit-field-razaoSocial"
                  />
                )}
              </Field>

              <Field name="cnpj" label="CNPJ">
                {({ field }) => (
                  <Input
                    {...field}
                    value={field.value as string ?? ''}
                    onChange={field.onChange}
                    placeholder="00.000.000/0000-00"
                    data-ai-id="user-edit-field-cnpj"
                  />
                )}
              </Field>

              <Field name="inscricaoEstadual" label="Inscrição Estadual">
                {({ field }) => (
                  <Input
                    {...field}
                    value={field.value as string ?? ''}
                    onChange={field.onChange}
                    placeholder="Inscrição Estadual"
                    data-ai-id="user-edit-field-inscricaoEstadual"
                  />
                )}
              </Field>

              <Field name="website" label="Website">
                {({ field }) => (
                  <Input
                    {...field}
                    value={field.value as string ?? ''}
                    onChange={field.onChange}
                    placeholder="https://empresa.com.br"
                    data-ai-id="user-edit-field-website"
                  />
                )}
              </Field>
            </div>
          </>
        )}
      </CrudFormShell>
    </>
  );
}
