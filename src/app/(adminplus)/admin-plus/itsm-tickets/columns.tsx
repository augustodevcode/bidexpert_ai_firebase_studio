/**
 * Definição das colunas da tabela de ITSM_Ticket no Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus';
import type { ItsmTicketRow } from './types';
import { ITSM_STATUS_OPTIONS, ITSM_PRIORITY_OPTIONS, ITSM_CATEGORY_OPTIONS } from './schema';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ABERTO: 'default', EM_ANDAMENTO: 'secondary', AGUARDANDO_USUARIO: 'outline', RESOLVIDO: 'default', FECHADO: 'outline', CANCELADO: 'destructive',
};
const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  BAIXA: 'outline', MEDIA: 'secondary', ALTA: 'default', CRITICA: 'destructive',
};

export function getItsmTicketColumns({ onEdit, onDelete }: { onEdit: (row: ItsmTicketRow) => void; onDelete: (row: ItsmTicketRow) => void }): ColumnDef<ItsmTicketRow>[] {
  return [
    { accessorKey: 'publicId', header: ({ column }) => <DataTableColumnHeader column={column} title="Protocolo" />, size: 120 },
    { accessorKey: 'userName', header: ({ column }) => <DataTableColumnHeader column={column} title="Solicitante" /> },
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Título" /> },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, cell: ({ row }) => { const v = row.getValue('status') as string; const label = ITSM_STATUS_OPTIONS.find(o => o.value === v)?.label ?? v; return <Badge variant={statusVariant[v] || 'outline'}>{label}</Badge>; } },
    { accessorKey: 'priority', header: ({ column }) => <DataTableColumnHeader column={column} title="Prioridade" />, cell: ({ row }) => { const v = row.getValue('priority') as string; const label = ITSM_PRIORITY_OPTIONS.find(o => o.value === v)?.label ?? v; return <Badge variant={priorityVariant[v] || 'outline'}>{label}</Badge>; } },
    { accessorKey: 'category', header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />, cell: ({ row }) => { const v = row.getValue('category') as string; return ITSM_CATEGORY_OPTIONS.find(o => o.value === v)?.label ?? v; } },
    { accessorKey: 'assignedToUserName', header: ({ column }) => <DataTableColumnHeader column={column} title="Responsável" /> },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />, cell: ({ row }) => { const v = row.getValue('createdAt') as string; return v ? new Date(v).toLocaleString('pt-BR') : '-'; } },
    { id: 'actions', size: 60, cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-ai-id="itsm-ticket-actions-btn"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>Editar</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(row.original)}>Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) },
  ];
}
