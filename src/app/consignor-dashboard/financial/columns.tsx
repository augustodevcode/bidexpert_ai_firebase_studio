// src/app/consignor-dashboard/financial/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { UserWin } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPaymentStatusText } from '@/lib/sample-data-helpers';

export const createFinancialColumns = (): ColumnDef<UserWin>[] => [
  {
    accessorKey: 'lot.title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lote Arrematado" />,
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.lot.title}</p>
        <p className="text-xs text-muted-foreground">Lote #{row.original.lot.number}</p>
      </div>
    ),
  },
  {
    accessorKey: 'winDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data do Arremate" />,
    cell: ({ row }) => format(new Date(row.getValue("winDate")), "dd/MM/yyyy", { locale: ptBR }),
  },
  {
    accessorKey: 'winningBidAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor do Arremate" />,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("winningBidAmount"));
      return <div className="text-right font-medium">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>;
    },
  },
  {
    accessorKey: 'paymentStatus',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status Pagamento" />,
    cell: ({ row }) => <Badge variant="outline">{getPaymentStatusText(row.getValue("paymentStatus"))}</Badge>,
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: 'commission',
    header: () => <div className="text-right">Comissão (5%)</div>,
    cell: ({ row }) => {
      const amount = row.original.winningBidAmount * 0.05;
      return <div className="text-right">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>;
    },
  },
  {
    accessorKey: 'netValue',
    header: () => <div className="text-right">Valor a Receber</div>,
    cell: ({ row }) => {
      const amount = row.original.winningBidAmount * 0.95;
      return <div className="text-right font-bold">{amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>;
    },
  },
];
