/**
 * Colunas da tabela de DocumentTemplate.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import type { DocumentTemplateRow } from './types';
import { DOCUMENT_TEMPLATE_TYPE_OPTIONS } from './schema';

interface ColumnActions {
  onEdit: (row: DocumentTemplateRow) => void;
  onDelete: (row: DocumentTemplateRow) => void;
}

export function getDocumentTemplateColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<DocumentTemplateRow>[] {
  return [
    { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />, cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { accessorKey: 'type', header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />, cell: ({ row }) => { const v = row.getValue('type') as string; const label = DOCUMENT_TEMPLATE_TYPE_OPTIONS.find(o => o.value === v)?.label || v; return <Badge variant="secondary">{label}</Badge>; } },
    { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />, cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString('pt-BR') },
    { id: 'actions', cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) },
  ];
}
