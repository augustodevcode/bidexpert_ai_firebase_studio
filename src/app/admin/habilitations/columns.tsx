// src/app/admin/habilitations/columns.tsx
/**
 * @fileoverview Define a estrutura das colunas para a tabela de dados (DataTable)
 * que exibe a lista de solicitações de habilitação. Inclui renderização de status
 * com badges e links para a página detalhada de revisão de documentos do usuário.
 */
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { UserProfileData } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { getUserHabilitationStatusInfo } from '@/lib/ui-helpers';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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


export const createColumns = (): ColumnDef<UserProfileData>[] => [
  {
    accessorKey: "fullName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome do Usuário" />,
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("fullName")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "habilitationStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("habilitationStatus");
      const statusInfo = getUserHabilitationStatusInfo(status as any);
      const Icon = statusInfo.icon;
      return <Badge variant="outline" className="flex items-center gap-1.5"><Icon className="h-3 w-3" />{statusInfo.text}</Badge>;
    },
    filterFn: (row, id, value) => (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Última Atualização" />,
    cell: ({ row }) => <ClientOnlyDate date={row.getValue("updatedAt")} />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/habilitations/${user.id}`}>
            <Eye className="mr-2 h-4 w-4" />Revisar Documentos
          </Link>
        </Button>
      );
    },
  },
];