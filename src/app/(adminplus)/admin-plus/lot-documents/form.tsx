/**
 * Form component for creating/editing LotDocument records.
 */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { lotDocumentSchema } from './schema';
import { createLotDocument, updateLotDocument } from './actions';
import { listLots } from '../lots/actions';
import type { LotDocumentRow } from './types';

type FormValues = z.infer<typeof lotDocumentSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRow?: LotDocumentRow | null;
  onSuccess: () => void;
}

export function LotDocumentForm({ open, onOpenChange, editingRow, onSuccess }: Props) {
  const [lots, setLots] = useState<{ id: string; label: string }[]>([]);
  const isEditing = !!editingRow;

  const form = useForm<FormValues>({
    resolver: zodResolver(lotDocumentSchema),
    defaultValues: { lotId: '', fileName: '', title: '', description: '', fileUrl: '', fileSize: undefined, mimeType: '', displayOrder: 0, isPublic: true },
  });

  useEffect(() => {
    if (!open) return;
    listLots({ page: 1, pageSize: 500 }).then((r) => {
      if (r.success && r.data) setLots((r.data as any).data?.map((l: any) => ({ id: l.id, label: l.title })) ?? []);
    });
  }, [open]);

  useEffect(() => {
    if (open && editingRow) {
      form.reset({
        lotId: editingRow.lotId,
        fileName: editingRow.fileName,
        title: editingRow.title,
        description: editingRow.description ?? '',
        fileUrl: editingRow.fileUrl,
        fileSize: editingRow.fileSize ?? undefined,
        mimeType: editingRow.mimeType ?? '',
        displayOrder: editingRow.displayOrder,
        isPublic: editingRow.isPublic,
      });
    } else if (open) {
      form.reset({ lotId: '', fileName: '', title: '', description: '', fileUrl: '', fileSize: undefined, mimeType: '', displayOrder: 0, isPublic: true });
    }
  }, [open, editingRow, form]);

  async function onSubmit(values: FormValues) {
    const res = isEditing
      ? await updateLotDocument({ id: editingRow!.id, ...values })
      : await createLotDocument(values);
    if (res.success) { toast.success(isEditing ? 'Documento atualizado' : 'Documento criado'); onSuccess(); onOpenChange(false); }
    else toast.error(res.error ?? 'Erro ao salvar');
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="lot-document-form-sheet">
        <SheetHeader><SheetTitle>{isEditing ? 'Editar Documento' : 'Novo Documento'}</SheetTitle></SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" data-ai-id="lot-document-form">
            {/* Lot FK */}
            <FormField control={form.control} name="lotId" render={() => (
              <FormItem>
                <FormLabel>Lote *</FormLabel>
                <Select value={form.watch('lotId')} onValueChange={(v) => form.setValue('lotId', v, { shouldValidate: true })}>
                  <FormControl><SelectTrigger data-ai-id="lot-document-lot-select"><SelectValue placeholder="Selecione o lote" /></SelectTrigger></FormControl>
                  <SelectContent>{lots.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <Separator />

            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Título *</FormLabel>
                <FormControl><Input {...field} data-ai-id="lot-document-title-input" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="fileName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Arquivo *</FormLabel>
                <FormControl><Input {...field} data-ai-id="lot-document-filename-input" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="fileUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>URL do Arquivo *</FormLabel>
                <FormControl><Input {...field} data-ai-id="lot-document-fileurl-input" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Textarea {...field} rows={3} data-ai-id="lot-document-description-input" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="mimeType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo MIME</FormLabel>
                  <FormControl><Input {...field} placeholder="application/pdf" data-ai-id="lot-document-mimetype-input" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="fileSize" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamanho (bytes)</FormLabel>
                  <FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} data-ai-id="lot-document-filesize-input" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="displayOrder" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} data-ai-id="lot-document-displayorder-input" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isPublic" render={({ field }) => (
                <FormItem className="flex items-center gap-2 pt-6">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-ai-id="lot-document-ispublic-switch" /></FormControl>
                  <FormLabel className="!mt-0">Público</FormLabel>
                </FormItem>
              )} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" data-ai-id="lot-document-submit-btn">{isEditing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
