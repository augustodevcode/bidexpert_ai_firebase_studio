// src/app/admin/judicial-processes/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Processos Judiciais. Inclui renderização para o número
 * do processo, entidades relacionadas (tribunal, comarca, vara) e um menu de
 * ações para edição e exclusão.
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
import type { JudicialProcess } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';

export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<JudicialProcess>[] => [
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
    accessorKey: "processNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nº do Processo" />,
    cell: ({ row }) => (
      <Link href={`/admin/judicial-processes/${row.original.id}/edit`} className="hover:text-primary font-medium">
        {row.getValue("processNumber")}
      </Link>
    ),
  },
  {
    accessorKey: "courtName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tribunal" />,
    enableGrouping: true,
  },
  {
    accessorKey: "districtName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Comarca" />,
  },
  {
    accessorKey: "branchName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vara" />,
    enableGrouping: true,
  },
  {
    accessorKey: "isElectronic",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Eletrônico" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("isElectronic") ? 'Sim' : 'Não'}</div>
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const process = row.original;
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
              <Link href={`/admin/judicial-processes/${process.id}/edit`}><Pencil className="mr-2 h-4 w-4"/>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(process.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
