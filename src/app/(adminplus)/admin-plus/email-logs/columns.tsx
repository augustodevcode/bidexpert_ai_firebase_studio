/**
 * @fileoverview Colunas da DataTable para EmailLog no Admin Plus.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { EmailLogRow } from './types';

const statusVariant: Record<EmailLogRow['status'], 'default' | 'secondary' | 'destructive'> = {
  SENT: 'default',
  PENDING: 'secondary',
  FAILED: 'destructive',
};

interface Options {
  onView: (row: EmailLogRow) => void;
}

export function getEmailLogColumns({ onView }: Options): ColumnDef<EmailLogRow>[] {
  return [
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>,
      enableSorting: true,
    },
    {
      accessorKey: 'recipient',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Destinatário" />,
      enableSorting: true,
    },
    {
      accessorKey: 'subject',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assunto" />,
      cell: ({ row }) => <span className="line-clamp-1 max-w-[280px]">{row.original.subject}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'provider',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Provedor" />,
      enableSorting: true,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />,
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('pt-BR'),
      enableSorting: true,
    },
    {
      accessorKey: 'sentAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Enviado em" />,
      cell: ({ row }) => (row.original.sentAt ? new Date(row.original.sentAt).toLocaleString('pt-BR') : '-'),
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ações do log de e-mail">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}