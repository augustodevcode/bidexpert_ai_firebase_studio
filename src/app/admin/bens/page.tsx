// src/app/admin/bens/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Bens (ativos).
 * Utiliza o componente DataTable para exibir os bens de forma interativa,
 * permitindo busca, ordenação, exclusão em massa e visualização de detalhes
 * em um modal.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBens, deleteBem } from './actions';
import type { Bem } from '@/types';
import { PlusCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import BemDetailsModal from '@/components/admin/bens/bem-details-modal';

export default function AdminBensPage() {
  const [bens, setBens] = useState<Bem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBem, setSelectedBem] = useState<Bem | null>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedBens = await getBens();
      setBens(fetchedBens);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar bens.";
      console.error("Error fetching bens:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPageData();
  }, [fetchPageData, refetchTrigger]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteBem(id);
    if (result.success) {
      toast({ title: "Sucesso", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast]);
  
  const handleDeleteSelected = useCallback(async (selectedItems: Bem[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteBem(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.title}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} bem(ns) excluído(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);

  const handleOpenDetails = useCallback((bem: Bem) => {
    setSelectedBem(bem);
    setIsModalOpen(true);
  }, []);
  
  const columns = useMemo(() => createColumns({ handleDelete, onOpenDetails: handleOpenDetails }), [handleDelete, handleOpenDetails]);

  return (
    <>
      <div className="space-y-6" data-ai-id="admin-bens-page-container">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Package className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Bens
              </CardTitle>
              <CardDescription>
                Cadastre e gerencie os bens individuais que poderão ser loteados.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/bens/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Bem
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={bens}
              isLoading={isLoading}
              error={error}
              searchColumnId="title"
              searchPlaceholder="Buscar por título ou ID do processo..."
              onDeleteSelected={handleDeleteSelected}
            />
          </CardContent>
        </Card>
      </div>
       <BemDetailsModal 
        bem={selectedBem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
