// src/app/admin/assets/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Ativos.
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os ativos de forma interativa,
 * permitindo busca, ordenação, exclusão em massa e visualização de detalhes.
 * A criação e edição são feitas através de um modal (`CrudFormContainer`).
 */
'use client';



import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAssets, createAsset, updateAsset, deleteAsset } from './actions';
import type { Asset, PlatformSettings, LotCategory, JudicialProcess, SellerProfileInfo, StateInfo, CityInfo } from '@/types';
import { PlusCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createColumns } from './columns';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import AssetForm from './asset-form';
import type { AssetFormData } from './asset-form-schema';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';


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

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  // Dependencies for the form
  const [dependencies, setDependencies] = useState<{
    processes: JudicialProcess[],
    categories: LotCategory[],
    sellers: SellerProfileInfo[],
    allStates: StateInfo[],
    allCities: CityInfo[],
  } | null>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAssets, settings, procs, cats, sells, states, cities] = await Promise.all([
        getAssets(),
        getPlatformSettings(),
        getJudicialProcesses(),
        getLotCategories(),
        getSellers(),
        getStates(),
        getCities(),
      ]);
      setAssets(fetchedAssets);
      setPlatformSettings(settings as PlatformSettings);
      setDependencies({ processes: procs, categories: cats, sellers: sells, allStates: states, allCities: cities });
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

  const handleNewClick = () => {
    setEditingAsset(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };
  
  const handleFormSuccess = () => {
      setIsFormOpen(false);
      setEditingAsset(null);
      onUpdate();
  };

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
  
  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEditClick }), [handleDelete]);
  const renderGridItem = (item: Asset) => <BidExpertCard item={item} type="asset" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: Asset) => <BidExpertListItem item={item} type="asset" platformSettings={platformSettings!} onUpdate={onUpdate} />;

  const assetStatusOptions = useMemo(() => 
    [...new Set(assets.map(a => a.status).filter(Boolean))]
      .map(status => ({ value: status!, label: status! })),
  [assets]);

  const facetedFilterColumns = useMemo(() => [
    { id: 'status', title: 'Status', options: assetStatusOptions },
  ], [assetStatusOptions]);

  const formAction = async (data: AssetFormData) => {
    if (editingAsset) {
      return updateAsset(editingAsset.id, data);
    }
    return createAsset(data);
  };

  if (isLoading || !platformSettings || !dependencies) {
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
            <Button onClick={handleNewClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Ativo
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
            onDeleteSelected={handleDeleteSelected as any}
          />
      </div>
       <CrudFormContainer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={platformSettings?.crudFormMode || 'modal'}
        title={editingAsset ? 'Editar Ativo' : 'Novo Ativo'}
        description={editingAsset ? 'Modifique os detalhes do ativo existente.' : 'Cadastre um novo ativo para ser loteado.'}
       >
           <AssetForm
              initialData={editingAsset}
              processes={dependencies.processes}
              categories={dependencies.categories}
              sellers={dependencies.sellers}
              allStates={dependencies.allStates}
              allCities={dependencies.allCities}
              onSubmitAction={formAction}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
           />
       </CrudFormContainer>
    </>
  );
}
