// src/app/admin/auctions/analysis/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a análise de performance dos leilões. Inclui formatação de moeda,
 * percentual, renderização de status com badges e links para páginas de detalhes.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { AuctionPerformanceData } from './actions';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export const createAuctionAnalysisColumns = (): ColumnDef<AuctionPerformanceData>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" />,
    cell: ({ row }) => (
      <Link href={`/admin/auctions/${row.original.id}/edit`} className="hover:text-primary font-medium">
        {row.getValue("title")}
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
    accessorKey: "totalLots",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total de Lotes" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("totalLots")}</div>,
  },
  {
    accessorKey: "lotsSoldCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lotes Vendidos" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("lotsSoldCount")}</div>,
  },
  {
    accessorKey: "salesRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Taxa de Venda (%)" />,
    cell: ({ row }) => <div className="text-right">{`${Number(row.getValue("salesRate")).toFixed(1)}%`}</div>,
  },
  {
    accessorKey: "totalRevenue",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Faturamento Total" />,
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
                <Link href={`/admin/auctions/${row.original.id}/edit`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Detalhes</span>
                </Link>
            </Button>
        </div>
      );
    },
  },
];
