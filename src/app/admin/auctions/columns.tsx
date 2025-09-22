// src/app/admin/auctions/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Leilões. Inclui cabeçalhos, renderização de células com
 * links, e um menu de ações para cada linha (editar, excluir, etc.). Demonstra
 * o uso do componente `DataTableColumnHeader` para ordenação e a lógica para
 * desabilitar a exclusão de leilões que não estão em um estado seguro para remoção.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import type { Auction } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useEffect } from 'react';


const ClientOnlyDate = ({ date }: { date: string | Date | null | undefined }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (date) {
            try {
                setFormattedDate(format(new Date(date as string), "dd/MM/yyyy HH:mm", { locale: ptBR }));
            } catch {
                setFormattedDate('Data inválida');
            }
        } else {
            setFormattedDate('N/A');
        }
    }, [date]);

    return <span>{formattedDate}</span>;
}


export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<Auction>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    cell: ({ row }) => (
      <div className="font-medium">
        <Link href={`/admin/auctions/${row.original.id}/edit`} className="hover:text-primary">
          {row.getValue("title")}
        </Link>
        <p className="text-xs text-muted-foreground">ID: {row.original.publicId || row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <Badge variant="outline">{getAuctionStatusText(row.getValue("status"))}</Badge>,
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
    enableGrouping: true,
  },
  {
    accessorKey: "auctioneerName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leiloeiro" />,
    enableGrouping: true,
  },
  {
    accessorKey: "sellerName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Comitente" />,
    enableGrouping: true,
  },
  {
    accessorKey: "totalLots",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lotes" />,
    cell: ({ row }) => <div className="text-center">{row.original.totalLots || 0}</div>
  },
  {
    accessorKey: "auctionDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data do Leilão" />,
    cell: ({ row }) => <ClientOnlyDate date={row.getValue("auctionDate")} />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const auction = row.original;
      const canDelete = auction.status === 'RASCUNHO' || auction.status === 'CANCELADO';
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" data-ai-id="data-table-row-actions-menu">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/auctions/${auction.publicId || auction.id}`} target="_blank"><Eye className="mr-2 h-4 w-4" />Ver Leilão</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/auctions/${auction.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(auction.id)} className="text-destructive" disabled={!canDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];