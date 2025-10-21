// src/app/admin/contact-messages/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ContactMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Eye, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

type ActionsProps = {
  handleDelete: (id: string) => void;
  handleToggleRead: (id: string, currentStatus: boolean) => void;
};

export const createColumns = ({ handleDelete, handleToggleRead }: ActionsProps): ColumnDef<ContactMessage>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'subject',
    header: 'Assunto',
  },
  {
    accessorKey: 'createdAt',
    header: 'Recebida em',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    accessorKey: 'isRead',
    header: 'Status',
    cell: ({ row }) => (row.original.isRead ? 'Lida' : 'Nova'),
     filterFn: (row, id, value) => {
      const isRead = row.original.isRead ? 'true' : 'false';
      return value.includes(isRead);
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const message = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleToggleRead(message.id, message.isRead)}>
              {message.isRead ? <Eye className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
              Marcar como {message.isRead ? 'não lida' : 'lida'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(message.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
