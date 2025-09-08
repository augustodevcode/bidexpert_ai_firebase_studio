// src/app/admin/lots/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import type { Lot } from '@bidexpert/core';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getAuctionStatusText } from '@bidexpert/core';

export const createColumns = (): ColumnDef<Lot>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título do Lote" />,
    cell: ({ row }) => (
      <div className="font-medium">
        <Link href={`/admin/lots/${row.original.id}/edit`} className="hover:text-primary">
          Lote {row.original.number}: {row.getValue("title")}
        </Link>
        <p className="text-xs text-muted-foreground truncate" title={row.original.auctionName}>Leilão: {row.original.auctionName}</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge variant="outline">{getAuctionStatusText(row.getValue("status"))}</Badge>,
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor Atual (R$)" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"));
      if (isNaN(amount)) return 'N/A';
      return <div className="text-right font-medium">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>;
    },
  },
  {
    accessorKey: "bidsCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lances" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("bidsCount") || 0}</div>
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lot = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" data-ai-id="data-table-row-actions-menu">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`} target="_blank"><Eye className="mr-2 h-4 w-4" />Ver Lote</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/lots/${lot.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Editar</Link>
            </DropdownMenuItem>
             <DropdownMenuSeparator />
            <DropdownMenuItem data-action="delete" data-id={lot.id} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
