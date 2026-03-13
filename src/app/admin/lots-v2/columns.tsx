// src/app/admin/lots-v2/columns.tsx
/**
 * @fileoverview Colunas da DataTable V2 para listagem de Lotes.
 * Usa TanStack Table com suporte a seleção, ordenação, badge de status
 * e menu de ações por linha.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Pencil, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { Lot } from '@/types';
import { cn } from '@/lib/utils';
import { LOT_STATUS_LABELS, LOT_STATUS_COLORS } from './lot-form-schema-v2';
import { formatCurrency } from '@/lib/format';

interface CreateColumnsOptions {
  onDelete: (id: string) => void;
}

export const createColumnsV2 = ({ onDelete }: CreateColumnsOptions): ColumnDef<Lot>[] => [
  // ─── Seleção ──────────────────────────────────────────────────────────
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // ─── Número / Título ──────────────────────────────────────────────────
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" />,
    cell: ({ row }) => (
      <div>
        <Link
          href={`/admin/lots-v2/${row.original.id}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {row.original.number ? `Lote ${row.original.number}: ` : ''}
          {row.getValue('title')}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">
          ID: {row.original.publicId || row.original.id}
        </p>
      </div>
    ),
  },

  // ─── Status ───────────────────────────────────────────────────────────
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue<string>('status');
      return (
        <Badge
          className={cn('text-xs font-medium', LOT_STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground')}
          variant="outline"
        >
          {LOT_STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },

  // ─── Leilão ───────────────────────────────────────────────────────────
  {
    accessorKey: 'auctionName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" />,
    cell: ({ row }) =>
      row.original.auctionId ? (
        <Link
          href={`/admin/auctions-v2/${row.original.auctionId}`}
          className="text-sm hover:text-primary transition-colors truncate max-w-[160px] block"
        >
          {row.original.auctionName ?? '—'}
        </Link>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },

  // ─── Lance mínimo ─────────────────────────────────────────────────────
  {
    accessorKey: 'price',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lance Mínimo" />,
    cell: ({ row }) => {
      const price = row.getValue<number>('price');
      if (!price && price !== 0) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="font-medium tabular-nums">
          {formatCurrency(price)}
        </span>
      );
    },
  },

  // ─── Avaliação ────────────────────────────────────────────────────────
  {
    accessorKey: 'initialPrice',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Avaliação" />,
    cell: ({ row }) => {
      const val = row.getValue<number | null>('initialPrice');
      if (!val) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatCurrency(val)}
        </span>
      );
    },
  },

  // ─── Tipo ─────────────────────────────────────────────────────────────
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground capitalize">
        {(row.getValue<string>('type') ?? '—').toLowerCase()}
      </span>
    ),
  },

  // ─── Ações ────────────────────────────────────────────────────────────
  {
    id: 'actions',
    header: () => <span className="sr-only">Ações</span>,
    cell: ({ row }) => {
      const lot = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Abrir menu de ações">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/lots-v2/${lot.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar / Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/lots/${lot.publicId || lot.id}`} target="_blank" rel="noopener noreferrer">
                <Package className="h-4 w-4 mr-2" />
                Ver página pública
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(lot.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
