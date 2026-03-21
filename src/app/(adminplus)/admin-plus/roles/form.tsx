/**
 * @fileoverview Formulário de Perfil de Acesso (Role) em Sheet overlay — Admin Plus.
 */
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createRoleSchema, type CreateRoleInput } from './schema';

interface RoleRow {
  id: string;
  name: string;
  description?: string | null;
  permissions?: unknown;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateRoleInput) => Promise<void>;
  defaultValues?: RoleRow | null;
}

export function RoleForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '', permissions: '' },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      permissions: defaultValues?.permissions
        ? JSON.stringify(defaultValues.permissions, null, 2)
        : '',
    });
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto" data-ai-id="role-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Perfil' : 'Novo Perfil'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados do perfil de acesso.' : 'Cadastre um novo perfil de acesso no sistema.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-ai-id="role-form">
          <div className="space-y-2">
            <Label htmlFor="role-name">Nome *</Label>
            <Input
              id="role-name"
              {...form.register('name')}
              placeholder="Ex: Administrador"
              data-ai-id="role-field-name"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">Descrição</Label>
            <Textarea
              id="role-description"
              {...form.register('description')}
              placeholder="Descreva as responsabilidades deste perfil"
              rows={3}
              data-ai-id="role-field-description"
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-xs">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-permissions">Permissões (JSON)</Label>
            <Textarea
              id="role-permissions"
              {...form.register('permissions')}
              placeholder='["read:auctions", "create:bids"]'
              rows={5}
              className="font-mono text-xs"
              data-ai-id="role-field-permissions"
            />
            {form.formState.errors.permissions && (
              <p className="text-destructive text-xs">{form.formState.errors.permissions.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ai-id="role-form-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              data-ai-id="role-form-submit"
            >
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
