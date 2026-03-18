/**
 * @fileoverview Formulário de Tipo de Documento (DocumentType) em Sheet overlay — Admin Plus.
 */
'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createDocumentTypeSchema, appliesToOptions, type CreateDocumentTypeInput } from './schema';

interface DocTypeRow {
  id: string;
  name: string;
  description?: string | null;
  isRequired: boolean;
  appliesTo: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateDocumentTypeInput) => Promise<void>;
  defaultValues?: DocTypeRow | null;
}

const appliesToLabels: Record<string, string> = {
  PHYSICAL: 'Pessoa Física',
  LEGAL: 'Pessoa Jurídica',
  BOTH: 'Ambos',
};

export function DocumentTypeForm({ open, onOpenChange, onSubmit, defaultValues }: Props) {
  const isEdit = !!defaultValues?.id;

  const form = useForm<CreateDocumentTypeInput>({
    resolver: zodResolver(createDocumentTypeSchema),
    defaultValues: { name: '', description: '', isRequired: true, appliesTo: 'BOTH' },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      isRequired: defaultValues?.isRequired ?? true,
      appliesTo: (defaultValues?.appliesTo as typeof appliesToOptions[number]) ?? 'BOTH',
    });
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto" data-ai-id="document-type-form-sheet">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Tipo de Documento' : 'Novo Tipo de Documento'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados do tipo de documento.' : 'Cadastre um novo tipo de documento no sistema.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-ai-id="document-type-form">
          <div className="space-y-2">
            <Label htmlFor="doctype-name">Nome *</Label>
            <Input
              id="doctype-name"
              {...form.register('name')}
              placeholder="Ex: RG, CPF, CNPJ"
              data-ai-id="document-type-field-name"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctype-description">Descrição</Label>
            <Textarea
              id="doctype-description"
              {...form.register('description')}
              placeholder="Descreva o tipo de documento"
              rows={3}
              data-ai-id="document-type-field-description"
            />
          </div>

          <div className="space-y-2">
            <Label>Aplicável a *</Label>
            <Controller
              control={form.control}
              name="appliesTo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-ai-id="document-type-field-appliesTo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {appliesToOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {appliesToLabels[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.appliesTo && (
              <p className="text-destructive text-xs">{form.formState.errors.appliesTo.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4" data-ai-id="document-type-toggle-required">
            <Label htmlFor="doctype-isRequired">Obrigatório</Label>
            <Controller
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <Switch
                  id="doctype-isRequired"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ai-id="document-type-form-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              data-ai-id="document-type-form-submit"
            >
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
