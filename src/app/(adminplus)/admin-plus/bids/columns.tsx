/**
 * Column definitions for the Bid data table (Admin Plus CRUD).
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus';
import type { BidRow } from './types';

const statusVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  ATIVO: 'default',
  VENCEDOR: 'default',
  CANCELADO: 'destructive',
  EXPIRADO: 'secondary',
};

interface ColumnActions {
  onEdit: (row: BidRow) => void;
  onDelete: (row: BidRow) => void;
}

export function getBidColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<BidRow>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
      size: 80,
    },
    {
      accessorKey: 'lotTitle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" />,
      cell: ({ row }) => <span className="font-medium">{row.original.lotTitle}</span>,
    },
    {
      accessorKey: 'auctionTitle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" />,
    },
    {
      accessorKey: 'bidderName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Arrematante" />,
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />,
      cell: ({ row }) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.original.amount),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] ?? 'outline'} data-ai-id="bid-status-badge">
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'bidOrigin',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Origem" />,
      cell: ({ row }) => <Badge variant="outline">{row.original.bidOrigin}</Badge>,
    },
    {
      accessorKey: 'timestamp',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data/Hora" />,
      cell: ({ row }) => new Date(row.original.timestamp).toLocaleString('pt-BR'),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="bid-row-actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 60,
    },
  ];
}
