// src/app/admin/states/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Estados. Inclui cabeçalhos, renderização de células com
 * links, e um menu de ações para cada linha (editar, excluir).
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import type { StateInfo } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<StateInfo>[] => [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
    cell: ({ row }) => (
      <Link href={`/admin/states/${row.original.id}/edit`} className="hover:text-primary font-medium">
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "uf",
    header: ({ column }) => <DataTableColumnHeader column={column} title="UF" />,
    enableGrouping: true,
  },
  {
    accessorKey: "cityCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cidades" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("cityCount") || 0}</div>
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const state = row.original;
      return (
         <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/admin/states/${state.id}/edit`}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(state.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      );
    },
  },
];
