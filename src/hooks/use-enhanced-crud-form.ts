// src/hooks/use-enhanced-crud-form.ts
/**
 * Enhanced CRUD form hook with logging and validation
 * Combines useCrudForm with useFormValidationCheck
 */

import { FieldValues } from 'react-hook-form';
import { ZodSchema } from 'zod';
import { useCrudForm } from './use-crud-form';
import { useFormValidationCheck } from './use-form-validation-check';

interface UseEnhancedCrudFormProps<T extends FieldValues> {
  schema: ZodSchema<T>;
  onSubmitAction: (data: T) => Promise<{ success: boolean; message: string; data?: any }>;
  onSuccess?: (data?: any) => void;
  successMessage?: string;
  moduleName: string;
  defaultValues?: Partial<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  autoValidate?: boolean;
}

export function useEnhancedCrudForm<T extends FieldValues>({
  schema,
  onSubmitAction,
  onSuccess,
  successMessage,
  moduleName,
  defaultValues,
  mode = 'onChange',
  autoValidate = false,
}: UseEnhancedCrudFormProps<T>) {
  // Base CRUD form with logging
  const { form, handleSubmit, isSubmitting } = useCrudForm<T>({
    schema,
    onSubmitAction,
    onSuccess,
    successMessage,
    moduleName,
    defaultValues,
    mode,
  });

  // Validation checking
  const validation = useFormValidationCheck<T>({
    form,
    schema,
    moduleName,
    autoValidate,
  });

  return {
    form,
    handleSubmit,
    isSubmitting,
    validation,
  };
}
