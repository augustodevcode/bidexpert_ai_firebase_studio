/**
 * Definição de colunas para AuctionHabilitation (DataTable).
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { AuctionHabilitationRow } from './types';

interface Opts {
  onEdit: (row: AuctionHabilitationRow) => void;
  onDelete: (row: AuctionHabilitationRow) => void;
}

export function getAuctionHabilitationColumns({ onEdit, onDelete }: Opts): ColumnDef<AuctionHabilitationRow>[] {
  return [
    { accessorKey: 'userName', header: ({ column }) => <DataTableColumnHeader column={column} title="Usuário" />, enableSorting: true },
    { accessorKey: 'auctionTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" />, enableSorting: true },
    { accessorKey: 'habilitatedAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Habilitado em" />, cell: ({ row }) => new Date(row.original.habilitatedAt).toLocaleDateString('pt-BR'), enableSorting: true },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
