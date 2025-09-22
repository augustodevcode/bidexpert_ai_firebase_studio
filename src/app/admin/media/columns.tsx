// src/app/admin/media/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a DataTable que exibe
 * a Biblioteca de Mídia. Inclui renderização de miniaturas de imagem,
 * informações do arquivo (título, tipo, tamanho) e um menu de ações
 * para edição de metadados e exclusão.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { MoreHorizontal, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import type { MediaItem } from '@/types';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useEffect } from 'react';

const ClientOnlyDate = ({ date }: { date: string | Date | null | undefined }) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (date) {
            try {
                setFormattedDate(format(new Date(date as string), "dd/MM/yyyy HH:mm", { locale: ptBR }));
            } catch {
                setFormattedDate('Data inválida');
            }
        } else {
            setFormattedDate('N/A');
        }
    }, [date]);

    return <span>{formattedDate}</span>;
}


export const createColumns = ({
  handleDelete,
  onEdit,
}: {
  handleDelete: (id: string) => void;
  onEdit: (item: MediaItem) => void;
}): ColumnDef<MediaItem>[] => [
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
    accessorKey: "urlThumbnail",
    header: "Prévia",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
          {item.mimeType?.startsWith('image/') ? (
            <Image
              src={item.urlThumbnail || item.urlOriginal}
              alt={item.altText || item.title || item.fileName}
              width={64}
              height={64}
              className="object-contain rounded-md"
              data-ai-hint={item.dataAiHint || "media item"}
            />
          ) : (
            <FileText className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium truncate max-w-[250px]">{item.title || '(Sem Título)'}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[250px]">{item.fileName}</span>
          <span className="text-xs text-muted-foreground">{item.mimeType}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "uploadedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data de Upload" />,
    cell: ({ row }) => <ClientOnlyDate date={row.getValue("uploadedAt")} />,
  },
  {
    accessorKey: "sizeBytes",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tamanho" />,
    cell: ({ row }) => {
        const bytes = row.original.sizeBytes;
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;
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
            <DropdownMenuItem onClick={() => onEdit(item)}>
              Editar Metadados
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];