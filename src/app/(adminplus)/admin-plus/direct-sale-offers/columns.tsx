/**
 * Definição de colunas da tabela de DirectSaleOffer (Ofertas de Venda Direta).
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DirectSaleOfferRow } from './types';

const currFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const statusBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default', PENDING_APPROVAL: 'secondary', SOLD: 'outline', EXPIRED: 'destructive', RASCUNHO: 'secondary',
};

export function getDirectSaleOfferColumns({ onEdit, onDelete }: { onEdit: (r: DirectSaleOfferRow) => void; onDelete: (r: DirectSaleOfferRow) => void }): ColumnDef<DirectSaleOfferRow>[] {
  return [
    { accessorKey: 'publicId', header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />, size: 100 },
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Título" /> },
    { accessorKey: 'offerType', header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />, size: 120 },
    { accessorKey: 'price', header: ({ column }) => <DataTableColumnHeader column={column} title="Preço" />, cell: ({ row }) => row.original.price != null ? currFmt.format(row.original.price) : '—' },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => <Badge variant={statusBadge[row.original.status] || 'outline'}>{row.original.status}</Badge> },
    { accessorKey: 'categoryName', header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" /> },
    { accessorKey: 'views', header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />, size: 80 },
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
