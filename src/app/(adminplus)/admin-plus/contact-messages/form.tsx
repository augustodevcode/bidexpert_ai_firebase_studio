/**
 * Formulário de criação/edição de ContactMessage (Mensagens de Contato).
 */
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { contactMessageSchema } from './schema';
import { createContactMessage, updateContactMessage } from './actions';
import { toast } from 'sonner';
import type { ContactMessageRow } from './types';

type FormData = z.infer<typeof contactMessageSchema>;

interface Props { open: boolean; onOpenChange: (o: boolean) => void; editData?: ContactMessageRow | null; onSuccess: () => void; }

export function ContactMessageForm({ open, onOpenChange, editData, onSuccess }: Props) {
  const form = useForm<FormData>({ resolver: zodResolver(contactMessageSchema), defaultValues: { name: '', email: '', phone: '', subject: '', message: '', isRead: false } });

  useEffect(() => {
    if (open && editData) {
      form.reset({ name: editData.name, email: editData.email, phone: editData.phone || '', subject: editData.subject || '', message: editData.message, isRead: editData.isRead });
    } else if (open) {
      form.reset({ name: '', email: '', phone: '', subject: '', message: '', isRead: false });
    }
  }, [open, editData, form]);

  const onSubmit = async (data: FormData) => {
    const res = editData ? await updateContactMessage({ ...data, id: editData.id }) : await createContactMessage(data);
    if (res.success) { toast.success(editData ? 'Mensagem atualizada' : 'Mensagem criada'); onSuccess(); onOpenChange(false); } else { toast.error(res.error || 'Erro'); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="contact-message-form-sheet">
        <SheetHeader><SheetTitle>{editData ? 'Editar Mensagem' : 'Nova Mensagem'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="contact-message-form">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input {...form.register('name')} data-ai-id="contact-message-name-input" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input {...form.register('email')} type="email" data-ai-id="contact-message-email-input" />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input {...form.register('phone')} data-ai-id="contact-message-phone-input" />
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input {...form.register('subject')} data-ai-id="contact-message-subject-input" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mensagem *</Label>
            <Textarea {...form.register('message')} rows={4} data-ai-id="contact-message-message-textarea" />
            {form.formState.errors.message && <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.watch('isRead')} onCheckedChange={v => form.setValue('isRead', v)} data-ai-id="contact-message-is-read-switch" />
            <Label>Lida</Label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting} data-ai-id="contact-message-submit-btn">{editData ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
