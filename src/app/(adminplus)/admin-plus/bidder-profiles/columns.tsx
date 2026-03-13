/**
 * @fileoverview Colunas TanStack para BidderProfile (Perfil do Arrematante) — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { BidderProfileRow } from './types';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendente', variant: 'secondary' },
  UNDER_REVIEW: { label: 'Em Análise', variant: 'outline' },
  APPROVED: { label: 'Aprovado', variant: 'default' },
  REJECTED: { label: 'Rejeitado', variant: 'destructive' },
  EXPIRED: { label: 'Expirado', variant: 'destructive' },
};

export const columns: ColumnDef<BidderProfileRow>[] = [
  {
    accessorKey: 'userName',
    header: 'Usuário',
    cell: ({ row }) => (
      <div data-ai-id="bidder-profile-user-cell">
        <span className="font-medium">{row.original.userName}</span>
        <span className="block text-xs text-muted-foreground">{row.original.userEmail}</span>
      </div>
    ),
  },
  {
    accessorKey: 'fullName',
    header: 'Nome Completo',
    cell: ({ row }) => row.original.fullName ?? '—',
  },
  {
    accessorKey: 'cpf',
    header: 'CPF',
    cell: ({ row }) => row.original.cpf ?? '—',
  },
  {
    accessorKey: 'documentStatus',
    header: 'Status Docs',
    cell: ({ row }) => {
      const st = statusMap[row.original.documentStatus] ?? { label: row.original.documentStatus, variant: 'outline' as const };
      return <Badge variant={st.variant} data-ai-id="bidder-profile-status-badge">{st.label}</Badge>;
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Ativo',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'} data-ai-id="bidder-profile-active-badge">
        {row.original.isActive ? 'Sim' : 'Não'}
      </Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString('pt-BR'),
  },
];
