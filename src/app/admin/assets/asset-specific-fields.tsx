// src/app/admin/assets/asset-specific-fields.tsx
/**
 * @fileoverview Componente que renderiza campos específicos baseado na categoria selecionada.
 * Usa a configuração de campos para exibir apenas os campos relevantes.
 */
'use client';

import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { getFieldGroupsForCategory, type AssetFieldGroup, type AssetField } from './asset-field-config';
import type { AssetFormData } from './asset-form-schema';

interface AssetSpecificFieldsProps {
  form: UseFormReturn<AssetFormData>;
  categorySlug?: string;
}

export default function AssetSpecificFields({ form, categorySlug }: AssetSpecificFieldsProps) {
  if (!categorySlug) {
    return (
      <div className="p-4 border rounded-md bg-muted/50 text-center text-sm text-muted-foreground">
        Selecione uma categoria para ver os campos específicos
      </div>
    );
  }

  const fieldGroups = getFieldGroupsForCategory(categorySlug);

  if (fieldGroups.length === 0) {
    return (
      <div className="p-4 border rounded-md bg-muted/50 text-center text-sm text-muted-foreground">
        Esta categoria não possui campos específicos adicionais
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fieldGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {groupIndex > 0 && <Separator className="my-6" />}
          <h4 className="text-base font-semibold text-primary mb-4">{group.title}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.fields.map((field) => (
              <FieldRenderer key={field.name} field={field} form={form} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface FieldRendererProps {
  field: AssetField;
  form: UseFormReturn<AssetFormData>;
}

function FieldRenderer({ field, form }: FieldRendererProps) {
  const fieldName = field.name as keyof AssetFormData;
  const fullWidth = field.type === 'textarea';

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field: formField }) => (
        <FormItem className={fullWidth ? 'md:col-span-2' : ''}>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          {renderFieldInput(field, formField)}
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function renderFieldInput(fieldConfig: AssetField, formField: any) {
  switch (fieldConfig.type) {
    case 'text':
    case 'number':
      return (
        <Input
          {...formField}
          type={fieldConfig.type}
          placeholder={fieldConfig.placeholder}
          value={formField.value ?? ''}
        />
      );

    case 'textarea':
      return (
        <Textarea
          {...formField}
          placeholder={fieldConfig.placeholder}
          value={formField.value ?? ''}
          rows={4}
        />
      );

    case 'select':
      return (
        <Select
          onValueChange={formField.onChange}
          value={formField.value ?? undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder={fieldConfig.placeholder || 'Selecione...'} />
          </SelectTrigger>
          <SelectContent>
            {fieldConfig.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'boolean':
      return (
        <div className="flex items-center space-x-2 h-10">
          <Checkbox
            checked={formField.value === true}
            onCheckedChange={(checked) => formField.onChange(checked)}
          />
          <label className="text-sm font-normal cursor-pointer" onClick={() => formField.onChange(!formField.value)}>
            {fieldConfig.placeholder || 'Sim'}
          </label>
        </div>
      );

    case 'date':
      return (
        <Input
          {...formField}
          type="date"
          value={formField.value ? new Date(formField.value).toISOString().split('T')[0] : ''}
          onChange={(e) => formField.onChange(e.target.value ? new Date(e.target.value) : null)}
        />
      );

    default:
      return (
        <Input {...formField} value={formField.value ?? ''} />
      );
  }
}
