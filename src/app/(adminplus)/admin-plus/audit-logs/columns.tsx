/**
 * Definição de colunas para AuditLog (DataTable).
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { AUDIT_LOG_ACTION_OPTIONS } from './schema';
import type { AuditLogRow } from './types';

const actionLabelMap = Object.fromEntries(AUDIT_LOG_ACTION_OPTIONS.map(o => [o.value, o.label]));

const actionVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
  SOFT_DELETE: 'destructive',
  APPROVE: 'default',
  REJECT: 'destructive',
  PUBLISH: 'outline',
  UNPUBLISH: 'outline',
  RESTORE: 'secondary',
  EXPORT: 'outline',
  IMPORT: 'outline',
};

interface Opts {
  onEdit: (row: AuditLogRow) => void;
  onDelete: (row: AuditLogRow) => void;
}

export function getAuditLogColumns({ onEdit, onDelete }: Opts): ColumnDef<AuditLogRow>[] {
  return [
    { accessorKey: 'userName', header: ({ column }) => <DataTableColumnHeader column={column} title="Usuário" />, enableSorting: true },
    { accessorKey: 'entityType', header: ({ column }) => <DataTableColumnHeader column={column} title="Entidade" />, enableSorting: true },
    { accessorKey: 'entityId', header: ({ column }) => <DataTableColumnHeader column={column} title="ID Entidade" />, enableSorting: false },
    {
      accessorKey: 'action',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ação" />,
      cell: ({ row }) => {
        const val = row.original.action;
        return <Badge variant={actionVariant[val] ?? 'outline'}>{actionLabelMap[val] ?? val}</Badge>;
      },
      enableSorting: true,
    },
    { accessorKey: 'ipAddress', header: ({ column }) => <DataTableColumnHeader column={column} title="IP" />, enableSorting: false },
    { accessorKey: 'timestamp', header: ({ column }) => <DataTableColumnHeader column={column} title="Data/Hora" />, cell: ({ row }) => new Date(row.original.timestamp).toLocaleString('pt-BR'), enableSorting: true },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
