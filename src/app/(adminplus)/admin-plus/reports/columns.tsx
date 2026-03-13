/**
 * @fileoverview Colunas da DataTable para Report no Admin Plus.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { ReportRow } from './types';

interface Options {
  onEdit: (row: ReportRow) => void;
  onDelete: (row: ReportRow) => void;
}

export function getReportColumns({ onEdit, onDelete }: Options): ColumnDef<ReportRow>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      enableSorting: true,
    },
    {
      accessorKey: 'description',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />,
      cell: ({ row }) => <span className="line-clamp-2 max-w-[320px]">{row.original.description || '-'}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'createdByName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Criado por" />,
      enableSorting: false,
    },
    {
      accessorKey: 'definitionPreview',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Definição" />,
      cell: ({ row }) => <code className="line-clamp-2 inline-block max-w-[360px] text-xs">{row.original.definitionPreview}</code>,
      enableSorting: false,
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Atualizado em" />,
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString('pt-BR'),
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ações do relatório">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}