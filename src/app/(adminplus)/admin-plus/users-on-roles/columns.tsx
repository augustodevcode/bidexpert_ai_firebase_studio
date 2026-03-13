/**
 * @fileoverview Colunas da tabela UsersOnRoles — Admin Plus.
 */
import { ColumnDef } from '@tanstack/react-table';
import type { UsersOnRolesRow } from './types';

export const columns: ColumnDef<UsersOnRolesRow>[] = [
  {
    accessorKey: 'userName',
    header: 'Usuário',
    cell: ({ row }) => (
      <div>
        <span className="font-medium">{row.original.userName ?? '—'}</span>
        {row.original.userEmail && (
          <span className="block text-xs text-muted-foreground">{row.original.userEmail}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'roleName',
    header: 'Perfil',
    cell: ({ row }) => row.original.roleName ?? '—',
  },
  {
    accessorKey: 'assignedBy',
    header: 'Atribuído por',
    cell: ({ row }) => row.original.assignedBy || '—',
  },
  {
    accessorKey: 'assignedAt',
    header: 'Atribuído em',
    cell: ({ row }) =>
      row.original.assignedAt
        ? new Date(row.original.assignedAt).toLocaleDateString('pt-BR')
        : '—',
  },
];
