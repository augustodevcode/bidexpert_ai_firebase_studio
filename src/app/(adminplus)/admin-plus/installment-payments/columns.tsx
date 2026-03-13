/**
 * Definição de colunas da tabela de InstallmentPayment (Parcelas de Pagamento).
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { InstallmentPaymentRow } from './types';

const currFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function statusBadge(s: string) {
  const v: Record<string, string> = { PAGO: 'default', PENDENTE: 'secondary', PROCESSANDO: 'outline', FALHOU: 'destructive', ATRASADO: 'destructive', CANCELADO: 'destructive', REEMBOLSADO: 'outline' };
  return <Badge variant={(v[s] as any) ?? 'secondary'}>{s}</Badge>;
}

export function getInstallmentPaymentColumns({ onEdit, onDelete }: { onEdit: (r: InstallmentPaymentRow) => void; onDelete: (r: InstallmentPaymentRow) => void }): ColumnDef<InstallmentPaymentRow>[] {
  return [
    { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />, size: 80 },
    { accessorKey: 'userWinLabel', header: ({ column }) => <DataTableColumnHeader column={column} title="Arrematação" /> },
    { accessorKey: 'installmentNumber', header: ({ column }) => <DataTableColumnHeader column={column} title="Parcela" />, size: 90 },
    { accessorKey: 'amount', header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />, cell: ({ row }) => currFmt.format(row.original.amount) },
    { accessorKey: 'dueDate', header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimento" />, cell: ({ row }) => new Date(row.original.dueDate).toLocaleDateString('pt-BR') },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => statusBadge(row.original.status) },
    {
      id: 'actions', size: 60,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
