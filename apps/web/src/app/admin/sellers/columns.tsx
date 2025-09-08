// src/app/admin/sellers/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import type { SellerProfileInfo } from '@bidexpert/core';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

export const createColumns = (): ColumnDef<SellerProfileInfo>[] => [
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
        <div className="flex items-center justify-end gap-1" data-ai-id={`actions-menu-seller-${seller.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`} target="_blank">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Perfil Público</span>
                </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/admin/sellers/${seller.id}/edit?mode=edit`}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-action="delete" data-id={seller.id}>
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="sr-only">Excluir</span>
            </Button>
        </div>
      );
    },
  },
];
