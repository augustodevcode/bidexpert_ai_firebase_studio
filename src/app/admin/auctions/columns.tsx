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
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import type { Auction } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader, ClientOnlyDate } from '@/components/ui/data-table-column-header';
import { getAuctionStatusText } from '@/lib/ui-helpers';

export const createColumns = ({ handleDelete, onEdit }: { handleDelete: (id: string) => void, onEdit: (auction: Auction) => void }): ColumnDef<Auction>[] => [
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
        <button onClick={() => onEdit(row.original)} className="hover:text-primary text-left">
          {row.getValue("title")}
        </button>
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
    cell: ({ row }) => <ClientOnlyDate date={row.getValue("auctionDate")} format="dd/MM/yyyy HH:mm" />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const auction = row.original;
      const canDelete = auction.status === 'RASCUNHO' || auction.status === 'CANCELADO';
      return (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/auctions/${auction.publicId || auction.id}`} target="_blank">
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar Leilão</span>
            </Link>
          </Button>
           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(auction)}>
              <Pencil className="h-4 w-4" />
               <span className="sr-only">Editar</span>
            </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(auction.id)} disabled={!canDelete} title={!canDelete ? "Apenas leilões em Rascunho ou Cancelado podem ser excluídos" : "Excluir Leilão"}>
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      );
    },
  },
];
