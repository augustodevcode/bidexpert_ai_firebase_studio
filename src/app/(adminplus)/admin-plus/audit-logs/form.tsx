/**
 * Formulário de criação/edição de AuditLog.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auditLogSchema, AUDIT_LOG_ACTION_OPTIONS, type AuditLogFormData } from './schema';
import type { AuditLogRow } from './types';
import { listUsersAction } from '../users/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AuditLogFormData) => void;
  defaultValues?: AuditLogRow | null;
}

export function AuditLogForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const form = useForm<AuditLogFormData>({ resolver: zodResolver(auditLogSchema), defaultValues: { userId: '', entityType: '', entityId: '', action: '', changedFields: '', ipAddress: '', userAgent: '' } });
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    listUsersAction({ page: 1, pageSize: 200 }).then(r => { if (r.success && r.data) setUsers(r.data.data.map((u: any) => ({ id: u.id, name: u.name }))); });
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({ userId: defaultValues.userId, entityType: defaultValues.entityType, entityId: defaultValues.entityId, action: defaultValues.action, changedFields: defaultValues.changedFields, ipAddress: defaultValues.ipAddress, userAgent: defaultValues.userAgent });
    } else if (open) {
      form.reset({ userId: '', entityType: '', entityId: '', action: '', changedFields: '', ipAddress: '', userAgent: '' });
    }
  }, [open, defaultValues, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto" data-ai-id="audit-log-form">
        <SheetHeader><SheetTitle>{defaultValues ? 'Editar Log' : 'Novo Log'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Usuário *</Label>
            <Select value={form.watch('userId')} onValueChange={(v) => form.setValue('userId', v)}>
              <SelectTrigger id="userId"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{users.map(u => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.userId && <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="entityType">Tipo de Entidade *</Label>
            <Input id="entityType" {...form.register('entityType')} placeholder="Ex: Auction, Lot, User" />
            {form.formState.errors.entityType && <p className="text-sm text-destructive">{form.formState.errors.entityType.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="entityId">ID da Entidade *</Label>
            <Input id="entityId" {...form.register('entityId')} placeholder="Ex: 123" />
            {form.formState.errors.entityId && <p className="text-sm text-destructive">{form.formState.errors.entityId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="action">Ação *</Label>
            <Select value={form.watch('action')} onValueChange={(v) => form.setValue('action', v)}>
              <SelectTrigger id="action"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{AUDIT_LOG_ACTION_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.action && <p className="text-sm text-destructive">{form.formState.errors.action.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="changedFields">Campos Alterados</Label>
            <Input id="changedFields" {...form.register('changedFields')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ipAddress">IP</Label>
            <Input id="ipAddress" {...form.register('ipAddress')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userAgent">User Agent</Label>
            <Input id="userAgent" {...form.register('userAgent')} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{defaultValues ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
