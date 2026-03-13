/**
 * @fileoverview Colunas da tabela AuctionStage — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { AuctionStageRow } from './types';
import { AUCTION_STAGE_STATUSES } from './schema';

interface Props {
  onEdit: (row: AuctionStageRow) => void;
  onDelete: (row: AuctionStageRow) => void;
}

export function getAuctionStageColumns({ onEdit, onDelete }: Props): ColumnDef<AuctionStageRow>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
    },
    {
      accessorKey: 'auctionTitle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" />,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const v = row.getValue('status') as string;
        const lbl = AUCTION_STAGE_STATUSES.find((s) => s.value === v)?.label ?? v;
        const variant = ['ABERTO', 'EM_ANDAMENTO'].includes(v) ? 'default'
          : ['CONCLUIDO', 'FECHADO'].includes(v) ? 'secondary'
          : v === 'CANCELADO' ? 'destructive' : 'outline';
        return <Badge variant={variant} data-ai-id="auction-stage-status-badge">{lbl}</Badge>;
      },
    },
    {
      accessorKey: 'discountPercent',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Desconto %" />,
      cell: ({ row }) => `${row.getValue('discountPercent')}%`,
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Início" />,
      cell: ({ row }) => {
        const d = row.getValue('startDate') as string;
        return d ? new Date(d).toLocaleDateString('pt-BR') : '—';
      },
    },
    {
      accessorKey: 'endDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fim" />,
      cell: ({ row }) => {
        const d = row.getValue('endDate') as string;
        return d ? new Date(d).toLocaleDateString('pt-BR') : '—';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="auction-stage-row-actions"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="auction-stage-edit-btn"><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="auction-stage-delete-btn"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
