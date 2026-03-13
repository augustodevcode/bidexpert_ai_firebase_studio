/**
 * Formulário de criação/edição de BidderNotification.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bidderNotificationSchema, BIDDER_NOTIFICATION_TYPE_OPTIONS, type BidderNotificationFormData } from './schema';
import type { BidderNotificationRow } from './types';
import { listBidderProfiles } from '../bidder-profiles/actions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BidderNotificationFormData) => void;
  defaultValues?: BidderNotificationRow | null;
}

export function BidderNotificationForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const form = useForm<BidderNotificationFormData>({ resolver: zodResolver(bidderNotificationSchema), defaultValues: { bidderId: '', type: '', title: '', message: '', data: '', isRead: false } });
  const [bidders, setBidders] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    listBidderProfiles({ page: 1, pageSize: 200 }).then((r: any) => { if (r.success && r.data) setBidders(r.data.data.map((b: any) => ({ id: b.id, name: b.fullName || b.userName || b.id }))); });
  }, [open]);

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({ bidderId: defaultValues.bidderId, type: defaultValues.type, title: defaultValues.title, message: defaultValues.message, data: defaultValues.data, isRead: defaultValues.isRead });
    } else if (open) {
      form.reset({ bidderId: '', type: '', title: '', message: '', data: '', isRead: false });
    }
  }, [open, defaultValues, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto" data-ai-id="bidder-notification-form">
        <SheetHeader><SheetTitle>{defaultValues ? 'Editar Notificação' : 'Nova Notificação'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="bidderId">Arrematante *</Label>
            <Select value={form.watch('bidderId')} onValueChange={(v) => form.setValue('bidderId', v)}>
              <SelectTrigger id="bidderId"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{bidders.map(b => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.bidderId && <p className="text-sm text-destructive">{form.formState.errors.bidderId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v)}>
              <SelectTrigger id="type"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{BIDDER_NOTIFICATION_TYPE_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.type && <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" {...form.register('title')} />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea id="message" {...form.register('message')} rows={3} />
            {form.formState.errors.message && <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Dados (JSON)</Label>
            <Textarea id="data" {...form.register('data')} rows={2} placeholder='{"key":"value"}' />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="isRead" checked={form.watch('isRead')} onCheckedChange={(v) => form.setValue('isRead', v)} />
            <Label htmlFor="isRead">Lida</Label>
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
