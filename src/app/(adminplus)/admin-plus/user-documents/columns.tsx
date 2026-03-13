/**
 * @fileoverview Colunas TanStack para UserDocument — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { UserDocumentRow } from './types';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  NOT_SENT: { label: 'Não Enviado', variant: 'secondary' },
  SUBMITTED: { label: 'Enviado', variant: 'outline' },
  PENDING_ANALYSIS: { label: 'Em Análise', variant: 'default' },
  APPROVED: { label: 'Aprovado', variant: 'default' },
  REJECTED: { label: 'Rejeitado', variant: 'destructive' },
};

export const columns: ColumnDef<UserDocumentRow>[] = [
  {
    accessorKey: 'userName',
    header: 'Usuário',
    cell: ({ row }) => (
      <div data-ai-id="ud-user-cell">
        <span className="font-medium">{row.original.userName}</span>
        <span className="block text-xs text-muted-foreground">{row.original.userEmail}</span>
      </div>
    ),
  },
  {
    accessorKey: 'documentTypeName',
    header: 'Tipo de Documento',
  },
  {
    accessorKey: 'fileName',
    header: 'Arquivo',
    cell: ({ row }) => row.original.fileName || '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const s = statusMap[row.original.status] ?? { label: row.original.status, variant: 'outline' as const };
      return <Badge variant={s.variant} data-ai-id="ud-status-badge">{s.label}</Badge>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString('pt-BR'),
  },
];
