/**
 * @fileoverview Colunas da tabela JudicialProcess — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { JudicialProcessRow } from './types';

interface ColumnActions {
  onEdit: (row: JudicialProcessRow) => void;
  onDelete: (row: JudicialProcessRow) => void;
}

export function getJudicialProcessColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<JudicialProcessRow, unknown>[] {
  return [
    {
      accessorKey: 'processNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nº Processo" />,
      cell: ({ row }) => (
        <div data-ai-id="judicial-process-cell-number">
          <span className="font-medium font-mono text-sm">{row.original.processNumber}</span>
          <span className="block text-xs text-muted-foreground">{row.original.publicId}</span>
        </div>
      ),
    },
    {
      accessorKey: 'actionType',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo de Ação" />,
      cell: ({ row }) => (
        <span data-ai-id="judicial-process-cell-actionType">
          {row.original.actionType ? (
            <Badge variant="outline">{row.original.actionType}</Badge>
          ) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'courtName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tribunal" />,
      cell: ({ row }) => <span data-ai-id="judicial-process-cell-court">{row.original.courtName ?? '—'}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'districtName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Comarca" />,
      cell: ({ row }) => <span data-ai-id="judicial-process-cell-district">{row.original.districtName ?? '—'}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'branchName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vara" />,
      cell: ({ row }) => <span data-ai-id="judicial-process-cell-branch">{row.original.branchName ?? '—'}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'isElectronic',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Eletrônico" />,
      cell: ({ row }) => (
        <Badge variant={row.original.isElectronic ? 'default' : 'secondary'} data-ai-id="judicial-process-cell-electronic">
          {row.original.isElectronic ? 'Sim' : 'Não'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="judicial-process-row-actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="judicial-process-action-edit">
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="judicial-process-action-delete">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
