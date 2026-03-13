/**
 * Definição de colunas para tabela de LotStagePrice.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { LotStagePriceRow } from './types';

interface Options { onEdit: (row: LotStagePriceRow) => void; onDelete: (row: LotStagePriceRow) => void; }

const currFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function getLotStagePriceColumns({ onEdit, onDelete }: Options): ColumnDef<LotStagePriceRow>[] {
  return [
    { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />, cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>, size: 80 },
    { accessorKey: 'lotTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" />, cell: ({ row }) => <span className="font-medium">{row.original.lotTitle}</span> },
    { accessorKey: 'auctionTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" /> },
    { accessorKey: 'auctionStageTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Praça" /> },
    { accessorKey: 'initialBid', header: ({ column }) => <DataTableColumnHeader column={column} title="Lance Inicial" />, cell: ({ row }) => row.original.initialBid != null ? currFmt.format(row.original.initialBid) : '—' },
    { accessorKey: 'bidIncrement', header: ({ column }) => <DataTableColumnHeader column={column} title="Incremento" />, cell: ({ row }) => row.original.bidIncrement != null ? currFmt.format(row.original.bidIncrement) : '—' },
    { id: 'actions', size: 60, cell: ({ row }) => (
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-ai-id="lot-stage-price-actions-btn"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ];
}
