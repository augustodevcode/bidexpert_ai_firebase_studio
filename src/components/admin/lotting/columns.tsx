
// src/components/admin/lotting/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Bem } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export const createColumns = (): ColumnDef<Bem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    accessorKey: "imageUrl",
    header: "Imagem",
    cell: ({ row }) => (
        <div className="w-16 h-12 bg-muted rounded-md flex items-center justify-center">
            <Image src={row.original.imageUrl || "https://placehold.co/100x75.png"} alt={row.original.title} width={64} height={48} className="object-contain rounded-sm" />
        </div>
    )
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título do Bem" />,
    cell: ({ row }) => (
      <div>
        <p className="font-medium line-clamp-2">{row.getValue("title")}</p>
        <span className="text-xs text-muted-foreground">{row.original.publicId}</span>
      </div>
    ),
  },
  {
    accessorKey: "categoryName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
  },
  {
    accessorKey: "evaluationValue",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor (R$)" />,
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("evaluationValue"));
      return <div className="text-right font-medium">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>;
    },
  },
];
