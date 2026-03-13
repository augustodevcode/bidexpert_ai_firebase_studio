/**
 * Definição de colunas da tabela de ParticipationHistory no Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { ParticipationHistoryRow } from './types';

const resultVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  WON: 'default',
  LOST: 'destructive',
  WITHDRAWN: 'secondary',
};

const resultLabel: Record<string, string> = { WON: 'Venceu', LOST: 'Perdeu', WITHDRAWN: 'Desistiu' };

export function getParticipationHistoryColumns({ onEdit, onDelete }: { onEdit: (r: ParticipationHistoryRow) => void; onDelete: (r: ParticipationHistoryRow) => void }): ColumnDef<ParticipationHistoryRow>[] {
  return [
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Título" /> },
    { accessorKey: 'auctionName', header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" /> },
    { accessorKey: 'bidderName', header: ({ column }) => <DataTableColumnHeader column={column} title="Arrematante" /> },
    { accessorKey: 'result', header: ({ column }) => <DataTableColumnHeader column={column} title="Resultado" />, cell: ({ row }) => <Badge variant={resultVariant[row.original.result] ?? 'outline'}>{resultLabel[row.original.result] ?? row.original.result}</Badge> },
    { accessorKey: 'maxBid', header: ({ column }) => <DataTableColumnHeader column={column} title="Lance Máx" />, cell: ({ row }) => row.original.maxBid || '-' },
    { accessorKey: 'finalBid', header: ({ column }) => <DataTableColumnHeader column={column} title="Lance Final" />, cell: ({ row }) => row.original.finalBid || '-' },
    { accessorKey: 'bidCount', header: ({ column }) => <DataTableColumnHeader column={column} title="Lances" /> },
    { accessorKey: 'participatedAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Participou em" />, cell: ({ row }) => row.original.participatedAt?.substring(0, 10) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-ai-id="ph-actions-trigger"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="ph-edit-btn">Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="ph-delete-btn">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
