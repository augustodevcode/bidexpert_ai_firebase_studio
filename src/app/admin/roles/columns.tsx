// src/app/admin/roles/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, ShieldAlert, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { Role } from '@/types';

const PROTECTED_ROLES = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTION_ANALYST', 'BIDDER', 'TENANT_ADMIN'];

export const createColumns = ({
  handleDelete,
  handleEdit,
}: {
  handleDelete: (id: string) => void;
  handleEdit: (role: Role) => void;
}): ColumnDef<Role>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
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
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome do Perfil" />,
    cell: ({ row }) => {
      const role = row.original;
      const isProtected = PROTECTED_ROLES.includes(role.nameNormalized);

      return (
        <button type="button" onClick={() => handleEdit(role)} className="flex items-center font-medium text-left hover:text-primary">
          <span>{row.getValue('name')}</span>
          {isProtected ? <ShieldAlert className="ml-2 h-4 w-4 text-amber-500" title="Perfil de sistema protegido" /> : null}
        </button>
      );
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />,
    cell: ({ row }) => <p className="max-w-[400px] truncate text-muted-foreground">{row.getValue('description')}</p>,
  },
  {
    accessorKey: 'permissions',
    header: 'Permissões',
    cell: ({ row }) => {
      const permissions = row.getValue('permissions') as string[];
      const count = permissions?.length || 0;

      if (count === 1 && permissions[0] === 'manage_all') {
        return <span className="font-semibold text-primary">Acesso Total</span>;
      }

      return <span className="text-muted-foreground">{count} permissão(ões)</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const role = row.original;
      const isProtected = PROTECTED_ROLES.includes(role.nameNormalized);

      return (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(role)} type="button">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleDelete(role.id)}
            disabled={isProtected}
            title={isProtected ? 'Perfis de sistema não podem ser excluídos' : 'Excluir perfil'}
            type="button"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      );
    },
  },
];
