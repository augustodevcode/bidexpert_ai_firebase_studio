/**
 * @fileoverview Definição de colunas TanStack Table para DataSources no Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

type DSRow = { id: string; name: string; modelName: string; fields: string };

interface GetColumnsOptions {
  onEdit: (row: DSRow) => void;
  onDelete: (row: DSRow) => void;
}

export function getDataSourceColumns({ onEdit, onDelete }: GetColumnsOptions): ColumnDef<DSRow>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <span className="font-medium" data-ai-id="datasource-name">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'modelName',
      header: 'Model',
      cell: ({ row }) => (
        <Badge variant="outline" data-ai-id="datasource-model">
          <Database className="mr-1 h-3 w-3" aria-hidden="true" />
          {row.original.modelName}
        </Badge>
      ),
    },
    {
      id: 'fieldCount',
      header: 'Campos',
      cell: ({ row }) => {
        try {
          const parsed = JSON.parse(row.original.fields);
          const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
          return <span className="text-muted-foreground" data-ai-id="datasource-field-count">{count}</span>;
        } catch {
          return <span className="text-muted-foreground">—</span>;
        }
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Ações para ${row.original.name}`} data-ai-id="datasource-actions-trigger">
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="datasource-edit-action">
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="datasource-delete-action">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
