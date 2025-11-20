// src/app/admin/contact-messages/page.tsx
'use client';



import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContactMessages, deleteContactMessage, toggleMessageReadStatus } from './actions';
import type { ContactMessage, PlatformSettings } from '@/types';
import { Mail, Trash2, Check, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { createColumns } from './columns';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      setIsLoading(true);
      try {
        const [result, settings] = await Promise.all([
          getContactMessages(),
          getPlatformSettings(),
        ]);
        setMessages(result);
        setPlatformSettings(settings as PlatformSettings);
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
  
  const handleDeleteSelected = useCallback(async (selectedItems: ContactMessage[]) => {
    for(const item of selectedItems) {
      await deleteContactMessage(item.id);
    }
    toast({ title: 'Sucesso', description: `${selectedItems.length} mensagem(s) excluída(s).` });
    setRefetchTrigger(c => c + 1);
  }, [toast]);

  const columns = useMemo(() => createColumns({ handleDelete, handleToggleRead }), [handleDelete, handleToggleRead]);

  const facetedFilterOptions = [
    { id: 'isRead', title: 'Status', options: [
        { value: 'true', label: 'Lida' },
        { value: 'false', label: 'Nova' }
    ]},
  ];
  
  if (isLoading || !platformSettings) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
            <CardHeader>
                <Skeleton className="h-8 w-64 mb-2"/><Skeleton className="h-4 w-80"/>
            </CardHeader>
            <CardContent><Skeleton className="h-96 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

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
           <BidExpertSearchResultsFrame
            items={messages}
            totalItemsCount={messages.length}
            dataTableColumns={columns}
            onSortChange={() => {}}
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="mensagens"
            searchColumnId="subject"
            searchPlaceholder="Buscar por assunto ou email..."
            facetedFilterColumns={facetedFilterOptions}
            sortOptions={[{ value: 'createdAt', label: 'Mais Recentes' }]}
            onDeleteSelected={handleDeleteSelected}
          />
        </CardContent>
      </Card>
    </div>
  );
}
