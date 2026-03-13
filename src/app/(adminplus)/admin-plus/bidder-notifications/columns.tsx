/**
 * Definição das colunas da tabela de BidderNotification no Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus';
import type { BidderNotificationRow } from './types';
import { BIDDER_NOTIFICATION_TYPE_OPTIONS } from './schema';

const typeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AUCTION_WON: 'default',
  PAYMENT_DUE: 'secondary',
  PAYMENT_OVERDUE: 'destructive',
  DOCUMENT_APPROVED: 'default',
  DOCUMENT_REJECTED: 'destructive',
  DELIVERY_UPDATE: 'outline',
  AUCTION_ENDING: 'secondary',
  SYSTEM_UPDATE: 'outline',
};

export function getBidderNotificationColumns({ onEdit, onDelete }: { onEdit: (row: BidderNotificationRow) => void; onDelete: (row: BidderNotificationRow) => void }): ColumnDef<BidderNotificationRow>[] {
  return [
    { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />, size: 80 },
    { accessorKey: 'bidderName', header: ({ column }) => <DataTableColumnHeader column={column} title="Arrematante" /> },
    { accessorKey: 'type', header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />, cell: ({ row }) => { const v = row.getValue('type') as string; const label = BIDDER_NOTIFICATION_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v; return <Badge variant={typeVariant[v] || 'outline'}>{label}</Badge>; } },
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Título" /> },
    { accessorKey: 'isRead', header: ({ column }) => <DataTableColumnHeader column={column} title="Lida?" />, cell: ({ row }) => row.getValue('isRead') ? <Badge variant="default">Sim</Badge> : <Badge variant="outline">Não</Badge>, size: 80 },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />, cell: ({ row }) => { const v = row.getValue('createdAt') as string; return v ? new Date(v).toLocaleString('pt-BR') : '-'; } },
    { id: 'actions', size: 60, cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-ai-id="bidder-notification-actions-btn"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>Editar</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(row.original)}>Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) },
  ];
}
