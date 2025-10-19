// src/app/admin/assets/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de Assets (ativos). Inclui renderização de imagem, status
 * com badge, e um menu de ações para cada linha (editar, excluir, etc.).
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import type { Asset } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const getStatusVariant = (status: Asset['status']) => {
    switch (status) {
        case 'DISPONIVEL': return 'secondary';
        case 'LOTEADO': return 'default';
        case 'VENDIDO': return 'outline';
        case 'REMOVIDO': return 'destructive';
        default: return 'secondary';
    }
}

export const createColumns = ({ handleDelete, onEdit }: { handleDelete: (id: string) => void, onEdit: (asset: Asset) => void }): ColumnDef<Asset>[] => [
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
      <div className="font-medium">
        <p className="line-clamp-2">{row.getValue("title")}</p>
        <span className="text-xs text-muted-foreground">{row.original.publicId}</span>
      </div>
    ),
  },
  {
    accessorKey: "lotInfo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lote Vinculado" />,
    cell: ({ row }) => row.original.lotInfo ? <span className="text-xs text-muted-foreground">{row.original.lotInfo}</span> : <span className="text-xs text-muted-foreground">-</span>,
    enableGrouping: true,
  },
  {
    accessorKey: "judicialProcessNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Processo Judicial" />,
    cell: ({ row }) => row.original.judicialProcessNumber || '-',
    enableGrouping: true,
  },
  {
    accessorKey: "sellerName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Comitente" />,
    cell: ({ row }) => row.original.sellerName || '-',
    enableGrouping: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
        const status = row.getValue("status") as Asset['status'];
        return <Badge variant={getStatusVariant(status)}>{status}</Badge>
    },
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
    id: "actions",
    cell: ({ row }) => {
      const asset = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(asset)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(asset.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      );
    },
  },
];
