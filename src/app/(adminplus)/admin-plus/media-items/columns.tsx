/**
 * @fileoverview Colunas da tabela MediaItem — Admin Plus.
 */
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/admin-plus/data-table-plus/data-table-column-header';
import type { MediaItemRow } from './types';

interface ColumnActions {
  onEdit: (row: MediaItemRow) => void;
  onDelete: (row: MediaItemRow) => void;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function getMediaItemColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<MediaItemRow, unknown>[] {
  return [
    {
      accessorKey: 'fileName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Arquivo" />,
      cell: ({ row }) => (
        <div data-ai-id="media-item-filename-cell">
          <span className="font-medium">{row.original.fileName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'mimeType',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs" data-ai-id="media-item-mimetype-cell">
          {row.original.mimeType}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: 'sizeBytes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tamanho" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs" data-ai-id="media-item-size-cell">
          {formatFileSize(row.original.sizeBytes)}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'uploadedByUserName',
      header: 'Enviado por',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm" data-ai-id="media-item-uploader-cell">
          {row.original.uploadedByUserName ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'uploadedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data de Upload" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs" data-ai-id="media-item-date-cell">
          {row.original.uploadedAt
            ? new Date(row.original.uploadedAt).toLocaleDateString('pt-BR')
            : '—'}
        </span>
      ),
      size: 120,
    },
    {
      id: 'actions',
      size: 60,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-ai-id="media-item-actions-trigger">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-ai-id="media-item-actions-menu">
            <DropdownMenuItem onClick={() => onEdit(row.original)} data-ai-id="media-item-edit-action">
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
              data-ai-id="media-item-delete-action"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
