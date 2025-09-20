// src/app/admin/document-templates/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Templates de Documentos.
 * Utiliza o componente DataTable para exibir os templates de forma interativa,
 * permitindo busca, ordenação e ações como edição e exclusão. Fornece o ponto
 * de entrada para a administração dos modelos de documentos que serão gerados pela plataforma.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDocumentTemplates, deleteDocumentTemplate } from './actions';
import type { DocumentTemplate } from '@/types';
import { PlusCircle, Files } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';

export default function AdminDocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchTemplates = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTemplates = await getDocumentTemplates();
        if (isMounted) {
          setTemplates(fetchedTemplates);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Falha ao buscar templates.";
        if (isMounted) {
          setError(errorMessage);
          toast({ title: "Erro", description: errorMessage, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchTemplates();

    return () => { isMounted = false; };
  }, [toast, refetchTrigger]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteDocumentTemplate(id);
      if (result.success) {
        toast({ title: "Sucesso", description: result.message });
        setRefetchTrigger(c => c + 1);
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
      }
    },
    [toast]
  );
  
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

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
           <DataTable
            columns={columns}
            data={templates}
            isLoading={isLoading}
            error={error}
            searchColumnId="name"
            searchPlaceholder="Buscar por nome do template..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
