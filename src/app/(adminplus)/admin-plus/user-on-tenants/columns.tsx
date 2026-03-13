/**
 * @fileoverview Definição de colunas TanStack Table para UserOnTenant — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { UserOnTenantRow } from './types';

export const columns: ColumnDef<UserOnTenantRow>[] = [
  {
    accessorKey: 'userName',
    header: 'Usuário',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.userName ?? '—'}</div>
        <div className="text-xs text-muted-foreground">{row.original.userEmail ?? ''}</div>
      </div>
    ),
  },
  {
    accessorKey: 'tenantName',
    header: 'Tenant',
  },
  {
    accessorKey: 'assignedBy',
    header: 'Atribuído por',
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
  },
  {
    accessorKey: 'assignedAt',
    header: 'Atribuído em',
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return v ? new Date(v).toLocaleDateString('pt-BR') : '—';
    },
  },
];
