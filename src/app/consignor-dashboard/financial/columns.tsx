// src/app/consignor-dashboard/financial/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * na página financeira do Painel do Comitente. A configuração inclui formatação
 * de moeda para valores de arremate, comissão e valor líquido, além de badges
 * para o status do pagamento.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { UserWin } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPaymentStatusText } from '@/lib/ui-helpers';
import React, { useState, useEffect } from 'react';

const ClientOnlyDate = ({ date }: { date: string | Date | null | undefined }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (date) {
            try {
                setFormattedDate(format(new Date(date as string), "dd/MM/yyyy", { locale: ptBR }));
            } catch {
                setFormattedDate('Data inválida');
            }
        } else {
            setFormattedDate('N/A');
        }
    }, [date]);

    return <span>{formattedDate}</span>;
}


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
    cell: ({ row }) => <ClientOnlyDate date={row.getValue("winDate")} />,
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