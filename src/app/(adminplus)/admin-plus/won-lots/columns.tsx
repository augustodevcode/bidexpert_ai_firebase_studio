/**
 * Definição de colunas para a tabela de WonLot no Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { WonLotRow } from './types';
import { WON_LOT_STATUS_OPTIONS, WON_LOT_PAYMENT_STATUS_OPTIONS, WON_LOT_DELIVERY_STATUS_OPTIONS } from './schema';

const statusLabel = Object.fromEntries(WON_LOT_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const paymentLabel = Object.fromEntries(WON_LOT_PAYMENT_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const deliveryLabel = Object.fromEntries(WON_LOT_DELIVERY_STATUS_OPTIONS.map((o) => [o.value, o.label]));

function statusVariant(s: string) {
  switch (s) { case 'PAID': case 'DELIVERED': return 'default'; case 'CANCELLED': return 'destructive'; default: return 'secondary'; }
}
function paymentVariant(s: string) {
  switch (s) { case 'PAGO': return 'default'; case 'FALHOU': case 'CANCELADO': return 'destructive'; case 'ATRASADO': return 'outline'; default: return 'secondary'; }
}
function deliveryVariant(s: string) {
  switch (s) { case 'DELIVERED': return 'default'; case 'FAILED': return 'destructive'; default: return 'secondary'; }
}

export function getWonLotColumns({ onEdit, onDelete }: { onEdit: (r: WonLotRow) => void; onDelete: (r: WonLotRow) => void }): ColumnDef<WonLotRow>[] {
  return [
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />, cell: ({ row }) => <span data-ai-id="won-lot-title">{row.original.title}</span> },
    { accessorKey: 'bidderName', header: ({ column }) => <DataTableColumnHeader column={column} title="Arrematante" />, cell: ({ row }) => row.original.bidderName || '-' },
    { accessorKey: 'finalBid', header: ({ column }) => <DataTableColumnHeader column={column} title="Lance Final" />, cell: ({ row }) => row.original.finalBid ? `R$ ${row.original.finalBid}` : '-' },
    { accessorKey: 'totalAmount', header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />, cell: ({ row }) => row.original.totalAmount ? `R$ ${row.original.totalAmount}` : '-' },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => <Badge variant={statusVariant(row.original.status)} data-ai-id="won-lot-status-badge">{statusLabel[row.original.status] ?? row.original.status}</Badge> },
    { accessorKey: 'paymentStatus', header: ({ column }) => <DataTableColumnHeader column={column} title="Pagamento" />, cell: ({ row }) => <Badge variant={paymentVariant(row.original.paymentStatus)} data-ai-id="won-lot-payment-badge">{paymentLabel[row.original.paymentStatus] ?? row.original.paymentStatus}</Badge> },
    { accessorKey: 'deliveryStatus', header: ({ column }) => <DataTableColumnHeader column={column} title="Entrega" />, cell: ({ row }) => <Badge variant={deliveryVariant(row.original.deliveryStatus)} data-ai-id="won-lot-delivery-badge">{deliveryLabel[row.original.deliveryStatus] ?? row.original.deliveryStatus}</Badge> },
    { accessorKey: 'wonAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />, cell: ({ row }) => row.original.wonAt?.substring(0, 10) || '-' },
    {
      id: 'actions', cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-ai-id="won-lot-actions-trigger"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="won-lot-edit-btn"><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="won-lot-delete-btn"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
