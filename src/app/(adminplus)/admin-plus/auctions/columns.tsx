/**
 * @fileoverview Colunas da DataTable de Auctions — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { AuctionRow } from './types';
import { AUCTION_STATUSES, AUCTION_TYPES } from './schema';

interface ColumnActions {
  onEdit: (row: AuctionRow) => void;
  onDelete: (row: AuctionRow) => void;
}

const statusMap = Object.fromEntries(AUCTION_STATUSES.map((s) => [s.value, s.label]));
const typeMap = Object.fromEntries(AUCTION_TYPES.map((t) => [t.value, t.label]));

const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (['ABERTO', 'ABERTO_PARA_LANCES', 'EM_PREGAO'].includes(s)) return 'default';
  if (['ENCERRADO', 'FINALIZADO'].includes(s)) return 'secondary';
  if (['CANCELADO', 'SUSPENSO'].includes(s)) return 'destructive';
  return 'outline';
};

export function getAuctionColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<AuctionRow>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
      cell: ({ row }) => (
        <div data-ai-id="auction-cell-title">
          <span className="font-medium">{row.original.title}</span>
          {row.original.publicId && (
            <span className="ml-2 text-xs text-muted-foreground">{row.original.publicId}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)} data-ai-id="auction-cell-status">
          {statusMap[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'auctionType',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
      cell: ({ row }) => (
        <span data-ai-id="auction-cell-type">
          {row.original.auctionType ? (typeMap[row.original.auctionType] ?? row.original.auctionType) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'auctioneerName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Leiloeiro" />,
      cell: ({ row }) => <span data-ai-id="auction-cell-auctioneer">{row.original.auctioneerName ?? '—'}</span>,
    },
    {
      accessorKey: 'totalLots',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lotes" />,
      cell: ({ row }) => <span data-ai-id="auction-cell-lots">{row.original.totalLots}</span>,
    },
    {
      accessorKey: 'auctionDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
      cell: ({ row }) => (
        <span data-ai-id="auction-cell-date">
          {row.original.auctionDate
            ? new Date(row.original.auctionDate).toLocaleDateString('pt-BR')
            : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="auction-row-actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="auction-action-edit">
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="auction-action-delete">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
