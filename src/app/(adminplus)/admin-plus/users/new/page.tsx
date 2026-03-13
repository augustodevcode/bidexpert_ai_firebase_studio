/**
 * @fileoverview Formulário de criação de Usuário no Admin Plus.
 * Seções: Autenticação, Dados Pessoais, Configuração com perfis, Endereço, Dados Empresariais.
 */
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { createUserSchema, type CreateUserInput } from '../schema';
import { createUserAction } from '../actions';
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

export default function CreateUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
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
      const result = await listRolesAction({});
      if (result.success && result.data) {
        setRoles(
          result.data.data.map((r: { id: string; name: string }) => ({
            id: r.id,
            name: r.name,
          })),
        );
      }
    })();
  }, []);

  const selectedRoleIds = form.watch('roleIds') ?? [];

  const toggleRole = (roleId: string) => {
    const current = form.getValues('roleIds') ?? [];
    const next = current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : [...current, roleId];
    form.setValue('roleIds', next, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateUserInput) => {
    setIsSubmitting(true);
    const result = await createUserAction(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Usuário criado com sucesso');
      router.push('/admin-plus/users');
    } else {
      toast.error(result.error ?? 'Erro ao criar usuário');
    }
  };

  return (
    <>
      <PageHeader
        title="Novo Usuário"
        description="Preencha os dados para criar um novo usuário."
        data-ai-id="users-new-page-header"
      />

      <CrudFormShell
        form={form}
        onSubmit={onSubmit}
        onCancel={() => router.push('/admin-plus/users')}
        isSubmitting={isSubmitting}
        submitLabel="Criar Usuário"
        data-ai-id="users-new-form"
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
                autoFocus
                data-ai-id="user-new-field-email"
              />
            )}
          </Field>

          <Field name="password" label="Senha" required>
            {({ field }) => (
              <Input
                {...field}
                type="password"
                value={field.value as string}
                placeholder="Mínimo 6 caracteres"
                data-ai-id="user-new-field-password"
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
                data-ai-id="user-new-field-fullName"
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
                data-ai-id="user-new-field-cpf"
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
                data-ai-id="user-new-field-cellPhone"
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
                <SelectTrigger data-ai-id="user-new-field-accountType">
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
                <SelectTrigger data-ai-id="user-new-field-habilitationStatus">
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
                    id="optInMarketing"
                    data-ai-id="user-new-field-optInMarketing"
                  />
                  <Label htmlFor="optInMarketing" className="text-sm cursor-pointer">
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
            data-ai-id="user-new-field-roleIds"
          >
            {roles.length === 0 && (
              <span className="text-sm text-muted-foreground">Carregando perfis...</span>
            )}
            {roles.map((role) => (
              <div key={role.id} className="flex items-center gap-1.5">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={selectedRoleIds.includes(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                  data-ai-id={`user-new-role-checkbox-${role.name}`}
                />
                <Label htmlFor={`role-${role.id}`} className="text-sm cursor-pointer">
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
                data-ai-id="user-new-field-zipCode"
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
                data-ai-id="user-new-field-street"
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
                data-ai-id="user-new-field-number"
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
                data-ai-id="user-new-field-complement"
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
                data-ai-id="user-new-field-neighborhood"
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
                data-ai-id="user-new-field-city"
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
                data-ai-id="user-new-field-state"
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
                    data-ai-id="user-new-field-razaoSocial"
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
                    data-ai-id="user-new-field-cnpj"
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
                    data-ai-id="user-new-field-inscricaoEstadual"
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
                    data-ai-id="user-new-field-website"
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
