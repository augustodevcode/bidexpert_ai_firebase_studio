// src/app/admin/auctioneers/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Leiloeiros. Inclui cabeçalhos, renderização de células
 * com links, e um menu de ações para cada linha (editar, excluir, etc.).
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
import type { AuctioneerProfileInfo } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

export const createColumns = ({ handleDelete, onEdit }: { handleDelete: (id: string) => void, onEdit: (auctioneer: AuctioneerProfileInfo) => void }): ColumnDef<AuctioneerProfileInfo>[] => [
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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
    cell: ({ row }) => (
      <div className="font-medium">
        <button onClick={() => onEdit(row.original)} className="hover:text-primary text-left">
          {row.getValue("name")}
        </button>
        <p className="text-xs text-muted-foreground">ID: {row.original.publicId || row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Telefone" />,
  },
  {
    accessorKey: "city",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cidade" />,
  },
  {
    accessorKey: "state",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const auctioneer = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/auctioneers/${auctioneer.slug || auctioneer.publicId || auctioneer.id}`} target="_blank">
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar Perfil Público</span>
            </Link>
          </Button>
           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(auctioneer)}>
              <Pencil className="h-4 w-4" />
               <span className="sr-only">Editar</span>
            </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(auctioneer.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      );
    },
  },
];
