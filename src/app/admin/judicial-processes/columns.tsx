// src/app/admin/judicial-processes/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Processos Judiciais. Inclui renderização para o número
 * do processo, entidades relacionadas (tribunal, comarca, vara) e um menu de
 * ações para edição e exclusão.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { JudicialProcess } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import Link from 'next/link';

export const createColumns = ({ handleDelete, onEdit }: { handleDelete: (id: string) => void, onEdit: (process: JudicialProcess) => void }): ColumnDef<JudicialProcess>[] => [
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
      <button onClick={() => onEdit(row.original)} className="hover:text-primary font-medium text-left">
        {row.getValue("processNumber")}
      </button>
    ),
  },
  {
    accessorKey: "lotCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lotes" />,
    cell: ({ row }) => {
      const lotCount = row.original.lotCount || 0;
      const processId = row.original.publicId || row.original.id;
      return (
        <Link href={`/admin/lots?judicialProcessId=${processId}`} className="text-primary hover:underline">
          {lotCount} lotes
        </Link>
      );
    },
  },
  {
    accessorKey: "assetCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ativos" />,
    cell: ({ row }) => {
      const assetCount = row.original.assetCount || 0;
      const processId = row.original.publicId || row.original.id;
      return (
        <Link href={`/admin/assets?judicialProcessId=${processId}`} className="text-primary hover:underline">
          {assetCount} ativos
        </Link>
      );
    },
  },
  {
    accessorKey: "auctions",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Leilões Vinculados" />,
    cell: ({ row }) => {
      const auctions = row.original.auctions;
      if (!auctions || auctions.length === 0) return <span className="text-muted-foreground text-xs">Sem leilão</span>;
      
      return (
        <div className="flex flex-col gap-1 max-w-[200px]">
          {auctions.map((a: any) => (
            <div key={a.id} className="text-xs border rounded p-1 bg-muted/20">
               <div className="font-medium truncate text-xs" title={a.title}>{a.title}</div>
               <div className="flex gap-1 items-center mt-1">
                  <span className={`px-1 rounded-[2px] text-[10px] ${a.isJudicial ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>
                    {a.isJudicial ? 'Jud' : 'Extra'}
                  </span>
                  <span className={`px-1 rounded-[2px] text-[10px] font-medium ${a.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'}`}>
                    {a.status === 'OPEN' ? 'Aberto' : a.status}
                  </span>
               </div>
            </div>
          ))}
        </div>
      );
    },
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
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(process)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(process.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      );
    },
  },
];
