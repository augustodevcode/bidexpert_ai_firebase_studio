// src/app/consignor-dashboard/lots/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { Lot } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getAuctionStatusText } from '@/lib/sample-data-helpers';

export const createConsignorLotColumns = (): ColumnDef<Lot>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" />,
    cell: ({ row }) => (
      <div className="font-medium">
        <Link href={`/admin/lots/${row.original.publicId || row.original.id}/edit`} className="hover:text-primary">
          {row.original.number ? `#${row.original.number}: ` : ''}{row.getValue("title")}
        </Link>
        <p className="text-xs text-muted-foreground">Leilão: {row.original.auctionName}</p>
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
      const price = parseFloat(row.getValue("price"));
      if (isNaN(price)) return 'N/A';
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);
      return <div className="text-right font-medium">{formatted}</div>;
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
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" /> Ver Lote
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/lots/${lot.publicId || lot.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Editar Lote
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
