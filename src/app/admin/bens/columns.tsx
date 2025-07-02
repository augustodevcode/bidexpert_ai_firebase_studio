// src/app/admin/bens/columns.tsx
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
import type { Bem } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const getStatusVariant = (status: Bem['status']) => {
    switch (status) {
        case 'DISPONIVEL': return 'secondary';
        case 'LOTEADO': return 'default';
        case 'VENDIDO': return 'outline';
        case 'REMOVIDO': return 'destructive';
        default: return 'secondary';
    }
}

export const createColumns = ({ handleDelete }: { handleDelete: (id: string) => void }): ColumnDef<Bem>[] => [
  {
    accessorKey: "imageUrl",
    header: "Imagem",
    cell: ({ row }) => {
        const imageUrl = row.getValue("imageUrl") as string | undefined;
        return (
            <div className="w-16 h-12 bg-muted rounded-md flex items-center justify-center">
                <Image src={imageUrl || "https://placehold.co/100x75.png"} alt={row.getValue("title")} width={64} height={48} className="object-contain rounded-sm" />
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
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "categoryName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Categoria" />,
    enableGrouping: true,
  },
  {
    accessorKey: "judicialProcessNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Processo Judicial" />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const bem = row.original;
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
              <Link href={`/admin/bens/${bem.id}/edit`}><Pencil className="mr-2 h-4 w-4"/>Editar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(bem.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
