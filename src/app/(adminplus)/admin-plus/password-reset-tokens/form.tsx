/**
 * @fileoverview Formulário de criação para PasswordResetToken — Admin Plus.
 * Tokens são efêmeros; formulário apenas para criação (sem edição).
 */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CrudFormShell } from '@/components/admin-plus/crud-form-shell';
import { Field } from '@/components/admin-plus/field';
import { passwordResetTokenSchema } from './schema';
import type { PasswordResetTokenRow } from './types';

type FormValues = z.infer<typeof passwordResetTokenSchema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: FormValues) => Promise<void>;
  defaultValues?: Partial<PasswordResetTokenRow> | null;
}

export function PasswordResetTokenForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(passwordResetTokenSchema),
    defaultValues: {
      email: defaultValues?.email ?? '',
      token: defaultValues?.token ?? '',
      expires: defaultValues?.expires ? defaultValues.expires.slice(0, 16) : '',
    },
  });

  return (
    <CrudFormShell
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title="Novo Token de Reset"
      data-ai-id="password-reset-token-form"
    >
      <Field label="Email" name="email" type="email" form={form} required data-ai-id="prt-field-email" />
      <Field label="Token" name="token" form={form} required data-ai-id="prt-field-token" />
      <Field label="Expira em" name="expires" type="datetime-local" form={form} required data-ai-id="prt-field-expires" />
    </CrudFormShell>
  );
}
