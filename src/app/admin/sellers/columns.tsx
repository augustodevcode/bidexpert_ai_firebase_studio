// src/app/admin/sellers/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Comitentes. Inclui cabeçalhos, renderização de células
 * com links, e um menu de ações para cada linha (editar, excluir, etc.).
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import type { SellerProfileInfo } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';


export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<SellerProfileInfo>[] => [
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
      <div className="font-medium">
        <Link href={`/admin/sellers/${row.original.id}/edit`} className="hover:text-primary">
          {row.getValue("name")}
        </Link>
         <p className="text-xs text-muted-foreground">ID: {row.original.publicId || row.original.id}</p>
      </div>
    ),
  },
  {
    accessorKey: "isJudicial",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: ({ row }) => {
      const isJudicial = row.getValue("isJudicial");
      return (
        <Badge variant={isJudicial ? "outline" : "secondary"} className={isJudicial ? "border-blue-500/60" : ""}>
            {isJudicial && <Scale className="mr-1.5 h-3.5 w-3.5 text-blue-600"/>}
            {isJudicial ? "Judicial" : "Outros"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "city",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cidade" />,
    enableGrouping: true,
  },
  {
    accessorKey: "state",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    enableGrouping: true,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const seller = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`} target="_blank">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver Perfil Público</span>
                </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/admin/sellers/${seller.id}/edit?mode=edit`}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(seller.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="sr-only">Excluir</span>
            </Button>
        </div>
      );
    },
  },
];
