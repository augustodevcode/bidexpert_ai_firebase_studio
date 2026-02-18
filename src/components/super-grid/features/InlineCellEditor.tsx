/**
 * @fileoverview Editor inline de célula do SuperGrid.
 * Ativado por duplo clique na célula, oferece edição direta como no Excel.
 * Suporta: texto, número, data, boolean (checkbox), select, email, url.
 * Navegação: Enter/Tab salvam e avançam, Escape cancela.
 */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { GridColumn } from '../SuperGrid.types';
import type { GridLocale } from '../SuperGrid.i18n';

interface InlineCellEditorProps {
  column: GridColumn;
  value: unknown;
  rowId: string;
  onSave: (value: unknown) => void;
  onCancel: () => void;
  onTabNext?: () => void;
  locale: GridLocale;
}

export function InlineCellEditor({
  column,
  value,
  rowId,
  onSave,
  onCancel,
  onTabNext,
  locale,
}: InlineCellEditorProps) {
  const [editValue, setEditValue] = useState<unknown>(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const validate = useCallback((val: unknown): boolean => {
    if (column.validation) {
      const result = column.validation.safeParse(val);
      if (!result.success) {
        setError(result.error.issues[0]?.message || locale.inlineEditing.invalidValue);
        return false;
      }
    }
    setError(null);
    return true;
  }, [column.validation, locale.inlineEditing.invalidValue]);

  const handleSave = useCallback(() => {
    let finalValue = editValue;

    // Parse number types
    if (['number', 'currency', 'percentage'].includes(column.type)) {
      finalValue = finalValue === '' || finalValue === null ? null : Number(finalValue);
      if (finalValue !== null && isNaN(finalValue as number)) {
        setError(locale.inlineEditing.invalidValue);
        return;
      }
    }

    if (validate(finalValue)) {
      onSave(finalValue);
    }
  }, [editValue, column.type, validate, onSave, locale.inlineEditing.invalidValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
      onTabNext?.();
    }
  }, [handleSave, onCancel, onTabNext]);

  // Boolean type: checkbox
  if (column.type === 'boolean') {
    return (
      <div
        className="flex items-center gap-1"
        data-ai-id={`supergrid-inline-editor-${column.id}-${rowId}`}
      >
        <Checkbox
          checked={!!editValue}
          onCheckedChange={(checked) => {
            setEditValue(checked);
            onSave(checked);
          }}
          autoFocus
        />
        <span className="text-xs text-muted-foreground">
          {editValue ? locale.inlineEditing.yes : locale.inlineEditing.no}
        </span>
      </div>
    );
  }

  // Select type: dropdown
  if (column.type === 'select' && column.selectOptions) {
    return (
      <div
        className="flex items-center gap-1"
        data-ai-id={`supergrid-inline-editor-${column.id}-${rowId}`}
      >
        <Select
          value={String(editValue ?? '')}
          onValueChange={(val) => {
            setEditValue(val);
            onSave(val);
          }}
        >
          <SelectTrigger className="h-7 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {column.selectOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Input type resolver
  const inputType = (() => {
    switch (column.type) {
      case 'number':
      case 'currency':
      case 'percentage':
        return 'number';
      case 'date':
        return 'date';
      case 'datetime':
        return 'datetime-local';
      case 'email':
        return 'email';
      case 'url':
        return 'url';
      default:
        return 'text';
    }
  })();

  // Default: text input with save/cancel buttons
  return (
    <TooltipProvider>
      <div
        className="flex items-center gap-0.5"
        data-ai-id={`supergrid-inline-editor-${column.id}-${rowId}`}
      >
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type={inputType}
            value={editValue === null || editValue === undefined ? '' : String(editValue)}
            onChange={(e) => {
              setEditValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            className={`h-7 text-xs px-1.5 ${error ? 'border-destructive ring-destructive/30 ring-1' : 'ring-primary/30 ring-1'}`}
            step={column.type === 'currency' ? '0.01' : column.type === 'percentage' ? '0.1' : undefined}
          />
          {error && (
            <span className="absolute -bottom-4 left-0 text-[10px] text-destructive whitespace-nowrap">
              {error}
            </span>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-primary hover:text-primary/80"
              onClick={handleSave}
              data-ai-id={`supergrid-inline-save-${column.id}-${rowId}`}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{locale.inlineEditing.saveTooltip}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={onCancel}
              data-ai-id={`supergrid-inline-cancel-${column.id}-${rowId}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{locale.inlineEditing.cancelTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
