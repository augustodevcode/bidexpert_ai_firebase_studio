/**
 * Definição de colunas da tabela de Subscriber no Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { SubscriberRow } from './types';

export function getSubscriberColumns({ onEdit, onDelete }: { onEdit: (row: SubscriberRow) => void; onDelete: (row: SubscriberRow) => void }): ColumnDef<SubscriberRow>[] {
  return [
    { accessorKey: 'email', header: ({ column }) => <DataTableColumnHeader column={column} title="Email" /> },
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />, cell: ({ row }) => row.original.name || '-' },
    { accessorKey: 'phone', header: ({ column }) => <DataTableColumnHeader column={column} title="Telefone" />, cell: ({ row }) => row.original.phone || '-' },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />, cell: ({ row }) => row.original.createdAt?.substring(0, 10) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-ai-id="subscriber-actions-trigger"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="subscriber-edit-btn">Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="subscriber-delete-btn">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
