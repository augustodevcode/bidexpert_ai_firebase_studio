/**
 * Colunas da tabela de UserLotMaxBid.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { UserLotMaxBidRow } from './types';

const currencyFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface ColumnActions {
  onEdit: (row: UserLotMaxBidRow) => void;
  onDelete: (row: UserLotMaxBidRow) => void;
}

export function getUserLotMaxBidColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<UserLotMaxBidRow>[] {
  return [
    { accessorKey: 'userName', header: ({ column }) => <DataTableColumnHeader column={column} title="Usuário" />, cell: ({ row }) => <span className="font-medium">{row.getValue('userName')}</span> },
    { accessorKey: 'lotTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" /> },
    { accessorKey: 'maxAmount', header: ({ column }) => <DataTableColumnHeader column={column} title="Valor Máximo" />, cell: ({ row }) => currencyFmt.format(row.getValue('maxAmount')) },
    { accessorKey: 'isActive', header: ({ column }) => <DataTableColumnHeader column={column} title="Ativo" />, cell: ({ row }) => <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>{row.getValue('isActive') ? 'Sim' : 'Não'}</Badge> },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />, cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString('pt-BR') },
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
