// src/app/admin/auctioneers/analysis/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { AuctioneerPerformanceData } from './actions';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export const createAuctioneerAnalysisColumns = (): ColumnDef<AuctioneerPerformanceData>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leiloeiro" />,
    cell: ({ row }) => (
      <Link href={`/admin/auctioneers/${row.original.id}/edit`} className="hover:text-primary font-medium">
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "totalAuctions",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leilões" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("totalAuctions")}</div>,
  },
  {
    accessorKey: "totalLots",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total de Lotes" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("totalLots")}</div>,
  },
   {
    accessorKey: "salesRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Taxa de Venda (%)" />,
    cell: ({ row }) => <div className="text-right">{`${Number(row.getValue("salesRate")).toFixed(1)}%`}</div>,
  },
  {
    accessorKey: "totalRevenue",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Faturamento (Vendido)" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalRevenue"));
      return <div className="text-right font-medium">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>;
    },
  },
  {
    accessorKey: "averageTicket",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ticket Médio" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("averageTicket"));
      return <div className="text-right font-medium">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>;
    },
  },
   {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/admin/auctioneers/${row.original.id}/edit`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Detalhes</span>
                </Link>
            </Button>
        </div>
      );
    },
  },
];
