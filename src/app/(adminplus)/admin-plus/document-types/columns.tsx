/**
 * @fileoverview Definição de colunas TanStack para listagem de Tipos de Documento.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus';
import { MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';

type DocTypeRow = {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  appliesTo: string;
};

const appliesToLabels: Record<string, string> = {
  PHYSICAL: 'Pessoa Física',
  LEGAL: 'Pessoa Jurídica',
  BOTH: 'Ambos',
};

interface DocTypeColumnOpts {
  onEdit: (row: DocTypeRow) => void;
  onDelete: (row: DocTypeRow) => void;
}

export function getDocumentTypeColumns({ onEdit, onDelete }: DocTypeColumnOpts): ColumnDef<DocTypeRow>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => <span className="font-medium" data-ai-id="doctype-cell-name">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'appliesTo',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Aplica-se a" />,
      cell: ({ row }) => {
        const val = row.getValue('appliesTo') as string;
        return <Badge variant="secondary" data-ai-id="doctype-cell-applies">{appliesToLabels[val] ?? val}</Badge>;
      },
    },
    {
      accessorKey: 'isRequired',
      header: 'Obrigatório',
      cell: ({ row }) => {
        const required = row.getValue('isRequired') as boolean;
        return required ? (
          <Check className="h-4 w-4 text-green-600" data-ai-id="doctype-cell-required" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" data-ai-id="doctype-cell-not-required" />
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => {
        const desc = row.getValue('description') as string | null;
        return <span className="text-muted-foreground line-clamp-1">{desc ?? '—'}</span>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="doctype-row-actions">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(row.original)}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
