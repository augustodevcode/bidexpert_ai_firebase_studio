/**
 * Definição de colunas da tabela de UserWin (Arrematações).
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { UserWinRow } from './types';

const currFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function paymentBadge(status: string) {
  const map: Record<string, string> = {
    PENDENTE: 'secondary',
    PROCESSANDO: 'outline',
    PAGO: 'default',
    FALHOU: 'destructive',
    REEMBOLSADO: 'outline',
    CANCELADO: 'destructive',
    ATRASADO: 'destructive',
  };
  return <Badge variant={(map[status] as any) ?? 'secondary'}>{status}</Badge>;
}

export function getUserWinColumns({ onEdit, onDelete }: { onEdit: (r: UserWinRow) => void; onDelete: (r: UserWinRow) => void }): ColumnDef<UserWinRow>[] {
  return [
    { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />, size: 80 },
    { accessorKey: 'lotTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" /> },
    { accessorKey: 'userName', header: ({ column }) => <DataTableColumnHeader column={column} title="Usuário" /> },
    {
      accessorKey: 'winningBidAmount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />,
      cell: ({ row }) => currFmt.format(row.original.winningBidAmount),
    },
    { accessorKey: 'winDate', header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />, cell: ({ row }) => new Date(row.original.winDate).toLocaleDateString('pt-BR') },
    {
      accessorKey: 'paymentStatus',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pagamento" />,
      cell: ({ row }) => paymentBadge(row.original.paymentStatus),
    },
    { accessorKey: 'retrievalStatus', header: ({ column }) => <DataTableColumnHeader column={column} title="Retirada" /> },
    {
      id: 'actions',
      size: 60,
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
