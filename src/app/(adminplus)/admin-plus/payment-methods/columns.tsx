/**
 * Definição de colunas da tabela de PaymentMethod no Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { PaymentMethodRow } from './types';

const typeLabel: Record<string, string> = { CREDIT_CARD: 'Cartão Crédito', DEBIT_CARD: 'Cartão Débito', PIX: 'PIX', BOLETO: 'Boleto', BANK_TRANSFER: 'Transferência' };

export function getPaymentMethodColumns({ onEdit, onDelete }: { onEdit: (r: PaymentMethodRow) => void; onDelete: (r: PaymentMethodRow) => void }): ColumnDef<PaymentMethodRow>[] {
  return [
    { accessorKey: 'bidderName', header: ({ column }) => <DataTableColumnHeader column={column} title="Arrematante" /> },
    { accessorKey: 'type', header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />, cell: ({ row }) => <Badge variant="outline">{typeLabel[row.original.type] ?? row.original.type}</Badge> },
    { accessorKey: 'cardLast4', header: ({ column }) => <DataTableColumnHeader column={column} title="Final Cartão" />, cell: ({ row }) => row.original.cardLast4 ? `****${row.original.cardLast4}` : '-' },
    { accessorKey: 'pixKey', header: ({ column }) => <DataTableColumnHeader column={column} title="Chave PIX" />, cell: ({ row }) => row.original.pixKey || '-' },
    { accessorKey: 'isDefault', header: ({ column }) => <DataTableColumnHeader column={column} title="Padrão" />, cell: ({ row }) => row.original.isDefault ? 'Sim' : 'Não' },
    { accessorKey: 'isActive', header: ({ column }) => <DataTableColumnHeader column={column} title="Ativo" />, cell: ({ row }) => <Badge variant={row.original.isActive ? 'default' : 'secondary'}>{row.original.isActive ? 'Ativo' : 'Inativo'}</Badge> },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />, cell: ({ row }) => row.original.createdAt?.substring(0, 10) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-ai-id="pm-actions-trigger"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="pm-edit-btn">Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="pm-delete-btn">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
