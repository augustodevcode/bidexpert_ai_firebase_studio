// src/app/admin/contact-messages/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContactMessages, deleteContactMessage, toggleMessageReadStatus } from './actions';
import type { ContactMessage } from '@/types';
import { Mail, Trash2, Check, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Defines the columns for the contact messages data table.
 * @param {object} props - Properties including action handlers.
 * @returns {ColumnDef<ContactMessage>[]} An array of column definitions.
 */
const createColumns = ({
  handleDelete,
  handleToggleRead
}: {
  handleDelete: (id: string) => void;
  handleToggleRead: (id: string, isRead: boolean) => void;
}): ColumnDef<ContactMessage>[] => [
  {
    accessorKey: 'isRead',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isRead = row.getValue('isRead');
      return isRead ? <Badge variant="secondary">Lida</Badge> : <Badge variant="default">Nova</Badge>;
    },
    filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Remetente" />,
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        <div className="text-xs text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'subject',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assunto" />,
    cell: ({ row }) => <p className="truncate max-w-xs">{row.getValue("subject")}</p>,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
    cell: ({ row }) => format(new Date(row.getValue("createdAt")), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex gap-1 justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleToggleRead(row.original.id, row.original.isRead)}
          title={row.original.isRead ? 'Marcar como não lida' : 'Marcar como lida'}
        >
          {row.original.isRead ? <Eye className="h-4 w-4" /> : <Check className="h-4 w-4 text-green-600" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => handleDelete(row.original.id)}
          title="Excluir Mensagem"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

/**
 * Admin page for viewing and managing messages sent through the contact form.
 */
export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    async function fetchMessages() {
      setIsLoading(true);
      try {
        const result = await getContactMessages();
        setMessages(result);
      } catch (e: any) {
        setError(e.message);
        toast({ title: "Erro", description: e.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchMessages();
  }, [refetchTrigger, toast]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteContactMessage(id);
    if (result.success) {
      toast({ title: "Sucesso", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast]);

  const handleToggleRead = useCallback(async (id: string, currentStatus: boolean) => {
    const result = await toggleMessageReadStatus(id, !currentStatus);
    if (result.success) {
        toast({ title: "Status alterado", description: result.message });
        setRefetchTrigger(c => c + 1);
    } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast]);

  const columns = useMemo(() => createColumns({ handleDelete, handleToggleRead }), [handleDelete, handleToggleRead]);

  const facetedFilterOptions = [
    { id: 'isRead', title: 'Status', options: [
        { value: 'true', label: 'Lida' },
        { value: 'false', label: 'Nova' }
    ]},
  ];

  return (
    <div className="space-y-6" data-ai-id="admin-contact-messages-page-container">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Mail className="h-6 w-6 mr-2 text-primary" />
            Mensagens de Contato
          </CardTitle>
          <CardDescription>
            Visualize as mensagens enviadas através do formulário de contato do site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={messages}
            isLoading={isLoading}
            error={error}
            searchColumnId="subject"
            searchPlaceholder="Buscar por assunto ou email..."
            facetedFilterColumns={facetedFilterOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
