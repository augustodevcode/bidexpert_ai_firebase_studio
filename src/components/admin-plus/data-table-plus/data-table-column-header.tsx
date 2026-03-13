/**
 * @fileoverview Cabeçalho de coluna do DataTable Plus com sort toggle.
 * Usa Button com ícone de seta para indicar direção de ordenação.
 */
'use client';

import type { Column } from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8 data-[state=open]:bg-accent', className)}
      onClick={() => column.toggleSorting(sorted === 'asc')}
      data-ai-id={`col-header-${column.id}`}
    >
      <span>{title}</span>
      {sorted === 'asc' ? (
        <ArrowUp className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
      )}
    </Button>
  );
}
