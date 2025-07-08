
// src/app/admin/roles/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, ShieldAlert, Trash2 } from 'lucide-react';
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
import type { Role } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

const PROTECTED_ROLES = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];

export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<Role>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome do Perfil" />,
    cell: ({ row }) => {
      const isProtected = PROTECTED_ROLES.includes(row.original.name_normalized);
      return (
        <div className="font-medium flex items-center">
            <Link href={`/admin/roles/${row.original.id}/edit`} className="hover:text-primary">
              {row.getValue("name")}
            </Link>
            {isProtected && <ShieldAlert className="h-4 w-4 ml-2 text-amber-500" title="Perfil de Sistema Protegido"/>}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />,
    cell: ({ row }) => <p className="truncate max-w-[400px] text-muted-foreground">{row.getValue("description")}</p>
  },
  {
    accessorKey: "permissions",
    header: "Permissões",
    cell: ({ row }) => {
      const permissions = row.getValue("permissions") as string[];
      const count = permissions?.length || 0;
      if (count === 1 && permissions[0] === 'manage_all') {
          return <span className="font-semibold text-primary">Acesso Total</span>;
      }
      return <span className="text-muted-foreground">{count} permissão(ões)</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const role = row.original;
      const isProtected = PROTECTED_ROLES.includes(role.name_normalized);

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
              <Link href={`/admin/roles/${role.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4"/>Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(role.id)}
              className="text-destructive"
              disabled={isProtected}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
