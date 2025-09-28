// src/app/admin/categories/analysis/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a análise de performance das categorias de lotes. Inclui formatação
 * de moeda e links para as páginas de edição de cada categoria.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { CategoryPerformanceData } from './actions';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export const createCategoryAnalysisColumns = (): ColumnDef<CategoryPerformanceData>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
    cell: ({ row }) => (
      <Link href={`/admin/categories/${row.original.id}/edit`} className="hover:text-primary font-medium">
        {row.getValue("name")}
      </Link>
    ),
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
