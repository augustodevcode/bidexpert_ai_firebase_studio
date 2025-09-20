// src/app/admin/cities/analysis/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a análise de performance das Cidades. Inclui formatação de moeda,
 * percentual e links para as páginas de detalhes.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { CityPerformanceData } from './actions';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import Link from 'next/link';

export const createCityAnalysisColumns = (): ColumnDef<CityPerformanceData>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cidade" />,
    cell: ({ row }) => (
      <Link href={`/admin/cities/${row.original.id}/edit`} className="hover:text-primary font-medium">
        {row.getValue("name")}
      </Link>
    ),
  },
   {
    accessorKey: "stateUf",
    header: ({ column }) => <DataTableColumnHeader column={column} title="UF" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("stateUf")}</div>,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Faturamento (Vendido)" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalRevenue"));
      return <div className="text-right font-medium">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>;
    },
  },
];
