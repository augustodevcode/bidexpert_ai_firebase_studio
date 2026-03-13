/**
 * Formulário de criação/edição de Notification (Notificações).
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { notificationSchema } from './schema';
import { createNotification, updateNotification } from './actions';
import { listUsersAction } from '../users/actions';
import { listLots } from '../lots/actions';
import { listAuctions } from '../auctions/actions';
import { toast } from 'sonner';
import type { NotificationRow } from './types';

type FormData = z.infer<typeof notificationSchema>;

interface Props { open: boolean; onOpenChange: (o: boolean) => void; editData?: NotificationRow | null; onSuccess: () => void; }

export function NotificationForm({ open, onOpenChange, editData, onSuccess }: Props) {
  const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
  const [lots, setLots] = useState<{ id: string; label: string }[]>([]);
  const [auctions, setAuctions] = useState<{ id: string; label: string }[]>([]);

  const form = useForm<FormData>({ resolver: zodResolver(notificationSchema), defaultValues: { userId: '', message: '', link: '', isRead: false, lotId: '', auctionId: '' } });

  useEffect(() => {
    if (!open) return;
    listUsersAction({ page: 1, pageSize: 500 }).then(r => { if (r.success) setUsers(r.data.data.map((u: any) => ({ id: u.id, label: u.fullName || u.email }))); });
    listLots({ page: 1, pageSize: 500 }).then(r => { if (r.success) setLots(r.data.data.map((l: any) => ({ id: l.id, label: l.title || `#${l.id}` }))); });
    listAuctions({ page: 1, pageSize: 500 }).then(r => { if (r.success) setAuctions(r.data.data.map((a: any) => ({ id: a.id, label: a.title || `#${a.id}` }))); });
  }, [open]);

  useEffect(() => {
    if (open && editData) {
      form.reset({ userId: editData.userId, message: editData.message, link: editData.link || '', isRead: editData.isRead, lotId: editData.lotId || '', auctionId: editData.auctionId || '' });
    } else if (open) {
      form.reset({ userId: '', message: '', link: '', isRead: false, lotId: '', auctionId: '' });
    }
  }, [open, editData, form]);

  const onSubmit = async (data: FormData) => {
    const res = editData ? await updateNotification({ ...data, id: editData.id }) : await createNotification(data);
    if (res.success) { toast.success(editData ? 'Notificação atualizada' : 'Notificação criada'); onSuccess(); onOpenChange(false); } else { toast.error(res.error || 'Erro'); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="notification-form-sheet">
        <SheetHeader><SheetTitle>{editData ? 'Editar Notificação' : 'Nova Notificação'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="notification-form">
          <div className="space-y-2">
            <Label>Usuário *</Label>
            <Select value={form.watch('userId')} onValueChange={v => form.setValue('userId', v)}>
              <SelectTrigger data-ai-id="notification-user-select"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>)}</SelectContent>
            </Select>
            {form.formState.errors.userId && <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Mensagem *</Label>
            <Textarea {...form.register('message')} rows={3} data-ai-id="notification-message-textarea" />
            {form.formState.errors.message && <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Link</Label>
            <Input {...form.register('link')} placeholder="https://..." data-ai-id="notification-link-input" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.watch('isRead')} onCheckedChange={v => form.setValue('isRead', v)} data-ai-id="notification-is-read-switch" />
            <Label>Lida</Label>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lote (opcional)</Label>
              <Select value={form.watch('lotId') || ''} onValueChange={v => form.setValue('lotId', v)}>
                <SelectTrigger data-ai-id="notification-lot-select"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>{lots.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Leilão (opcional)</Label>
              <Select value={form.watch('auctionId') || ''} onValueChange={v => form.setValue('auctionId', v)}>
                <SelectTrigger data-ai-id="notification-auction-select"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>{auctions.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting} data-ai-id="notification-submit-btn">{editData ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
