// src/lib/form-validator.ts
/**
 * Reusable form validation checker
 * Validates all fields against their schema requirements
 */

import { ZodSchema, ZodError } from 'zod';
import { FieldErrors, FieldValues } from 'react-hook-form';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  fieldCount: {
    total: number;
    filled: number;
    valid: number;
    invalid: number;
  };
  missingRequired: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  type: string;
}

/**
 * Validates form data against a Zod schema
 */
export function validateFormData<T extends FieldValues>(
  data: T,
  schema: ZodSchema<T>
): ValidationResult {
  const errors: ValidationError[] = [];
  const missingRequired: string[] = [];
  
  try {
    // Validate against schema
    schema.parse(data);
    
    // If we reach here, validation passed
    return {
      isValid: true,
      errors: [],
      fieldCount: calculateFieldCounts(data, []),
      missingRequired: [],
    };
  } catch (error) {
    if (error instanceof ZodError) {
      // Extract errors from Zod
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        errors.push({
          field,
          message: err.message,
          type: err.code,
        });
        
        // Track missing required fields
        if (err.code === 'invalid_type' && err.message.includes('Required')) {
          missingRequired.push(field);
        }
      });
    }
    
    return {
      isValid: false,
      errors,
      fieldCount: calculateFieldCounts(data, errors),
      missingRequired,
    };
  }
}

/**
 * Calculate field statistics
 */
function calculateFieldCounts(
  data: FieldValues,
  errors: ValidationError[]
): ValidationResult['fieldCount'] {
  const fields = Object.keys(flattenObject(data));
  const total = fields.length;
  
  // Count filled fields (not null/undefined/empty string)
  const filled = fields.filter((key) => {
    const value = getNestedValue(data, key);
    return value !== null && value !== undefined && value !== '';
  }).length;
  
  // Count invalid fields
  const invalid = new Set(errors.map(e => e.field)).size;
  
  // Valid = filled - invalid
  const valid = Math.max(0, filled - invalid);
  
  return {
    total,
    filled,
    valid,
    invalid,
  };
}

/**
 * Convert React Hook Form errors to ValidationError array
 */
export function convertRHFErrors(rhfErrors: FieldErrors): ValidationError[] {
  const errors: ValidationError[] = [];
  
  const processErrors = (obj: any, prefix = '') => {
    Object.keys(obj).forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (obj[key]?.message) {
        errors.push({
          field: fullKey,
          message: obj[key].message as string,
          type: obj[key].type || 'validation',
        });
      } else if (typeof obj[key] === 'object') {
        processErrors(obj[key], fullKey);
      }
    });
  };
  
  processErrors(rhfErrors);
  return errors;
}

/**
 * Flatten nested object to dot notation
 */
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, fullKey));
    } else {
      flattened[fullKey] = value;
    }
  });
  
  return flattened;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Format validation result for display
 */
export function formatValidationSummary(result: ValidationResult): string {
  const { fieldCount, errors, missingRequired } = result;
  
  let summary = `Validação: ${result.isValid ? '✓ Aprovado' : '✗ Reprovado'}\n`;
  summary += `Campos: ${fieldCount.valid}/${fieldCount.total} válidos\n`;
  
  if (missingRequired.length > 0) {
    summary += `\nCampos obrigatórios faltando (${missingRequired.length}):\n`;
    missingRequired.forEach(field => {
      summary += `  - ${field}\n`;
    });
  }
  
  if (errors.length > 0 && errors.length <= 10) {
    summary += `\nErros (${errors.length}):\n`;
    errors.forEach(error => {
      summary += `  - ${error.field}: ${error.message}\n`;
    });
  } else if (errors.length > 10) {
    summary += `\nTotal de ${errors.length} erros encontrados.\n`;
  }
  
  return summary;
}

/**
 * Check if a specific field is valid
 */
export function isFieldValid(
  fieldName: string,
  errors: ValidationError[]
): boolean {
  return !errors.some(e => e.field === fieldName);
}

/**
 * Get errors for a specific field
 */
export function getFieldErrors(
  fieldName: string,
  errors: ValidationError[]
): ValidationError[] {
  return errors.filter(e => e.field === fieldName);
}
