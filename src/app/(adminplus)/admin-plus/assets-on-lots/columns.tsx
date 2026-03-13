/**
 * Column definitions for AssetsOnLots data table.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { AssetsOnLotsRow } from './types';

interface ColumnActions {
  onEdit: (row: AssetsOnLotsRow) => void;
  onDelete: (row: AssetsOnLotsRow) => void;
}

export function getAssetsOnLotsColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<AssetsOnLotsRow>[] {
  return [
    {
      accessorKey: 'lotTitle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" />,
      cell: ({ row }) => <span className="font-medium">{row.original.lotTitle}</span>,
    },
    {
      accessorKey: 'assetTitle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ativo" />,
      cell: ({ row }) => <span className="font-medium">{row.original.assetTitle}</span>,
    },
    {
      accessorKey: 'assignedBy',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Atribuído por" />,
    },
    {
      accessorKey: 'assignedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data Atribuição" />,
      cell: ({ row }) => new Date(row.original.assignedAt).toLocaleDateString('pt-BR'),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="assets-on-lots-row-actions">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
