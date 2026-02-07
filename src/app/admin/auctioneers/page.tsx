// src/app/admin/auctioneers/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Leiloeiros.
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros por faceta e visualização em grade, lista ou tabela.
 */
'use client';



import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctioneers as getAuctioneersAction, deleteAuctioneer, createAuctioneer, updateAuctioneer } from '@/app/admin/auctioneers/actions';
import type { AuctioneerProfileInfo, PlatformSettings, AuctioneerFormData, StateInfo, CityInfo } from '@/types';
import { PlusCircle, Landmark, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { createColumns } from '@/app/admin/auctioneers/columns';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import AuctioneerForm from '@/app/admin/auctioneers/auctioneer-form';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';

const sortOptions = [
  { value: 'name_asc', label: 'Nome A-Z' },
  { value: 'name_desc', label: 'Nome Z-A' },
  { value: 'createdAt_desc', label: 'Mais Recentes' },
];

export default function AdminAuctioneersPage() {
  const [allAuctioneers, setAllAuctioneers] = useState<AuctioneerProfileInfo[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAuctioneer, setEditingAuctioneer] = useState<AuctioneerProfileInfo | null>(null);

  // Dependencies for the form
  const [dependencies, setDependencies] = useState<{ allStates: StateInfo[], allCities: CityInfo[] } | null>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAuctioneers, settings, states, cities] = await Promise.all([
        getAuctioneersAction(),
        getPlatformSettings(),
        getStates(),
        getCities(),
      ]);
      setAllAuctioneers(fetchedAuctioneers);
      setPlatformSettings(settings as PlatformSettings);
      setDependencies({ allStates: states, allCities: cities });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar leiloeiros.";
      console.error("Error fetching auctioneers:", e);
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
    setEditingAuctioneer(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (auctioneer: AuctioneerProfileInfo) => {
    setEditingAuctioneer(auctioneer);
    setIsFormOpen(true);
  };
  
  const handleFormSuccess = () => {
      setIsFormOpen(false);
      setEditingAuctioneer(null);
      onUpdate();
  };

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteAuctioneer(id);
    if(result.success) {
      toast({ title: "Sucesso!", description: result.message });
      onUpdate();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, onUpdate]);

  const handleDeleteSelected = useCallback(async (selectedItems: AuctioneerProfileInfo[]) => {
      for (const item of selectedItems) {
        await deleteAuctioneer(item.id);
      }
      toast({ title: "Sucesso!", description: `${selectedItems.length} leiloeiro(s) excluído(s).` });
      onUpdate();
  }, [onUpdate, toast]);

  const formAction = async (data: AuctioneerFormData) => {
    if (editingAuctioneer) {
      return updateAuctioneer(editingAuctioneer.id, data);
    }
    return createAuctioneer(data);
  };

  const renderGridItem = (item: AuctioneerProfileInfo) => <BidExpertCard item={item} type="auctioneer" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: AuctioneerProfileInfo) => <BidExpertListItem item={item} type="auctioneer" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEditClick }), [handleDelete, handleEditClick]);
  
  const facetedFilterOptions = useMemo(() => {
      const stateOptions = [...new Set(allAuctioneers.map(s => s.state).filter(Boolean))].map(s => ({ value: s!, label: s! }));
      return [
          { id: 'state', title: 'Estado', options: stateOptions },
      ];
  }, [allAuctioneers]);
  
  if (error) {
    return (
        <div className="space-y-6" data-ai-id="admin-auctioneers-error">
            <Card className="shadow-lg max-w-md mx-auto mt-10">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <Landmark className="h-6 w-6" />
                        Erro ao Carregar Leiloeiros
                    </CardTitle>
                    <CardDescription>Não foi possível carregar a lista de leiloeiros.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-destructive/10 rounded-md text-sm text-destructive">
                        {error}
                    </div>
                    <Button onClick={() => fetchPageData()} className="w-full" data-ai-id="auctioneers-retry-btn">
                        <Loader2 className="mr-2 h-4 w-4" />
                        Tentar Novamente
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
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
    <div className="space-y-6" data-ai-id="admin-auctioneers-page-container">
      <Card className="shadow-lg" data-ai-id="admin-auctioneers-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Landmark className="h-6 w-6 mr-2 text-primary" />
              Listagem de Leiloeiros
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova leiloeiros da plataforma.
            </CardDescription>
          </div>
          <Button onClick={handleNewClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Leiloeiro
          </Button>
        </CardHeader>
      </Card>

      <BidExpertSearchResultsFrame
        items={allAuctioneers}
        totalItemsCount={allAuctioneers.length}
        renderGridItem={renderGridItem}
        renderListItem={renderListItem}
        dataTableColumns={columns}
        sortOptions={sortOptions}
        initialSortBy="name_asc"
        onSortChange={() => {}}
        platformSettings={platformSettings}
        isLoading={isLoading}
        searchTypeLabel="leiloeiros"
        emptyStateMessage="Nenhum leiloeiro encontrado."
        facetedFilterColumns={facetedFilterOptions}
        searchColumnId='name'
        searchPlaceholder='Buscar por nome...'
        onDeleteSelected={handleDeleteSelected as any}
      />
    </div>
    <CrudFormContainer
      isOpen={isFormOpen}
      onClose={() => setIsFormOpen(false)}
      mode={platformSettings?.crudFormMode || 'modal'}
      title={editingAuctioneer ? 'Editar Leiloeiro' : 'Novo Leiloeiro'}
      description={editingAuctioneer ? 'Modifique os detalhes do leiloeiro.' : 'Cadastre um novo leiloeiro.'}
    >
      <AuctioneerForm
        initialData={editingAuctioneer}
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
