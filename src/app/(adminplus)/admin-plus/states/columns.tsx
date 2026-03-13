/**
 * @fileoverview Definições de colunas TanStack Table para Estado no Admin Plus.
 */
'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { StateInfo } from '@/types';

interface ColumnActions {
  onEdit: (row: StateInfo) => void;
  onDelete: (row: StateInfo) => void;
}

export function getStateColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<StateInfo, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => (
        <span className="font-medium" data-ai-id={`state-name-${row.original.id}`}>
          {row.getValue('name')}
        </span>
      ),
    },
    {
      accessorKey: 'uf',
      header: ({ column }) => <DataTableColumnHeader column={column} title="UF" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
          {row.getValue('uf')}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'cityCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cidades" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.cityCount ?? 0}</span>
      ),
      size: 100,
    },
    {
      id: 'actions',
      size: 60,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              data-ai-id={`state-actions-${row.original.id}`}
            >
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="state-action-edit">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
              data-ai-id="state-action-delete"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
