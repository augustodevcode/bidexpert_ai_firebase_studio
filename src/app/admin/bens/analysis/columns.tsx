// src/app/admin/bens/analysis/columns.tsx
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Bem } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import Image from 'next/image';

const getStatusVariant = (status?: Bem['status']) => {
    switch (status) {
        case 'DISPONIVEL': return 'secondary';
        case 'LOTEADO': return 'default';
        case 'VENDIDO': return 'outline';
        case 'REMOVIDO': return 'destructive';
        default: return 'secondary';
    }
}

export const createBemAnalysisColumns = (): ColumnDef<Bem>[] => [
  {
    accessorKey: "imageUrl",
    header: "Imagem",
    cell: ({ row }) => {
        const imageUrl = row.getValue("imageUrl") as string | undefined;
        return (
            <div className="w-16 h-12 bg-muted rounded-md flex items-center justify-center">
                <Image src={imageUrl || "https://placehold.co/100x75.png"} alt={row.original.title} width={64} height={48} className="object-contain rounded-sm" />
            </div>
        )
    }
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título do Bem" />,
    cell: ({ row }) => (
      <Link href={`/admin/bens/${row.original.id}/edit`} className="hover:text-primary font-medium">
        <p className="line-clamp-2">{row.getValue("title")}</p>
        <span className="text-xs text-muted-foreground">{row.original.publicId}</span>
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
        const status = row.getValue("status") as Bem['status'];
        return <Badge variant={getStatusVariant(status)}>{status}</Badge>
    },
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "categoryName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "evaluationValue",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Avaliação (R$)" />,
    cell: ({ row }) => {
      const value = row.getValue("evaluationValue") as number | null;
      if (value === null || value === undefined) return 'N/A';
      return <div className="text-right font-medium">{value.toLocaleString('pt-BR')}</div>
    }
  },
  {
    accessorKey: "sellerName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Comitente" />,
  },
];
