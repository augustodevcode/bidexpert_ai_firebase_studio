// src/app/admin/users/analysis/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { UserPerformanceData } from './actions';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export const createUserAnalysisColumns = (): ColumnDef<UserPerformanceData>[] => [
  {
    accessorKey: "fullName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Usuário" />,
    cell: ({ row }) => (
      <Link href={`/admin/users/${row.original.id}/edit`} className="hover:text-primary font-medium">
        <div>
          <p>{row.getValue("fullName")}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "habilitationStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status Habilitação" />,
    cell: ({ row }) => {
      const statusInfo = getUserHabilitationStatusInfo(row.getValue("habilitationStatus"));
      return <Badge variant="outline">{statusInfo.text}</Badge>;
    },
     filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "totalBids",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total de Lances" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("totalBids")}</div>,
  },
  {
    accessorKey: "lotsWon",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lotes Arrematados" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("lotsWon")}</div>,
  },
  {
    accessorKey: "totalSpent",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor Total Gasto (R$)" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalSpent"));
      return <div className="text-right font-medium">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>;
    },
  },
   {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/admin/users/${row.original.id}/edit`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Detalhes do Usuário</span>
                </Link>
            </Button>
        </div>
      );
    },
  },
];
