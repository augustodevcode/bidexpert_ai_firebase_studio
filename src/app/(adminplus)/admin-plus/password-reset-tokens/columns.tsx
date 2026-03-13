/**
 * @fileoverview Colunas TanStack para PasswordResetToken — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { PasswordResetTokenRow } from './types';

export const columns: ColumnDef<PasswordResetTokenRow>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'token',
    header: 'Token',
    cell: ({ row }) => (
      <code className="text-xs bg-muted px-1.5 py-0.5 rounded" data-ai-id="prt-token-cell">
        {row.original.token.slice(0, 16)}…
      </code>
    ),
  },
  {
    accessorKey: 'expires',
    header: 'Expira em',
    cell: ({ row }) => {
      const d = new Date(row.original.expires);
      const expired = d < new Date();
      return (
        <Badge variant={expired ? 'destructive' : 'default'} data-ai-id="prt-expires-badge">
          {d.toLocaleString('pt-BR')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString('pt-BR'),
  },
];
