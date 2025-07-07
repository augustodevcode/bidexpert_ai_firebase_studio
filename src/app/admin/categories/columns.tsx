// src/app/admin/categories/columns.tsx
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
