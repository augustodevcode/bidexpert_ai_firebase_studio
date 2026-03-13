/**
 * @fileoverview Definição de colunas TanStack para listagem de Tribunais.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Court } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus';
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react';

interface CourtColumnOpts {
  onEdit: (row: Court) => void;
  onDelete: (row: Court) => void;
}

export function getCourtColumns({ onEdit, onDelete }: CourtColumnOpts): ColumnDef<Court>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => (
        <span className="font-medium" data-ai-id="court-cell-name">{row.getValue('name')}</span>
      ),
    },
    {
      accessorKey: 'stateUf',
      header: ({ column }) => <DataTableColumnHeader column={column} title="UF" />,
      cell: ({ row }) => (
        <Badge variant="outline" data-ai-id="court-cell-uf">{row.getValue('stateUf')}</Badge>
      ),
    },
    {
      accessorKey: 'website',
      header: 'Website',
      cell: ({ row }) => {
        const url = row.getValue('website') as string | null;
        if (!url) return <span className="text-muted-foreground">—</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
            data-ai-id="court-cell-website"
          >
            {new URL(url).hostname}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-ai-id="court-row-actions">
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
