/**
 * Column definitions for LotDocument data table.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { LotDocumentRow } from './types';

interface ColumnActions {
  onEdit: (row: LotDocumentRow) => void;
  onDelete: (row: LotDocumentRow) => void;
}

export function getLotDocumentColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<LotDocumentRow>[] {
  return [
    { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />, cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span> },
    { accessorKey: 'lotTitle', header: ({ column }) => <DataTableColumnHeader column={column} title="Lote" />, cell: ({ row }) => <span className="font-medium">{row.original.lotTitle}</span> },
    { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title="Título" /> },
    { accessorKey: 'fileName', header: ({ column }) => <DataTableColumnHeader column={column} title="Arquivo" />, cell: ({ row }) => <span className="text-xs">{row.original.fileName}</span> },
    { accessorKey: 'isPublic', header: ({ column }) => <DataTableColumnHeader column={column} title="Público" />, cell: ({ row }) => <Badge variant={row.original.isPublic ? 'default' : 'secondary'}>{row.original.isPublic ? 'Sim' : 'Não'}</Badge> },
    { accessorKey: 'displayOrder', header: ({ column }) => <DataTableColumnHeader column={column} title="Ordem" /> },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />, cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('pt-BR') },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Ações</span></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
