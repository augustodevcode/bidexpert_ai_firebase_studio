// src/app/admin/users/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { UserProfileWithPermissions } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getUserHabilitationStatusInfo } from '@/lib/sample-data-helpers';
import Link from 'next/link';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<UserProfileWithPermissions>[] => [
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
    accessorKey: "fullName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome Completo" />,
    cell: ({ row }) => (
      <div className="font-medium">
        <Link href={`/admin/users/${row.original.id}/edit`} className="hover:text-primary">
          {row.getValue("fullName")}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "roleNames",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Perfil" />,
    cell: ({ row }) => {
      const roleNames = row.original.roleNames || [];
      if (roleNames.length === 0) {
        return <span className="text-xs text-muted-foreground">N/A</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {roleNames.map(name => <Badge key={name} variant="secondary">{name}</Badge>)}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const roleNames = row.original.roleNames || [];
      return (value as string[]).some(v => roleNames.includes(v));
    },
    enableGrouping: true,
  },
  {
    accessorKey: "habilitationStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Habilitação" />,
    cell: ({ row }) => {
      const status = row.getValue("habilitationStatus");
      const statusInfo = getUserHabilitationStatusInfo(status as any);
      const Icon = statusInfo.icon;
      return <Badge variant="outline" className="flex items-center gap-1.5"><Icon className="h-3 w-3" />{statusInfo.text}</Badge>;
    },
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.getValue(id))
    },
    enableGrouping: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />,
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString('pt-BR'),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/admin/habilitations/${user.id}`} title="Ver Documentos/Habilitação">
              <Eye className="h-4 w-4" />
              <span className="sr-only">Ver Habilitação</span>
            </Link>
          </Button>
           <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/admin/users/${user.id}/edit`}>
              <Pencil className="h-4 w-4" />
               <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(user.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      );
    },
  },
];
