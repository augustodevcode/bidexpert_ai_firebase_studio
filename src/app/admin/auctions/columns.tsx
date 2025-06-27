
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
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
import { getAuctionStatusText } from '@/lib/sample-data-helpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "auctioneer",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leiloeiro" />,
  },
  {
    accessorKey: "seller",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Comitente" />,
  },
  {
    accessorKey: "totalLots",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lotes" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("totalLots") || 0}</div>
  },
  {
    accessorKey: "auctionDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data do Leilão" />,
    cell: ({ row }) => {
      const date = row.getValue("auctionDate");
      try {
        return date ? format(new Date(date as string), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A';
      } catch {
        return 'Data inválida';
      }
    }
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data de Fim" />,
    cell: ({ row }) => {
      const date = row.getValue("endDate");
      try {
        return date ? format(new Date(date as string), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Não definida';
      } catch {
        return 'Data inválida';
      }
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const auction = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/auctions/${auction.publicId || auction.id}`} target="_blank">Ver Leilão</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/auctions/${auction.id}/edit`}>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(auction.id)} className="text-destructive">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
