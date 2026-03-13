/**
 * @fileoverview Colunas da tabela LotCategory — Admin Plus.
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
import type { LotCategoryRow } from './types';

interface ColumnActions {
  onEdit: (row: LotCategoryRow) => void;
  onDelete: (row: LotCategoryRow) => void;
}

export function getLotCategoryColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<LotCategoryRow, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => (
        <div data-ai-id={`lot-category-name-${row.original.id}`}>
          <span className="font-medium">{row.original.name}</span>
          <span className="block text-xs text-muted-foreground">{row.original.slug}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />,
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-[300px] text-sm text-muted-foreground" data-ai-id="lot-category-description">
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'hasSubcategories',
      header: 'Subcategorias',
      cell: ({ row }) => (
        <Badge variant={row.original.hasSubcategories ? 'default' : 'secondary'} data-ai-id="lot-category-has-subcategories">
          {row.original.hasSubcategories ? 'Sim' : 'Não'}
        </Badge>
      ),
    },
    {
      accessorKey: 'isGlobal',
      header: 'Global',
      cell: ({ row }) => (
        <Badge variant={row.original.isGlobal ? 'default' : 'outline'} data-ai-id="lot-category-is-global">
          {row.original.isGlobal ? 'Global' : 'Tenant'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground" data-ai-id="lot-category-created-at">
          {row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString('pt-BR')
            : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      size: 60,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" data-ai-id={`lot-category-actions-${row.original.id}`}>
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="lot-category-action-edit">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
              data-ai-id="lot-category-action-delete"
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
