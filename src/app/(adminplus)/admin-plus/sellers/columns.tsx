/**
 * @fileoverview Colunas da tabela Seller — Admin Plus.
 */
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { SellerRow } from './types';

export const columns: ColumnDef<SellerRow>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => (
      <div>
        <span className="font-medium">{row.original.name}</span>
        <span className="block text-xs text-muted-foreground">{row.original.slug}</span>
      </div>
    ),
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
      const c = row.original.city;
      const s = row.original.state;
      if (!c && !s) return '—';
      return `${c ?? ''}${s ? ` / ${s}` : ''}`;
    },
  },
  {
    accessorKey: 'isJudicial',
    header: 'Judicial',
    cell: ({ row }) =>
      row.original.isJudicial ? (
        <Badge variant="default">Judicial</Badge>
      ) : (
        <Badge variant="secondary">Extrajudicial</Badge>
      ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Criado em',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('pt-BR'),
  },
];
