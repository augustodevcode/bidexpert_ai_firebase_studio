// src/app/admin/judicial-branches/analysis/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { BranchPerformanceData } from './actions';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import Link from 'next/link';

export const createBranchAnalysisColumns = (): ColumnDef<BranchPerformanceData>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vara" />,
    cell: ({ row }) => (
      <Link href={`/admin/judicial-branches/${row.original.id}/edit`} className="hover:text-primary font-medium">
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "totalProcesses",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Processos" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("totalProcesses")}</div>,
  },
  {
    accessorKey: "totalAuctions",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leilões" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("totalAuctions")}</div>,
  },
  {
    accessorKey: "totalLotsSold",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lotes Vendidos" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("totalLotsSold")}</div>,
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
];
