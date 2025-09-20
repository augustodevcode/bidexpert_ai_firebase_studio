// src/app/admin/categories/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Categorias de Lotes. Inclui cabeçalhos, renderização de células
 * com links, e uma indicação visual se a categoria possui ou não subcategorias.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { LotCategory } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Check, X } from 'lucide-react';

export const createColumns = (): ColumnDef<LotCategory>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
  },
  {
    accessorKey: "hasSubcategories",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tem Subcategorias" />,
    cell: ({ row }) => (
      <div className="text-center">
        {row.getValue("hasSubcategories") ? <Check className="h-4 w-4 text-green-500 mx-auto"/> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
      </div>
    ),
    enableGrouping: true,
  },
];
