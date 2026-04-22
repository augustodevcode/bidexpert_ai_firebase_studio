/**
 * @fileoverview Campo de formulário para upload e gestão de documentos genéricos de leilão.
 */

'use client';

import * as React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { AuctionFormValues } from '@/app/admin/auctions/auction-form-schema';
import { ArrowDown, ArrowUp, ExternalLink, Eye, FileText, Loader2, Trash2, UploadCloud } from 'lucide-react';

function fileNameToTitle(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

export function AuctionDocumentsField() {
  const { control, setValue } = useFormContext<AuctionFormValues>();
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const { fields, append, remove, move } = useFieldArray({ control, name: 'documents' });

  const refreshDisplayOrder = React.useCallback(() => {
    const values = control._formValues.documents ?? [];
    values.forEach((_: unknown, index: number) => {
      setValue(`documents.${index}.displayOrder`, index, { shouldDirty: true, shouldValidate: false });
    });
  }, [control._formValues.documents, setValue]);

  const handleFilesSelected = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFiles.length) {
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/upload/auction-document', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !Array.isArray(result.documents)) {
        throw new Error(result.message || 'Falha ao enviar documentos.');
      }

      result.documents.forEach((document: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }, index: number) => {
        append({
          fileName: document.fileName,
          title: fileNameToTitle(document.fileName),
          description: '',
          fileUrl: document.fileUrl,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          displayOrder: fields.length + index,
          isPublic: true,
        });
      });

      if (result.errors?.length) {
        toast({
          title: 'Upload parcial concluído',
          description: result.errors.map((error: { fileName: string; message: string }) => `${error.fileName}: ${error.message}`).join(' | '),
          variant: 'default',
        });
      } else {
        toast({ title: 'Documentos enviados', description: result.message });
      }
    } catch (error) {
      toast({ title: 'Falha no upload', description: (error as Error).message, variant: 'destructive' });
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      setIsUploading(false);
      refreshDisplayOrder();
    }
  }, [append, fields.length, refreshDisplayOrder, toast]);

  const moveDocument = React.useCallback((from: number, to: number) => {
    move(from, to);
    requestAnimationFrame(() => {
      const values = control._formValues.documents ?? [];
      values.forEach((_: unknown, index: number) => {
        setValue(`documents.${index}.displayOrder`, index, { shouldDirty: true, shouldValidate: false });
      });
    });
  }, [control._formValues.documents, move, setValue]);

  return (
    <div className="space-y-4" data-ai-id="auction-documents-field">
      <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Documentos do leilão</h3>
          <p className="text-sm text-muted-foreground">Envie edital, laudos, certidões e qualquer documento oficial que precise ficar público na página do leilão.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label htmlFor="auction-documents-upload-input" className="sr-only">Selecionar arquivos de documentos do leilão</label>
          <input
            id="auction-documents-upload-input"
            ref={inputRef}
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFilesSelected}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={isUploading} data-ai-id="auction-documents-upload-button">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Enviar arquivos
          </Button>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG, WEBP ou SVG. Máx. 10MB por arquivo.</p>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground" data-ai-id="auction-documents-empty-state">
          Nenhum documento enviado até o momento.
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id} data-ai-id={`auction-document-card-${index + 1}`}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{field.title || field.fileName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{field.fileName}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveDocument(index, index - 1)} disabled={index === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveDocument(index, index + 1)} disabled={index === fields.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a href={field.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-4 w-4" />Abrir
                      </a>
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => { remove(index); requestAnimationFrame(refreshDisplayOrder); }}>
                      <Trash2 className="mr-2 h-4 w-4" />Remover
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={control}
                    name={`documents.${index}.title`}
                    render={({ field: titleField }) => (
                      <FormItem>
                        <FormLabel>Título público</FormLabel>
                        <FormControl>
                          <Input {...titleField} value={titleField.value ?? ''} data-ai-id={`auction-document-title-${index + 1}`} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`documents.${index}.isPublic`}
                    render={({ field: visibilityField }) => (
                      <FormItem className="flex h-full flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Exibir na página pública</FormLabel>
                          <FormDescription>Desative apenas se o arquivo for interno.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={visibilityField.value} onCheckedChange={visibilityField.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={control}
                  name={`documents.${index}.description`}
                  render={({ field: descriptionField }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...descriptionField} value={descriptionField.value ?? ''} rows={3} data-ai-id={`auction-document-description-${index + 1}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Ordem: {index + 1}</span>
                  {field.mimeType ? <span>Tipo: {field.mimeType}</span> : null}
                  {field.fileSize ? <span>Tamanho: {Math.max(1, Math.round(Number(field.fileSize) / 1024))} KB</span> : null}
                  <a href={field.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    URL pública
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}