/**
 * Colunas da tabela de Reviews.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { ReviewRow } from './types';

interface ColumnActions {
  onEdit: (row: ReviewRow) => void;
  onDelete: (row: ReviewRow) => void;
}

export function getReviewColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<ReviewRow>[] {
  return [
    { accessorKey: 'userDisplayName', header: ({ column }) => <DataTableColumnHeader column={column} title="Avaliador" />, cell: ({ row }) => <span className="font-medium">{row.getValue('userDisplayName')}</span> },
    { accessorKey: 'lotTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" /> },
    { accessorKey: 'auctionTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" /> },
    { accessorKey: 'rating', header: ({ column }) => <DataTableColumnHeader column={column} title="Nota" />, cell: ({ row }) => { const r = row.getValue('rating') as number; return <span className="flex items-center gap-1">{r} <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" aria-hidden="true" /></span>; } },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />, cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString('pt-BR') },
    { id: 'actions', cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) },
  ];
}
