// src/app/admin/courts/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Tribunais. Inclui cabeçalhos, renderização de células com
 * links, e um menu de ações para cada linha (editar, excluir).
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { Court } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';

export const createColumns = ({ handleDelete, onEdit }: { handleDelete: (id: string) => void, onEdit: (court: Court) => void }): ColumnDef<Court>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome do Tribunal" />,
    cell: ({ row }) => (
       <button onClick={() => onEdit(row.original)} className="hover:text-primary font-medium text-left">
        {row.getValue("name")}
      </button>
    ),
  },
  {
    accessorKey: "stateUf",
    header: ({ column }) => <DataTableColumnHeader column={column} title="UF" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("stateUf")}</div>
  },
  {
    accessorKey: "website",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Website" />,
    cell: ({ row }) => {
        const website = row.getValue("website") as string;
        if (!website) return <span className="text-muted-foreground">-</span>;
        const validUrl = website.startsWith('http') ? website : `https://${website}`;
        return (
            <a href={validUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                Acessar <ExternalLink className="h-3.5 w-3.5" />
            </a>
        );
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const court = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(court)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(court.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      );
    },
  },
];
