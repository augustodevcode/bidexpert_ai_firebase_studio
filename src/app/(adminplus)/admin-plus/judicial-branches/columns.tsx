/**
 * @fileoverview Colunas da tabela JudicialBranch — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { JudicialBranchRow } from './types';

interface ColumnActions {
  onEdit: (row: JudicialBranchRow) => void;
  onDelete: (row: JudicialBranchRow) => void;
}

export function getJudicialBranchColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<JudicialBranchRow, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => (
        <div data-ai-id="judicial-branch-cell-name">
          <span className="font-medium">{row.original.name}</span>
          <span className="block text-xs text-muted-foreground">{row.original.slug}</span>
        </div>
      ),
    },
    {
      accessorKey: 'districtName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Comarca" />,
      cell: ({ row }) => <span data-ai-id="judicial-branch-cell-district">{row.original.districtName ?? '—'}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'contactName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Contato" />,
      cell: ({ row }) => <span data-ai-id="judicial-branch-cell-contact">{row.original.contactName ?? '—'}</span>,
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Telefone" />,
      cell: ({ row }) => <span data-ai-id="judicial-branch-cell-phone">{row.original.phone ?? '—'}</span>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="E-mail" />,
      cell: ({ row }) => <span data-ai-id="judicial-branch-cell-email">{row.original.email ?? '—'}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="judicial-branch-row-actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="judicial-branch-action-edit">
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="judicial-branch-action-delete">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
