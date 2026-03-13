/**
 * @fileoverview Formulário de MediaItem — Admin Plus.
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
import { Separator } from '@/components/ui/separator';
import { mediaItemSchema, type MediaItemSchema } from './schema';
import type { MediaItemRow } from './types';

interface MediaItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MediaItemSchema) => Promise<void>;
  defaultValues?: MediaItemRow | null;
}

export function MediaItemForm({ open, onOpenChange, onSubmit, defaultValues }: MediaItemFormProps) {
  const isEdit = !!defaultValues;

  const form = useForm<MediaItemSchema>({
    resolver: zodResolver(mediaItemSchema),
    defaultValues: {
      fileName: '',
      storagePath: '',
      urlOriginal: '',
      urlThumbnail: '',
      urlMedium: '',
      urlLarge: '',
      mimeType: '',
      sizeBytes: undefined,
      altText: '',
      caption: '',
      description: '',
      title: '',
      dataAiHint: '',
    },
  });

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        fileName: defaultValues.fileName ?? '',
        storagePath: defaultValues.storagePath ?? '',
        urlOriginal: defaultValues.urlOriginal ?? '',
        urlThumbnail: defaultValues.urlThumbnail ?? '',
        urlMedium: defaultValues.urlMedium ?? '',
        urlLarge: defaultValues.urlLarge ?? '',
        mimeType: defaultValues.mimeType ?? '',
        sizeBytes: defaultValues.sizeBytes ?? undefined,
        altText: defaultValues.altText ?? '',
        caption: defaultValues.caption ?? '',
        description: defaultValues.description ?? '',
        title: defaultValues.title ?? '',
        dataAiHint: defaultValues.dataAiHint ?? '',
      });
    } else if (open) {
      form.reset();
    }
  }, [open, defaultValues, form]);

  const handleFormSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-ai-id="media-item-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Mídia' : 'Nova Mídia'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados da mídia.' : 'Preencha os dados da nova mídia.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleFormSubmit} className="mt-6 space-y-4" data-ai-id="media-item-form">
          {/* Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="mi-fileName">Nome do Arquivo *</Label>
            <Input id="mi-fileName" {...form.register('fileName')} data-ai-id="media-item-field-fileName" />
            {form.formState.errors.fileName && (
              <p className="text-destructive text-xs">{form.formState.errors.fileName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mi-mimeType">Tipo MIME *</Label>
            <Input id="mi-mimeType" {...form.register('mimeType')} placeholder="image/jpeg" data-ai-id="media-item-field-mimeType" />
            {form.formState.errors.mimeType && (
              <p className="text-destructive text-xs">{form.formState.errors.mimeType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mi-sizeBytes">Tamanho (bytes)</Label>
            <Input id="mi-sizeBytes" type="number" {...form.register('sizeBytes')} data-ai-id="media-item-field-sizeBytes" />
          </div>

          <Separator />

          {/* URLs */}
          <div className="space-y-2">
            <Label htmlFor="mi-storagePath">Caminho de Armazenamento *</Label>
            <Input id="mi-storagePath" {...form.register('storagePath')} data-ai-id="media-item-field-storagePath" />
            {form.formState.errors.storagePath && (
              <p className="text-destructive text-xs">{form.formState.errors.storagePath.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mi-urlOriginal">URL Original *</Label>
            <Input id="mi-urlOriginal" {...form.register('urlOriginal')} data-ai-id="media-item-field-urlOriginal" />
            {form.formState.errors.urlOriginal && (
              <p className="text-destructive text-xs">{form.formState.errors.urlOriginal.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mi-urlThumbnail">URL Thumbnail</Label>
            <Input id="mi-urlThumbnail" {...form.register('urlThumbnail')} data-ai-id="media-item-field-urlThumbnail" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mi-urlMedium">URL Média</Label>
            <Input id="mi-urlMedium" {...form.register('urlMedium')} data-ai-id="media-item-field-urlMedium" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mi-urlLarge">URL Grande</Label>
            <Input id="mi-urlLarge" {...form.register('urlLarge')} data-ai-id="media-item-field-urlLarge" />
          </div>

          <Separator />

          {/* Metadados */}
          <div className="space-y-2">
            <Label htmlFor="mi-title">Título</Label>
            <Input id="mi-title" {...form.register('title')} data-ai-id="media-item-field-title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mi-altText">Texto Alternativo</Label>
            <Input id="mi-altText" {...form.register('altText')} data-ai-id="media-item-field-altText" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mi-caption">Legenda</Label>
            <Input id="mi-caption" {...form.register('caption')} data-ai-id="media-item-field-caption" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mi-description">Descrição</Label>
            <Textarea id="mi-description" {...form.register('description')} rows={3} data-ai-id="media-item-field-description" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mi-dataAiHint">AI Hint (placeholder)</Label>
            <Input id="mi-dataAiHint" {...form.register('dataAiHint')} placeholder="office building" data-ai-id="media-item-field-dataAiHint" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-ai-id="media-item-form-cancel">
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} data-ai-id="media-item-form-submit">
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
