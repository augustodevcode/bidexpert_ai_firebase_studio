// src/app/admin/roles/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, ShieldAlert, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import type { Role } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

const PROTECTED_ROLES_NORMALIZED = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTION_ANALYST', 'BIDDER', 'FINANCE'];


export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<Role>[] => [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome do Perfil" />,
    cell: ({ row }) => {
      const isProtected = PROTECTED_ROLES_NORMALIZED.includes(row.original.nameNormalized);
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
      const isProtected = PROTECTED_ROLES_NORMALIZED.includes(role.nameNormalized);
      return (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/admin/roles/${role.id}/edit`}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => handleDelete(role.id)}
            disabled={isProtected}
            title={isProtected ? 'Perfis de sistema não podem ser excluídos' : 'Excluir Perfil'}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      );
    },
  },
];
