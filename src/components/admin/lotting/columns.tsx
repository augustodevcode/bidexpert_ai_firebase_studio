// src/components/admin/lotting/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Bem } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export const createColumns = ({ onOpenDetails }: { onOpenDetails?: (bem: Bem) => void }): ColumnDef<Bem>[] => [
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
      <div className="flex items-center gap-2">
        <p className="font-medium line-clamp-2">{row.getValue("title")}</p>
        {onOpenDetails && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onOpenDetails(row.original)}>
                <Eye className="h-3.5 w-3.5 text-muted-foreground"/>
            </Button>
        )}
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
      return <div className="text-right font-medium">{value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}</div>;
    },
  },
];
