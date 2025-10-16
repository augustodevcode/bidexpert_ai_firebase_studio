// src/app/admin/assets/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Ativos.
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os ativos de forma interativa,
 * permitindo busca, ordenação, exclusão em massa e visualização de detalhes.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAssets, deleteAsset } from './actions';
import type { Asset, PlatformSettings } from '@/types';
import { PlusCircle, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createColumns } from './columns';
import AssetDetailsModal from '@/components/admin/assets/asset-details-modal';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import UniversalCard from '@/components/universal-card';
import UniversalListItem from '@/components/universal-list-item';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';

const sortOptions = [
  { value: 'createdAt_desc', label: 'Mais Recentes' },
  { value: 'title_asc', label: 'Título A-Z' },
  { value: 'evaluationValue_desc', label: 'Maior Valor' },
  { value: 'evaluationValue_asc', label: 'Menor Valor' },
];

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
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
      const [fetchedAssets, settings] = await Promise.all([
        getAssets(),
        getPlatformSettings()
      ]);
      setAssets(fetchedAssets);
      setPlatformSettings(settings as PlatformSettings);
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

  const onUpdate = useCallback(() => {
    setRefetchTrigger(c => c + 1);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteAsset(id);
    if (result.success) {
      toast({ title: "Sucesso", description: result.message });
      onUpdate();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, onUpdate]);
  
  const handleDeleteSelected = useCallback(async (selectedItems: Asset[]) => {
    if (selectedItems.length === 0) return;
    
    for (const item of selectedItems) {
      await deleteAsset(item.id);
    }
    toast({ title: "Exclusão em Massa Concluída", description: `${selectedItems.length} ativo(s) excluído(s) com sucesso.` });
    onUpdate();
  }, [onUpdate, toast]);

  const handleOpenDetails = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  }, []);
  
  const columns = useMemo(() => createColumns({ handleDelete, onOpenDetails: handleOpenDetails }), [handleDelete, handleOpenDetails]);
  const renderGridItem = (item: Asset) => <UniversalCard item={item} type="asset" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: Asset) => <UniversalListItem item={item} type="asset" platformSettings={platformSettings!} onUpdate={onUpdate} />;

  const assetStatusOptions = useMemo(() => 
    [...new Set(assets.map(a => a.status).filter(Boolean))]
      .map(status => ({ value: status!, label: status! })),
  [assets]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: assetStatusOptions },
  ], [assetStatusOptions]);

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
    <>
      <div className="space-y-6" data-ai-id="admin-assets-page-container">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Package className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Ativos (Bens)
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
        </Card>
         <BidExpertSearchResultsFrame
            items={assets}
            totalItemsCount={assets.length}
            renderGridItem={renderGridItem}
            renderListItem={renderListItem}
            dataTableColumns={columns}
            sortOptions={sortOptions}
            initialSortBy="createdAt_desc"
            onSortChange={() => {}} // A ordenação será feita pelo componente se não for paginada
            platformSettings={platformSettings}
            isLoading={isLoading}
            searchTypeLabel="ativos"
            emptyStateMessage="Nenhum ativo encontrado."
            facetedFilterColumns={facetedFilterColumns}
            searchColumnId="title"
            searchPlaceholder="Buscar por título ou ID do processo..."
            onDeleteSelected={handleDeleteSelected}
          />
      </div>
       <AssetDetailsModal 
        asset={selectedAsset}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
