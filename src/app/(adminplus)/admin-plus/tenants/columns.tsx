/**
 * @fileoverview Definição de colunas para DataTable de Tenants no Admin Plus.
 */
'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';

export interface TenantRow {
  id: string;
  name: string;
  subdomain: string;
  domain: string | null;
  resolutionStrategy: string;
  status: string;
  maxUsers: number | null;
  maxAuctions: number | null;
  planId: string | null;
  createdAt: Date | string;
}

const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  TRIAL: 'secondary',
  PENDING: 'outline',
  SUSPENDED: 'destructive',
  CANCELLED: 'destructive',
  EXPIRED: 'destructive',
};

interface GetTenantColumnsOptions {
  onEdit: (row: TenantRow) => void;
  onDelete: (row: TenantRow) => void;
}

export function getTenantColumns({ onEdit, onDelete }: GetTenantColumnsOptions): ColumnDef<TenantRow>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => (
        <span className="font-medium" data-ai-id="tenant-cell-name">
          {row.getValue('name')}
        </span>
      ),
    },
    {
      accessorKey: 'subdomain',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subdomínio" />,
      cell: ({ row }) => (
        <code className="text-xs text-muted-foreground" data-ai-id="tenant-cell-subdomain">
          {row.getValue('subdomain')}
        </code>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={statusVariantMap[status] ?? 'outline'} data-ai-id="tenant-cell-status">
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'resolutionStrategy',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Resolução" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground" data-ai-id="tenant-cell-resolution">
          {row.getValue('resolutionStrategy')}
        </span>
      ),
    },
    {
      accessorKey: 'maxUsers',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Máx. Usuários" />,
      cell: ({ row }) => (
        <span className="text-sm" data-ai-id="tenant-cell-maxUsers">
          {row.getValue('maxUsers') ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'maxAuctions',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Máx. Leilões" />,
      cell: ({ row }) => (
        <span className="text-sm" data-ai-id="tenant-cell-maxAuctions">
          {row.getValue('maxAuctions') ?? '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="tenant-row-actions-trigger">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-ai-id="tenant-row-actions-menu">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
