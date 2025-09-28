// src/app/admin/assets/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Ativos.
 * Utiliza o componente DataTable para exibir os ativos de forma interativa,
 * permitindo busca, ordenação, exclusão em massa e visualização de detalhes
 * em um modal.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAssets, deleteAsset } from './actions';
import type { Asset } from '@/types';
import { PlusCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import AssetDetailsModal from '@/components/admin/assets/asset-details-modal';

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedAssets = await getAssets();
      setAssets(fetchedAssets);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar ativos.";
      console.error("Error fetching assets:", e);
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
    const result = await deleteAsset(id);
    if (result.success) {
      toast({ title: "Sucesso", description: result.message });
      setRefetchTrigger(c => c + 1);
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast]);
  
  const handleDeleteSelected = useCallback(async (selectedItems: Asset[]) => {
    if (selectedItems.length === 0) return;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of selectedItems) {
      const result = await deleteAsset(item.id);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast({ title: `Erro ao excluir ${item.title}`, description: result.message, variant: "destructive", duration: 5000 });
      }
    }

    if (successCount > 0) {
      toast({ title: "Exclusão em Massa Concluída", description: `${successCount} ativo(s) excluído(s) com sucesso.` });
    }
    fetchPageData();
  }, [toast, fetchPageData]);

  const handleOpenDetails = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  }, []);
  
  const columns = useMemo(() => createColumns({ handleDelete, onOpenDetails: handleOpenDetails }), [handleDelete, handleOpenDetails]);

  return (
    <>
      <div className="space-y-6" data-ai-id="admin-assets-page-container">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Package className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Ativos
              </CardTitle>
              <CardDescription>
                Cadastre e gerencie os ativos individuais que poderão ser posteriormente loteados.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/assets/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Ativo
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={assets}
              isLoading={isLoading}
              error={error}
              searchColumnId="title"
              searchPlaceholder="Buscar por título ou ID do processo..."
              onDeleteSelected={handleDeleteSelected}
            />
          </CardContent>
        </Card>
      </div>
       <AssetDetailsModal 
        asset={selectedAsset}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
