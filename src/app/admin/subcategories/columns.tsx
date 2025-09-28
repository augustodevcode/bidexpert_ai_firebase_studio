// src/app/admin/subcategories/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Subcategory } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

export const createColumns = (): ColumnDef<Subcategory>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome da Subcategoria" />,
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "parentCategoryName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria Principal" />,
    enableGrouping: true,
  },
  {
    accessorKey: "slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
  },
  {
    accessorKey: "itemCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contagem de Itens (Exemplo)" />,
    cell: ({ row }) => <div className="text-center">{row.getValue("itemCount") || 0}</div>
  },
];
