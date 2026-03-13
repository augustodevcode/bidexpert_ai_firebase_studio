/**
 * Column definitions for the Lot entity data table (Admin Plus).
 * Displays title+number, auction, status badge, price, category, city/state, dates, and actions.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { LotRow } from './types';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  RASCUNHO: 'outline',
  AGUARDANDO: 'secondary',
  EM_BREVE: 'secondary',
  ABERTO_PARA_LANCES: 'default',
  EM_PREGAO: 'default',
  ENCERRADO: 'secondary',
  VENDIDO: 'default',
  NAO_VENDIDO: 'destructive',
  RELISTADO: 'outline',
  CANCELADO: 'destructive',
  RETIRADO: 'destructive',
};

interface GetLotColumnsProps {
  onEdit: (row: LotRow) => void;
  onDelete: (row: LotRow) => void;
}

export function getLotColumns({ onEdit, onDelete }: GetLotColumnsProps): ColumnDef<LotRow>[] {
  return [
    {
      accessorKey: 'publicId',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.publicId}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
      cell: ({ row }) => (
        <div data-ai-id="lot-title-cell">
          <span className="font-medium">{row.original.title}</span>
          {row.original.number != null && (
            <span className="ml-2 text-xs text-muted-foreground">#{row.original.number}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'auctionTitle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" />,
      cell: ({ row }) => row.original.auctionTitle || '—',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <Badge variant={statusVariant[s] ?? 'outline'} data-ai-id="lot-status-badge">
            {s.replace(/_/g, ' ')}
          </Badge>
        );
      },
      size: 140,
    },
    {
      accessorKey: 'price',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Preço" />,
      cell: ({ row }) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
          row.original.price
        ),
      size: 130,
    },
    {
      accessorKey: 'categoryName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
      cell: ({ row }) => row.original.categoryName || '—',
    },
    {
      accessorKey: 'cityName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cidade / UF" />,
      cell: ({ row }) => {
        const city = row.original.cityName;
        const uf = row.original.stateUf;
        if (!city && !uf) return '—';
        return `${city ?? ''}${uf ? ` / ${uf}` : ''}`;
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />,
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString('pt-BR'),
      size: 110,
    },
    {
      id: 'actions',
      size: 60,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="lot-row-actions">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
