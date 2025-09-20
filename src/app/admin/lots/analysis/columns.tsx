
// src/app/admin/lots/analysis/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { LotPerformanceData } from './actions';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export const createLotAnalysisColumns = (): ColumnDef<LotPerformanceData>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" />,
    cell: ({ row }) => (
      <Link href={`/admin/lots/${row.original.id}/edit`} className="hover:text-primary font-medium">
        <p className="line-clamp-2">{`#${row.original.number} - ${row.getValue("title")}`}</p>
        <span className="text-xs text-muted-foreground">{row.original.publicId}</span>
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge variant="outline">{getAuctionStatusText(row.getValue("status"))}</Badge>,
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "bidsCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lances" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("bidsCount")}</div>,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor Final/Atual (R$)" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"));
      return <div className="text-right font-medium">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>;
    },
  },
  {
    accessorKey: "categoryName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "auctionName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" />,
    cell: ({ row }) => (
      <Link href={`/admin/auctions/${row.original.auctionId}/edit`} className="text-xs hover:text-primary truncate">
        {row.getValue("auctionName")}
      </Link>
    )
  },
   {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/auctions/${row.original.auctionId}/lots/${row.original.publicId || row.original.id}`} target="_blank">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Lote</span>
                </Link>
            </Button>
        </div>
      );
    },
  },
];
