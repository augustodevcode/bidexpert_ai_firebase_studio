/**
 * @fileoverview Modal de edição do SuperGrid.
 * Dialog com formulário dinâmico gerado a partir das colunas.
 * Suporta validação Zod, todos os tipos de campo (input, select, date, etc).
 */
'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import type { GridColumn } from '../SuperGrid.types';
import { getNestedValue } from '../utils/columnHelpers';

interface EditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: GridColumn[];
  row: Record<string, unknown> | null;
  isNew: boolean;
  onSave: (data: Record<string, unknown>, id?: string) => void;
  isSaving: boolean;
  title?: string;
  validationSchema?: z.ZodSchema<unknown>;
}

/** Build dynamic Zod schema from columns */
function buildDynamicSchema(columns: GridColumn[]): z.ZodSchema<Record<string, unknown>> {
  const shape: Record<string, z.ZodType<unknown>> = {};

  columns.forEach(col => {
    if (col.editable === false) return;

    if (col.validation) {
      shape[col.accessorKey] = col.validation;
      return;
    }

    let fieldSchema: z.ZodType<unknown>;
    switch (col.type) {
      case 'number':
      case 'currency':
      case 'percentage':
        fieldSchema = z.coerce.number().optional().nullable();
        break;
      case 'boolean':
        fieldSchema = z.boolean().optional();
        break;
      case 'date':
      case 'datetime':
        fieldSchema = z.string().optional().nullable();
        break;
      case 'email':
        fieldSchema = z.string().email('E-mail inválido').optional().or(z.literal(''));
        break;
      case 'url':
        fieldSchema = z.string().url('URL inválida').optional().or(z.literal(''));
        break;
      default:
        fieldSchema = z.string().optional().nullable();
    }

    shape[col.accessorKey] = fieldSchema;
  });

  return z.object(shape) as z.ZodSchema<Record<string, unknown>>;
}

export function EditModal({
  open,
  onOpenChange,
  columns,
  row,
  isNew,
  onSave,
  isSaving,
  title,
  validationSchema,
}: EditModalProps) {
  const editableColumns = useMemo(
    () => columns.filter(col => {
      if (col.editable === false) return false;
      if (col.relation) return false; // relações não são editáveis inline
      if (col.accessorKey.includes('.')) return false; // campos aninhados
      return true;
    }),
    [columns]
  );

  const schema = useMemo(
    () => validationSchema || buildDynamicSchema(editableColumns),
    [validationSchema, editableColumns]
  );

  const defaultValues = useMemo(() => {
    const values: Record<string, unknown> = {};
    editableColumns.forEach(col => {
      if (row) {
        const value = getNestedValue(row as Record<string, unknown>, col.accessorKey);
        if (col.type === 'date' || col.type === 'datetime') {
          values[col.accessorKey] = value
            ? new Date(String(value)).toISOString().split('T')[0]
            : '';
        } else {
          values[col.accessorKey] = value ?? '';
        }
      } else {
        values[col.accessorKey] = col.type === 'boolean' ? false : '';
      }
    });
    return values;
  }, [row, editableColumns]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Reset form when row changes
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = (data: Record<string, unknown>) => {
    const id = row ? String((row as Record<string, unknown>).id ?? '') : undefined;
    onSave(data, isNew ? undefined : id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px]"
        data-ai-id="supergrid-edit-modal"
      >
        <DialogHeader>
          <DialogTitle>
            {title || (isNew ? 'Novo Registro' : 'Editar Registro')}
          </DialogTitle>
          <DialogDescription>
            {isNew
              ? 'Preencha os campos para criar um novo registro.'
              : 'Modifique os campos desejados e clique em salvar.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            data-ai-id="supergrid-edit-form"
          >
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                {editableColumns.map(col => (
                  <FormField
                    key={col.id}
                    control={form.control}
                    name={col.accessorKey}
                    render={({ field }) => (
                      <FormItem
                        className={
                          col.type === 'json' ? 'sm:col-span-2' : ''
                        }
                        data-ai-id={`supergrid-edit-field-${col.id}`}
                      >
                        <FormLabel>{col.header}</FormLabel>
                        <FormControl>
                          {renderFieldInput(col, field)}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                data-ai-id="supergrid-edit-save-btn"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNew ? 'Criar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/** Renderiza o input correto baseado no tipo de coluna */
function renderFieldInput(
  col: GridColumn,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any
) {
  switch (col.type) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2 pt-1">
          <Switch
            checked={!!field.value}
            onCheckedChange={field.onChange}
          />
          <span className="text-sm text-muted-foreground">
            {field.value ? 'Sim' : 'Não'}
          </span>
        </div>
      );

    case 'select':
      return (
        <Select
          value={String(field.value ?? '')}
          onValueChange={field.onChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {(col.selectOptions || []).map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'json':
      return (
        <Textarea
          {...field}
          value={typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2)}
          rows={4}
          className="font-mono text-xs"
          placeholder="JSON"
        />
      );

    case 'number':
    case 'currency':
    case 'percentage':
      return (
        <Input
          {...field}
          type="number"
          step={col.type === 'currency' ? '0.01' : col.type === 'percentage' ? '0.1' : '1'}
          value={field.value ?? ''}
          onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      );

    case 'date':
      return <Input {...field} type="date" value={field.value ?? ''} />;

    case 'datetime':
      return <Input {...field} type="datetime-local" value={field.value ?? ''} />;

    case 'email':
      return <Input {...field} type="email" placeholder="email@exemplo.com" value={field.value ?? ''} />;

    case 'url':
      return <Input {...field} type="url" placeholder="https://..." value={field.value ?? ''} />;

    default:
      return <Input {...field} value={field.value ?? ''} />;
  }
}
