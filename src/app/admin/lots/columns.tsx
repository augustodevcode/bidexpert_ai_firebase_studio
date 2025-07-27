'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import type { Lot } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const createColumns = ({ handleDelete }: { handleDelete: (id: string, auctionId?: string) => void }): ColumnDef<Lot>[] => [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título do Lote" />,
    cell: ({ row }) => (
      <div className="font-medium">
        <Link href={`/admin/lots/${row.original.publicId || row.original.id}/edit`} className="hover:text-primary">
          Lote {row.original.number || row.original.id.substring(0, 4)}: {row.getValue("title")}
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
    accessorKey: "price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Preço (R$)" />,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      if (isNaN(price)) return 'N/A';
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(price);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "auctionName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leilão" />,
    cell: ({ row }) => (
        <Link href={`/admin/auctions/${row.original.auctionId}/edit`} className="text-xs hover:text-primary truncate">
          {row.original.auctionName}
        </Link>
    )
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
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
      const lot = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`} target="_blank">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Lote</span>
                </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/admin/lots/${lot.publicId || lot.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar Lote</span>
                </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(lot.publicId || lot.id, lot.auctionId)}>
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="sr-only">Excluir</span>
            </Button>
        </div>
      );
    },
  },
];
