// src/app/admin/states/analysis/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a análise de performance dos Estados. Inclui formatação de moeda,
 * percentual e renderização das principais cidades e categorias por faturamento.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { StatePerformanceData } from './actions';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

export const createColumns = (): ColumnDef<StatePerformanceData>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("name")} ({row.original.uf})
      </div>
    ),
  },
  {
    accessorKey: "totalLots",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Lotes" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("totalLots")}</div>,
  },
  {
    accessorKey: "salesRate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Taxa Venda (%)" />,
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
    accessorKey: "cityWithHighestRevenue",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cidade Destaque" />,
    cell: ({ row }) => row.getValue("cityWithHighestRevenue"),
  },
  {
    accessorKey: "mostValuableCategory",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria Destaque" />,
    cell: ({ row }) => row.getValue("mostValuableCategory"),
  },
];
