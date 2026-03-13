/**
 * Definição de colunas da tabela de Notification (Notificações).
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { NotificationRow } from './types';

export function getNotificationColumns({ onEdit, onDelete }: { onEdit: (r: NotificationRow) => void; onDelete: (r: NotificationRow) => void }): ColumnDef<NotificationRow>[] {
  return [
    { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />, size: 80 },
    { accessorKey: 'userName', header: ({ column }) => <DataTableColumnHeader column={column} title="Usuário" /> },
    { accessorKey: 'message', header: ({ column }) => <DataTableColumnHeader column={column} title="Mensagem" />, cell: ({ row }) => <span className="line-clamp-2 max-w-xs">{row.original.message}</span> },
    { accessorKey: 'isRead', header: ({ column }) => <DataTableColumnHeader column={column} title="Lida" />, cell: ({ row }) => <Badge variant={row.original.isRead ? 'default' : 'secondary'}>{row.original.isRead ? 'Sim' : 'Não'}</Badge>, size: 80 },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />, cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('pt-BR') },
    {
      id: 'actions', size: 60,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
