/**
 * @fileoverview Definição de colunas TanStack Table para VehicleMakes no Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { VehicleMake } from '@/types';

interface GetColumnsOptions {
  onEdit: (row: VehicleMake) => void;
  onDelete: (row: VehicleMake) => void;
}

export function getVehicleMakeColumns({ onEdit, onDelete }: GetColumnsOptions): ColumnDef<VehicleMake>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <span className="font-medium" data-ai-id="vehicle-make-name">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => (
        <Badge variant="secondary" data-ai-id="vehicle-make-slug">{row.original.slug}</Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Ações para ${row.original.name}`} data-ai-id="vehicle-make-actions-trigger">
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="vehicle-make-edit-action">
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)} className="text-destructive" data-ai-id="vehicle-make-delete-action">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
