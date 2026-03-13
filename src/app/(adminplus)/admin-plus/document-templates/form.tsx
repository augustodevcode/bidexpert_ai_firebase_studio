/**
 * Formulário de criação/edição de DocumentTemplate.
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { documentTemplateSchema, DOCUMENT_TEMPLATE_TYPE_OPTIONS, type DocumentTemplateFormData } from './schema';
import type { DocumentTemplateRow } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DocumentTemplateFormData) => void;
  defaultValues?: DocumentTemplateRow | null;
}

export function DocumentTemplateForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const form = useForm<DocumentTemplateFormData>({ resolver: zodResolver(documentTemplateSchema), defaultValues: { name: '', type: 'WINNING_BID_TERM', content: '' } });

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({ name: defaultValues.name, type: defaultValues.type as any, content: defaultValues.content ?? '' });
    } else if (open) {
      form.reset({ name: '', type: 'WINNING_BID_TERM', content: '' });
    }
  }, [open, defaultValues, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto" data-ai-id="document-template-form">
        <SheetHeader><SheetTitle>{defaultValues ? 'Editar Template' : 'Novo Template'}</SheetTitle></SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...form.register('name')} aria-invalid={!!form.formState.errors.name} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v as any)}>
              <SelectTrigger id="type"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                {DOCUMENT_TEMPLATE_TYPE_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
              </SelectContent>
            </Select>
            {form.formState.errors.type && <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>}
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea id="content" {...form.register('content')} rows={10} placeholder="Conteúdo do template (HTML/Markdown)" />
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
