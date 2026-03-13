/**
 * @fileoverview Colunas da tabela JudicialDistrict — Admin Plus.
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
import type { JudicialDistrictRow } from './types';

interface ColumnActions {
  onEdit: (row: JudicialDistrictRow) => void;
  onDelete: (row: JudicialDistrictRow) => void;
}

export function getJudicialDistrictColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<JudicialDistrictRow, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => (
        <div data-ai-id="judicial-district-name-cell">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-muted-foreground ml-2 text-xs">{row.original.slug}</span>
        </div>
      ),
    },
    {
      accessorKey: 'courtName',
      header: 'Tribunal',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm" data-ai-id="judicial-district-court-cell">
          {row.original.courtName ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'stateName',
      header: 'Estado',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm" data-ai-id="judicial-district-state-cell">
          {row.original.stateName ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'zipCode',
      header: 'CEP',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm" data-ai-id="judicial-district-zip-cell">
          {row.original.zipCode ?? '—'}
        </span>
      ),
      size: 100,
    },
    {
      id: 'actions',
      size: 60,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-ai-id="judicial-district-actions-trigger">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-ai-id="judicial-district-actions-menu">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="judicial-district-edit-action">
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
              data-ai-id="judicial-district-delete-action"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
