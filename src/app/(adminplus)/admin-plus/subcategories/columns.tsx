/**
 * @fileoverview Colunas da tabela Subcategory — Admin Plus.
 */
'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { SubcategoryRow } from './types';

interface ColumnActions {
  onEdit: (row: SubcategoryRow) => void;
  onDelete: (row: SubcategoryRow) => void;
}

export function getSubcategoryColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<SubcategoryRow, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => (
        <div data-ai-id={`subcategory-name-${row.original.id}`}>
          <span className="font-medium">{row.original.name}</span>
          <span className="block text-xs text-muted-foreground">{row.original.slug}</span>
        </div>
      ),
    },
    {
      accessorKey: 'parentCategoryName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria Pai" />,
      cell: ({ row }) => (
        <span className="text-sm" data-ai-id="subcategory-parent">
          {row.original.parentCategoryName || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'displayOrder',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ordem" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground" data-ai-id="subcategory-order">
          {row.original.displayOrder}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'isGlobal',
      header: 'Global',
      cell: ({ row }) => (
        <Badge variant={row.original.isGlobal ? 'default' : 'outline'} data-ai-id="subcategory-is-global">
          {row.original.isGlobal ? 'Global' : 'Tenant'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      size: 60,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" data-ai-id={`subcategory-actions-${row.original.id}`}>
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="subcategory-action-edit">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
              data-ai-id="subcategory-action-delete"
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
