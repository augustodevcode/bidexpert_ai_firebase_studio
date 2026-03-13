/**
 * @fileoverview Definição de colunas TanStack Table para Roles no Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Role } from '@/types';

interface GetColumnsOptions {
  onEdit: (row: Role) => void;
  onDelete: (row: Role) => void;
}

export function getRoleColumns({ onEdit, onDelete }: GetColumnsOptions): ColumnDef<Role>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="flex items-center gap-2" data-ai-id="role-name">
          <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'nameNormalized',
      header: 'Slug',
      cell: ({ row }) => (
        <Badge variant="secondary" data-ai-id="role-slug">{row.original.nameNormalized}</Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1" data-ai-id="role-description">
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      id: 'permCount',
      header: 'Permissões',
      cell: ({ row }) => {
        const perms = row.original.permissions;
        if (!perms) return <span className="text-muted-foreground">—</span>;
        try {
          const parsed = typeof perms === 'string' ? JSON.parse(perms) : perms;
          const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
          return <span className="text-muted-foreground" data-ai-id="role-perm-count">{count}</span>;
        } catch {
          return <span className="text-muted-foreground">—</span>;
        }
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Ações para ${row.original.name}`} data-ai-id="role-actions-trigger">
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="role-edit-action">
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="role-delete-action">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
