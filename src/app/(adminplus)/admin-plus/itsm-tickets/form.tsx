/**
 * Formulário (Sheet) de criação/edição de ITSM_Ticket no Admin Plus.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { itsmTicketSchema, ITSM_STATUS_OPTIONS, ITSM_PRIORITY_OPTIONS, ITSM_CATEGORY_OPTIONS } from './schema';
import type { ItsmTicketFormData } from './schema';
import type { ItsmTicketRow } from './types';
import { listUsersAction } from '../users/actions';

interface ItsmTicketFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ItsmTicketFormData) => Promise<void>;
  defaultValues?: ItsmTicketRow | null;
}

export default function ItsmTicketForm({ open, onOpenChange, onSubmit, defaultValues }: ItsmTicketFormProps) {
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const isEdit = !!defaultValues;

  const form = useForm<ItsmTicketFormData>({
    resolver: zodResolver(itsmTicketSchema),
    defaultValues: { userId: '', title: '', description: '', status: 'ABERTO', priority: 'MEDIA', category: 'OUTRO', assignedToUserId: '', browserInfo: '', screenSize: '', pageUrl: '', userAgent: '' },
  });

  /* Reset on edit */
  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        userId: defaultValues.userId,
        title: defaultValues.title,
        description: defaultValues.description,
        status: defaultValues.status,
        priority: defaultValues.priority,
        category: defaultValues.category,
        assignedToUserId: defaultValues.assignedToUserId || '',
        browserInfo: defaultValues.browserInfo || '',
        screenSize: defaultValues.screenSize || '',
        pageUrl: defaultValues.pageUrl || '',
        userAgent: defaultValues.userAgent || '',
      });
    } else if (open) {
      form.reset({ userId: '', title: '', description: '', status: 'ABERTO', priority: 'MEDIA', category: 'OUTRO', assignedToUserId: '', browserInfo: '', screenSize: '', pageUrl: '', userAgent: '' });
    }
  }, [open, defaultValues, form]);

  /* Load FK — users */
  useEffect(() => {
    if (!open) return;
    listUsersAction({ page: 1, pageSize: 500 }).then((res: any) => {
      if (res?.success && res.data?.data) setUsers(res.data.data.map((u: any) => ({ id: u.id, name: u.name || u.email })));
    });
  }, [open]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try { await onSubmit(data); onOpenChange(false); } catch { toast.error('Erro ao salvar ticket.'); }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="itsm-ticket-form-sheet">
        <SheetHeader><SheetTitle>{isEdit ? 'Editar Ticket' : 'Novo Ticket'}</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4" data-ai-id="itsm-ticket-form">
          {/* Solicitante */}
          <div className="space-y-1">
            <Label htmlFor="userId">Solicitante *</Label>
            <Select value={form.watch('userId')} onValueChange={(v) => form.setValue('userId', v)}>
              <SelectTrigger id="userId" data-ai-id="itsm-ticket-userId-select"><SelectValue placeholder="Selecione o solicitante" /></SelectTrigger>
              <SelectContent>{users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.userId && <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>}
          </div>

          {/* Título */}
          <div className="space-y-1">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" {...form.register('title')} data-ai-id="itsm-ticket-title-input" />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea id="description" {...form.register('description')} rows={4} data-ai-id="itsm-ticket-description-input" />
            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
          </div>

          <Separator />

          {/* Status + Priority + Category */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="status">Status *</Label>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v)}>
                <SelectTrigger id="status" data-ai-id="itsm-ticket-status-select"><SelectValue /></SelectTrigger>
                <SelectContent>{ITSM_STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="priority">Prioridade *</Label>
              <Select value={form.watch('priority')} onValueChange={(v) => form.setValue('priority', v)}>
                <SelectTrigger id="priority" data-ai-id="itsm-ticket-priority-select"><SelectValue /></SelectTrigger>
                <SelectContent>{ITSM_PRIORITY_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={form.watch('category')} onValueChange={(v) => form.setValue('category', v)}>
                <SelectTrigger id="category" data-ai-id="itsm-ticket-category-select"><SelectValue /></SelectTrigger>
                <SelectContent>{ITSM_CATEGORY_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-1">
            <Label htmlFor="assignedToUserId">Responsável</Label>
            <Select value={form.watch('assignedToUserId') || '_none_'} onValueChange={(v) => form.setValue('assignedToUserId', v === '_none_' ? '' : v)}>
              <SelectTrigger id="assignedToUserId" data-ai-id="itsm-ticket-assignedTo-select"><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">Nenhum</SelectItem>
                {users.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Informações de diagnóstico */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="browserInfo">Navegador</Label>
              <Input id="browserInfo" {...form.register('browserInfo')} data-ai-id="itsm-ticket-browserInfo-input" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="screenSize">Resolução</Label>
              <Input id="screenSize" {...form.register('screenSize')} data-ai-id="itsm-ticket-screenSize-input" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pageUrl">URL da Página</Label>
            <Input id="pageUrl" {...form.register('pageUrl')} data-ai-id="itsm-ticket-pageUrl-input" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="userAgent">User Agent</Label>
            <Input id="userAgent" {...form.register('userAgent')} data-ai-id="itsm-ticket-userAgent-input" />
          </div>

          <SheetFooter>
            <Button type="submit" data-ai-id="itsm-ticket-form-submit">{isEdit ? 'Salvar' : 'Criar'}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
