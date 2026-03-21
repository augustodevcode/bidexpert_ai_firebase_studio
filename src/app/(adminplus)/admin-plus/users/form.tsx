/**
 * @fileoverview Formulário de Usuário em Sheet overlay — Admin Plus.
 * Seções: Autenticação, Dados Pessoais, Configuração.
 */
'use client';

import { useEffect, useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from './schema';
import type { UserRow } from './columns';

const STATUS_OPTIONS = [
  { value: 'PENDING_DOCUMENTS', label: 'Pendente Docs' },
  { value: 'PENDING_ANALYSIS', label: 'Em Análise' },
  { value: 'HABILITADO', label: 'Habilitado' },
  { value: 'REJECTED_DOCUMENTS', label: 'Rejeitado' },
  { value: 'BLOCKED', label: 'Bloqueado' },
] as const;

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'PHYSICAL', label: 'Pessoa Física' },
  { value: 'LEGAL', label: 'Pessoa Jurídica' },
  { value: 'DIRECT_SALE_CONSIGNOR', label: 'Comitente' },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateUserInput | UpdateUserInput) => Promise<void>;
  defaultValues?: UserRow | null;
}

export function UserForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = isEdit ? updateUserSchema : createUserSchema;

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      cpf: '',
      cellPhone: '',
      accountType: 'PHYSICAL',
      habilitationStatus: 'PENDING_DOCUMENTS',
      optInMarketing: false,
      roleIds: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      email: defaultValues?.email ?? '',
      password: '',
      fullName: defaultValues?.fullName ?? '',
      cpf: '',
      cellPhone: defaultValues?.cellPhone ?? '',
      accountType: (defaultValues?.accountType as CreateUserInput['accountType']) ?? 'PHYSICAL',
      habilitationStatus: (defaultValues?.habilitationStatus as CreateUserInput['habilitationStatus']) ?? 'PENDING_DOCUMENTS',
      optInMarketing: false,
      roleIds: [],
    });
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="user-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados do usuário.' : 'Cadastre um novo usuário na plataforma.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-ai-id="user-form">
          {/* Autenticação */}
          <div className="space-y-2">
            <Label htmlFor="user-email">E-mail *</Label>
            <Input
              id="user-email"
              type="email"
              {...form.register('email')}
              placeholder="usuario@email.com"
              data-ai-id="user-field-email"
            />
            {form.formState.errors.email && (
              <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
            )}
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="user-password">Senha *</Label>
              <Input
                id="user-password"
                type="password"
                {...form.register('password')}
                placeholder="Mínimo 6 caracteres"
                data-ai-id="user-field-password"
              />
              {form.formState.errors.password && (
                <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>
              )}
            </div>
          )}

          <Separator />

          {/* Dados Pessoais */}
          <div className="space-y-2">
            <Label htmlFor="user-fullName">Nome Completo *</Label>
            <Input
              id="user-fullName"
              {...form.register('fullName')}
              placeholder="João da Silva"
              data-ai-id="user-field-fullName"
            />
            {form.formState.errors.fullName && (
              <p className="text-destructive text-xs">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="user-cpf">CPF</Label>
              <Input
                id="user-cpf"
                {...form.register('cpf')}
                placeholder="000.000.000-00"
                data-ai-id="user-field-cpf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-cellPhone">Celular</Label>
              <Input
                id="user-cellPhone"
                {...form.register('cellPhone')}
                placeholder="(11) 99999-9999"
                data-ai-id="user-field-cellPhone"
              />
            </div>
          </div>

          <Separator />

          {/* Configuração */}
          <div className="space-y-2">
            <Label>Tipo de Conta *</Label>
            <Controller
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <Select value={field.value ?? 'PHYSICAL'} onValueChange={field.onChange}>
                  <SelectTrigger data-ai-id="user-field-accountType">
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
            />
          </div>

          <div className="space-y-2">
            <Label>Status de Habilitação</Label>
            <Controller
              control={form.control}
              name="habilitationStatus"
              render={({ field }) => (
                <Select value={field.value ?? 'PENDING_DOCUMENTS'} onValueChange={field.onChange}>
                  <SelectTrigger data-ai-id="user-field-habilitationStatus">
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              data-ai-id="user-form-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-ai-id="user-form-submit"
            >
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
