/**
 * @fileoverview Campo de formulário unificado para Admin Plus.
 * Integra label, input (via render prop), hint e mensagem de erro
 * usando useFormContext do react-hook-form.
 */
'use client';

import { type ReactNode } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldProps {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (props: {
    field: {
      value: unknown;
      onChange: (...args: unknown[]) => void;
      onBlur: () => void;
      name: string;
      ref: React.Ref<unknown>;
    };
    error?: string;
  }) => ReactNode;
}

export function Field({ name, label, hint, required, className, children }: FieldProps) {
  const { control, formState: { errors } } = useFormContext();
  const errorMsg = errors[name]?.message as string | undefined;
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;

  return (
    <div className={cn('space-y-2', className)} data-ai-id={`field-${name}`}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <>
            {children({
              field: { ...field, ref: field.ref },
              error: errorMsg,
            })}
          </>
        )}
      />

      {hint && !errorMsg && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
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
