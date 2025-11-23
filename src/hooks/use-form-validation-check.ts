// src/hooks/use-form-validation-check.ts
/**
 * Hook for real-time form validation checking
 * Provides validation state and methods for CRUD forms
 */

import { useState, useCallback, useEffect } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { ZodSchema } from 'zod';
import {
  validateFormData,
  convertRHFErrors,
  formatValidationSummary,
  type ValidationResult,
} from '@/lib/form-validator';
import { logValidation } from '@/lib/user-action-logger';

interface UseFormValidationCheckOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  schema: ZodSchema<T>;
  moduleName: string;
  autoValidate?: boolean; // Auto-validate on form changes
}

export function useFormValidationCheck<T extends FieldValues>({
  form,
  schema,
  moduleName,
  autoValidate = false,
}: UseFormValidationCheckOptions<T>) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  /**
   * Perform validation check
   */
  const performValidationCheck = useCallback(() => {
    setIsChecking(true);
    
    try {
      const formData = form.getValues();
      const result = validateFormData(formData, schema);
      
      // Also include React Hook Form errors
      const rhfErrors = convertRHFErrors(form.formState.errors);
      if (rhfErrors.length > 0) {
        result.errors.push(...rhfErrors);
        result.isValid = false;
      }
      
      setValidationResult(result);
      setLastCheckTime(new Date());
      
      // Log the validation check
      logValidation('Form validation check performed', {
        module: moduleName,
        isValid: result.isValid,
        errorCount: result.errors.length,
        fieldStats: result.fieldCount,
      }, moduleName);
      
      return result;
    } finally {
      setIsChecking(false);
    }
  }, [form, schema, moduleName]);

  /**
   * Show validation summary in console
   */
  const showValidationSummary = useCallback(() => {
    const result = performValidationCheck();
    const summary = formatValidationSummary(result);
    
    console.group(`🔍 Validation Check - ${moduleName}`);
    console.log(summary);
    console.log('Detailed errors:', result.errors);
    console.groupEnd();
    
    return result;
  }, [performValidationCheck, moduleName]);

  /**
   * Get validation progress percentage
   */
  const getValidationProgress = useCallback((): number => {
    if (!validationResult) return 0;
    const { total, valid } = validationResult.fieldCount;
    return total > 0 ? Math.round((valid / total) * 100) : 0;
  }, [validationResult]);

  /**
   * Check if form is ready to submit
   */
  const isReadyToSubmit = useCallback((): boolean => {
    if (!validationResult) {
      performValidationCheck();
      return false;
    }
    return validationResult.isValid && form.formState.isDirty;
  }, [validationResult, form.formState.isDirty, performValidationCheck]);

  // Auto-validate on form changes if enabled
  useEffect(() => {
    if (autoValidate) {
      const subscription = form.watch(() => {
        performValidationCheck();
      });
      return () => subscription.unsubscribe();
    }
  }, [autoValidate, form, performValidationCheck]);

  return {
    validationResult,
    isChecking,
    lastCheckTime,
    performValidationCheck,
    showValidationSummary,
    getValidationProgress,
    isReadyToSubmit,
  };
}
