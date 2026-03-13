/**
 * Formulário de criação/edição de Subscriber no Admin Plus.
 */
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { subscriberSchema, type SubscriberFormData } from './schema';
import type { SubscriberRow } from './types';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (data: SubscriberFormData) => void; initialData?: SubscriberRow | null; }

export function SubscriberForm({ open, onOpenChange, onSubmit, initialData }: Props) {
  const form = useForm<SubscriberFormData>({ resolver: zodResolver(subscriberSchema), defaultValues: { email: '', name: '', phone: '', preferences: '' } });

  useEffect(() => {
    if (open && initialData) {
      form.reset({ email: initialData.email, name: initialData.name ?? '', phone: initialData.phone ?? '', preferences: initialData.preferences ?? '' });
    } else if (open) {
      form.reset({ email: '', name: '', phone: '', preferences: '' });
    }
  }, [open, initialData, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="subscriber-form-sheet">
        <SheetHeader><SheetTitle>{initialData ? 'Editar Assinante' : 'Novo Assinante'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="subscriber-form">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" {...form.register('email')} data-ai-id="subscriber-email-input" />
            {form.formState.errors.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register('name')} data-ai-id="subscriber-name-input" />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" {...form.register('phone')} data-ai-id="subscriber-phone-input" />
          </div>
          <div>
            <Label htmlFor="preferences">Preferências (JSON)</Label>
            <Textarea id="preferences" rows={4} {...form.register('preferences')} placeholder='{"newsletter": true}' data-ai-id="subscriber-preferences-input" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" data-ai-id="subscriber-submit-btn">{initialData ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
