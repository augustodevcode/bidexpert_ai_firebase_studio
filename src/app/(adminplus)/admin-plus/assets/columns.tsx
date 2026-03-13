/**
 * @fileoverview Colunas da tabela Asset — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { AssetRow } from './types';
import { ASSET_STATUSES } from './schema';

interface Props { onEdit: (row: AssetRow) => void; onDelete: (row: AssetRow) => void; }

export function getAssetColumns({ onEdit, onDelete }: Props): ColumnDef<AssetRow>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.getValue('title')}</span>
          <span className="text-muted-foreground text-xs ml-2">{row.original.publicId}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const v = row.getValue('status') as string;
        const lbl = ASSET_STATUSES.find((s) => s.value === v)?.label ?? v;
        const variant = v === 'DISPONIVEL' ? 'default'
          : v === 'VENDIDO' ? 'secondary'
          : ['REMOVIDO', 'INATIVADO'].includes(v) ? 'destructive' : 'outline';
        return <Badge variant={variant} data-ai-id="asset-status-badge">{lbl}</Badge>;
      },
    },
    {
      accessorKey: 'categoryName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
    },
    {
      accessorKey: 'evaluationValue',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Avaliação" />,
      cell: ({ row }) => {
        const v = row.getValue('evaluationValue') as number | null;
        return v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—';
      },
    },
    {
      accessorKey: 'locationCity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cidade" />,
      cell: ({ row }) => {
        const c = row.original.locationCity;
        const s = row.original.locationState;
        return c ? `${c}${s ? '/' + s : ''}` : '—';
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />,
      cell: ({ row }) => {
        const d = row.getValue('createdAt') as string;
        return d ? new Date(d).toLocaleDateString('pt-BR') : '—';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="asset-row-actions"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="asset-edit-btn"><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="asset-delete-btn"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
