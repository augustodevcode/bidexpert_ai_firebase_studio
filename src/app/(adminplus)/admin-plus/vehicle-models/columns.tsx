/**
 * @fileoverview Definições de colunas TanStack Table para Modelo de Veículo no Admin Plus.
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
import type { VehicleModel } from '@/types';

interface ColumnActions {
  onEdit: (row: VehicleModel) => void;
  onDelete: (row: VehicleModel) => void;
}

export function getVehicleModelColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<VehicleModel, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Modelo" />,
      cell: ({ row }) => (
        <span className="font-medium" data-ai-id={`vehicle-model-name-${row.original.id}`}>
          {row.getValue('name')}
        </span>
      ),
    },
    {
      accessorKey: 'makeName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Marca" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
          {row.original.makeName ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'slug',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.slug ?? '—'}</span>
      ),
      size: 180,
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
              data-ai-id={`vehicle-model-actions-${row.original.id}`}
            >
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="vehicle-model-action-edit">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
              data-ai-id="vehicle-model-action-delete"
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
