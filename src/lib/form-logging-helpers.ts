// src/lib/form-logging-helpers.ts
/**
 * Helper functions to add logging to form field changes
 */

import { UseFormReturn } from 'react-hook-form';
import { logFormAction, logInteraction } from './user-action-logger';

/**
 * Wrap onChange handler with logging
 */
export function withLogging<T = any>(
  handler: (value: T) => void,
  fieldName: string,
  moduleName: string
): (value: T) => void {
  return (value: T) => {
    logFormAction(`Field changed: ${fieldName}`, { value }, moduleName);
    handler(value);
  };
}

/**
 * Create logged onChange for select fields
 */
export function loggedSelectChange(
  onChange: (value: string) => void,
  fieldName: string,
  moduleName: string,
  options?: Array<{ value: string; label: string }>
) {
  return (value: string) => {
    const selectedOption = options?.find(opt => opt.value === value);
    logFormAction(
      `Select changed: ${fieldName}`,
      { 
        value,
        label: selectedOption?.label || value
      },
      moduleName
    );
    onChange(value);
  };
}

/**
 * Create logged onChange for input fields
 */
export function loggedInputChange(
  onChange: (value: string) => void,
  fieldName: string,
  moduleName: string
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    logFormAction(
      `Input changed: ${fieldName}`,
      { value: value.substring(0, 50) }, // Truncate for logging
      moduleName
    );
    onChange(value);
  };
}

/**
 * Create logged onChange for switch/checkbox fields
 */
export function loggedSwitchChange(
  onChange: (value: boolean) => void,
  fieldName: string,
  moduleName: string
) {
  return (checked: boolean) => {
    logFormAction(
      `Switch toggled: ${fieldName}`,
      { checked },
      moduleName
    );
    onChange(checked);
  };
}

/**
 * Create logged onClick for buttons
 */
export function loggedButtonClick(
  onClick: () => void,
  buttonLabel: string,
  moduleName: string
) {
  return () => {
    logInteraction(
      `Button clicked: ${buttonLabel}`,
      {},
      moduleName
    );
    onClick();
  };
}

/**
 * Add field change listeners to form
 */
export function addFormFieldLogging<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  moduleName: string,
  fieldsToLog?: string[]
): () => void {
  const subscription = form.watch((value, { name, type }) => {
    if (!name) return;
    
    // If specific fields specified, only log those
    if (fieldsToLog && !fieldsToLog.includes(name)) {
      return;
    }
    
    logFormAction(
      `Field updated: ${name}`,
      {
        type,
        value: typeof value[name] === 'string' 
          ? (value[name] as string).substring(0, 50) 
          : value[name]
      },
      moduleName
    );
  });
  
  return () => subscription.unsubscribe();
}

/**
 * Log form section navigation
 */
export function logSectionChange(
  sectionName: string,
  moduleName: string
) {
  logInteraction(
    `Section opened: ${sectionName}`,
    {},
    moduleName
  );
}

/**
 * Log tab change
 */
export function logTabChange(
  tabName: string,
  moduleName: string
) {
  logInteraction(
    `Tab switched: ${tabName}`,
    {},
    moduleName
  );
}
