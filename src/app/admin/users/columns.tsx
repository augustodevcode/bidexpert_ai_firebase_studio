
// src/app/admin/users/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ShieldCheck, Pencil, Trash2 } from 'lucide-react';
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
import type { UserProfileData } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getUserHabilitationStatusInfo } from '@/lib/sample-data-helpers';

export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<UserProfileData>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        {/* Placeholder for potential future checkbox implementation if needed */}
      </div>
    ),
    cell: ({ row }) => (
      <div>
        {/* Placeholder for checkbox */}
      </div>
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
    accessorKey: "roleName", // Keep accessor for filtering
    header: ({ column }) => <DataTableColumnHeader column={column} title="Perfil" />,
    cell: ({ row }) => {
      const roleName = row.original.roleName;
      if (!roleName) {
        return <span className="text-xs text-muted-foreground">N/A</span>;
      }
      return <Badge variant="secondary">{roleName}</Badge>;
    },
    filterFn: (row, id, value) => {
      const roleName = row.original.roleName || "";
      return (value as string[]).includes(roleName);
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
      return value.includes(row.getValue(id))
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
              <Link href={`/admin/users/${user.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />Editar Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Excluir Usuário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
