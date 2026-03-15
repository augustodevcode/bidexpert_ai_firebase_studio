/**
 * @fileoverview Shell genérico de formulário CRUD para Admin Plus.
 * Encapsula react-hook-form, unsaved changes guard, toast feedback,
 * e barra de ações fixa (Salvar / Cancelar).
 */
'use client';

import { type ReactNode } from 'react';
import {
  type UseFormReturn,
  type FieldValues,
  FormProvider,
} from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Loader2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

interface CrudFormShellProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  children: ReactNode;
  className?: string;
  'data-ai-id'?: string;
}

export function CrudFormShell<T extends FieldValues>({
  form,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Salvar',
  children,
  className,
  'data-ai-id': dataAiId,
}: CrudFormShellProps<T>) {
  useUnsavedChanges({ isDirty: form.formState.isDirty });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-6', className)}
        data-ai-id={dataAiId ?? 'crud-form-shell'}
      >
        {children}

        <div
          className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-background py-4"
          data-ai-id="crud-form-actions"
        >
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              data-ai-id="crud-form-cancel"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            data-ai-id="crud-form-submit"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? 'Salvando...' : submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
