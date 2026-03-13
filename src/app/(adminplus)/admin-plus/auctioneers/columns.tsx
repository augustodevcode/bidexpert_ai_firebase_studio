/**
 * @fileoverview Colunas TanStack para Auctioneer (Leiloeiro) — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { AuctioneerRow } from './types';

export const columns: ColumnDef<AuctioneerRow>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => (
      <div data-ai-id="auctioneer-name-cell">
        <span className="font-medium">{row.original.name}</span>
        <span className="block text-xs text-muted-foreground">{row.original.slug}</span>
      </div>
    ),
  },
  {
    accessorKey: 'registrationNumber',
    header: 'Matrícula',
    cell: ({ row }) => row.original.registrationNumber ?? '—',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.original.email ?? '—',
  },
  {
    accessorKey: 'phone',
    header: 'Telefone',
    cell: ({ row }) => row.original.phone ?? '—',
  },
  {
    accessorKey: 'city',
    header: 'Cidade/UF',
    cell: ({ row }) => {
      const city = row.original.city;
      const state = row.original.state;
      if (!city && !state) return '—';
      return `${city ?? ''}${city && state ? '/' : ''}${state ?? ''}`;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString('pt-BR'),
  },
];
