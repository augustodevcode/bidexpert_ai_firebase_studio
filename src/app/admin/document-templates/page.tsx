// src/app/admin/document-templates/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Templates de Documentos.
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os templates de forma interativa,
 * permitindo busca, ordenação e ações como edição e exclusão. Fornece o ponto
 * de entrada para a administração dos modelos de documentos que serão gerados pela plataforma.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDocumentTemplates, deleteDocumentTemplate } from './actions';
import type { DocumentTemplate, PlatformSettings } from '@/types';
import { PlusCircle, Files } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createColumns } from './columns';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);


  useEffect(() => {
    async function fetchPageData() {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedTemplates, settings] = await Promise.all([
          getDocumentTemplates(),
          getPlatformSettings(),
        ]);
        setTemplates(fetchedTemplates);
        setPlatformSettings(settings as PlatformSettings);
      } catch (e: any) {
        setError(e.message);
        toast({ title: "Erro", description: e.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPageData();
  }, [toast, refetchTrigger]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteDocumentTemplate(id);
    if (result.success) {
      toast({ title: "Sucesso", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteSelected = useCallback(async (selectedItems: DocumentTemplate[]) => {
    for (const item of selectedItems) {
      await deleteDocumentTemplate(item.id);
    }
    toast({ title: "Sucesso", description: `${selectedItems.length} template(s) excluído(s).` });
    setRefetchTrigger(c => c + 1);
  }, [toast]);
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  if (isLoading || !platformSettings) {
    return (
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><Skeleton className="h-8 w-64 mb-2"/><Skeleton className="h-4 w-80"/></div>
                    <Skeleton className="h-10 w-36"/>
                </CardHeader>
                <CardContent><Skeleton className="h-96 w-full" /></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Files className="h-6 w-6 mr-2 text-primary" />
              Templates de Documentos
            </CardTitle>
            <CardDescription>
              Crie e gerencie templates para autos de arrematação, laudos e outros documentos.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/document-templates/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Template
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <BidExpertSearchResultsFrame
            items={templates}
            totalItemsCount={templates.length}
            dataTableColumns={columns}
            onSortChange={() => {}}
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="templates"
            searchColumnId="name"
            searchPlaceholder="Buscar por nome do template..."
            onDeleteSelected={handleDeleteSelected}
            sortOptions={[{ value: 'name', label: 'Nome' }]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
