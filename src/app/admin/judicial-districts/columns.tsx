// src/app/admin/judicial-districts/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Comarcas. Inclui cabeçalhos, renderização de células com
 * links, e um menu de ações para cada linha (editar, excluir).
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import type { JudicialDistrict } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';

export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<JudicialDistrict>[] => [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome da Comarca" />,
    cell: ({ row }) => (
      <Link href={`/admin/judicial-districts/${row.original.id}/edit`} className="hover:text-primary font-medium">
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "courtName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tribunal" />,
  },
  {
    accessorKey: "stateUf",
    header: ({ column }) => <DataTableColumnHeader column={column} title="UF" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("stateUf")}</div>
  },
   {
    accessorKey: "zipCode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="CEP" />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const district = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/judicial-districts/${district.id}/edit`}><Pencil className="mr-2 h-4 w-4"/>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(district.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
