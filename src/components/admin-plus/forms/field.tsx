/**
 * @fileoverview Campo de formulário unificado para Admin Plus.
 * Suporta tanto o contrato atual com render prop quanto os usos legados
 * com input padrão, props extras de formulário e children opcionais.
 */
'use client';

import { type ReactNode, useId } from 'react';
import { Controller, useFormContext, type Control, type FieldError, type FieldErrors, type UseFormRegister, type UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type CompatFieldValue = {
  value: unknown;
  onChange: (...args: unknown[]) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<unknown>;
};

type CompatChildProps = CompatFieldValue & {
  field: CompatFieldValue;
  error?: string;
};

interface FieldProps {
  name?: string;
  label: string;
  hint?: string;
  description?: string;
  required?: boolean;
  className?: string;
  type?: string;
  multiline?: boolean;
  dataAiId?: string;
  'data-ai-id'?: string;
  form?: UseFormReturn<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control?: any;
  register?: UseFormRegister<any>;
  error?: string | FieldError | { message?: string };
  children?: ((props: CompatChildProps) => ReactNode) | ReactNode;
}

function getErrorMessage(
  name: string | undefined,
  explicitError: FieldProps['error'],
  formErrors?: FieldErrors<any>,
  contextErrors?: FieldErrors<any>,
) {
  if (typeof explicitError === 'string') {
    return explicitError;
  }

  if (explicitError?.message) {
    return explicitError.message;
  }

  if (!name) {
    return undefined;
  }

  const fromForm = formErrors?.[name] as FieldError | undefined;
  if (fromForm?.message) {
    return fromForm.message as string;
  }

  const fromContext = contextErrors?.[name] as FieldError | undefined;
  return fromContext?.message as string | undefined;
}

export function Field({
  name,
  label,
  hint,
  description,
  required,
  className,
  type = 'text',
  multiline = false,
  form,
  control,
  register,
  error,
  children,
  dataAiId,
  'data-ai-id': dataAiIdAttr,
}: FieldProps) {
  const generatedId = useId().replace(/:/g, '-');
  const fieldName = name ?? generatedId;
  const formContext = useFormContext();
  const effectiveControl = control ?? form?.control ?? formContext?.control;
  const effectiveRegister = register ?? form?.register;
  const errorMsg = getErrorMessage(name, error, form?.formState?.errors, formContext?.formState?.errors);
  const helperText = hint ?? description;
  const hintId = `${fieldName}-hint`;
  const errorId = `${fieldName}-error`;
  const describedBy = [helperText ? hintId : null, errorMsg ? errorId : null].filter(Boolean).join(' ') || undefined;
  const fieldAiId = dataAiIdAttr ?? dataAiId ?? `field-${fieldName}`;

  const renderDefaultField = (fieldProps: Partial<CompatFieldValue> & { name: string }) => {
    const sharedProps = {
      id: fieldName,
      'aria-invalid': !!errorMsg,
      'aria-describedby': describedBy,
      'data-ai-id': `${fieldAiId}-input`,
      name: fieldProps.name,
      onBlur: fieldProps.onBlur,
      onChange: fieldProps.onChange,
      ref: fieldProps.ref,
      value: (fieldProps.value as string | number | readonly string[] | undefined) ?? '',
    };

    if (multiline) {
      return <Textarea {...sharedProps} />;
    }

    return <Input {...sharedProps} type={type} />;
  };

  const renderControlled = () => {
    if (children && typeof children !== 'function') {
      return children;
    }

    if (!name) {
      return renderDefaultField({ name: fieldName });
    }

    if (!effectiveControl) {
      if (effectiveRegister) {
        return renderDefaultField({ name, ...effectiveRegister(name) });
      }

      return renderDefaultField({ name });
    }

    return (
      <Controller
        name={name}
        control={effectiveControl}
        render={({ field }) => {
          const compatField: CompatFieldValue = {
            ...field,
            ref: field.ref,
            value: field.value,
          };

          if (typeof children === 'function') {
            const compatProps = Object.assign({}, compatField, {
              field: compatField,
              error: errorMsg,
            }) as CompatChildProps;

            return children(compatProps);
          }

          if (children) {
            return children;
          }

          return renderDefaultField(compatField);
        }}
      />
    );
  };

  return (
    <div className={cn('space-y-2', className)} data-ai-id={fieldAiId}>
      <Label htmlFor={fieldName} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>

      {renderControlled()}

      {helperText && !errorMsg && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
      {errorMsg && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
