// src/app/admin/sellers/columns.tsx
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
import type { SellerProfileInfo } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<SellerProfileInfo>[] => [
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
        <Link href={`/admin/sellers/${row.original.id}/edit`} className="hover:text-primary">
          {row.getValue("name")}
        </Link>
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
    enableGrouping: true,
  },
  {
    accessorKey: "state",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    enableGrouping: true,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const seller = row.original;
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
              <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />Ver Perfil Público
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/sellers/${seller.id}/edit`}><Pencil className="mr-2 h-4 w-4" />Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(seller.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
