/**
 * Definição de colunas da tabela de TenantInvoice no Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { TenantInvoiceRow } from './types';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  PAID: 'default',
  OVERDUE: 'destructive',
  CANCELLED: 'secondary',
  REFUNDED: 'secondary',
};

const statusLabel: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function getTenantInvoiceColumns({ onEdit, onDelete }: { onEdit: (row: TenantInvoiceRow) => void; onDelete: (row: TenantInvoiceRow) => void }): ColumnDef<TenantInvoiceRow>[] {
  return [
    { accessorKey: 'invoiceNumber', header: ({ column }) => <DataTableColumnHeader column={column} title="Nº Fatura" />, cell: ({ row }) => <span className="font-mono text-sm">{row.original.invoiceNumber}</span> },
    { accessorKey: 'tenantName', header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant" /> },
    { accessorKey: 'amount', header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />, cell: ({ row }) => currencyFormatter.format(Number(row.original.amount)) },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => <Badge variant={statusVariant[row.original.status] ?? 'outline'}>{statusLabel[row.original.status] ?? row.original.status}</Badge> },
    { accessorKey: 'dueDate', header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimento" />, cell: ({ row }) => row.original.dueDate?.substring(0, 10) },
    { accessorKey: 'paidAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Pago em" />, cell: ({ row }) => row.original.paidAt?.substring(0, 10) || '-' },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />, cell: ({ row }) => row.original.createdAt?.substring(0, 10) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-ai-id="tenant-invoice-actions-trigger"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="tenant-invoice-edit-btn">Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="tenant-invoice-delete-btn">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
