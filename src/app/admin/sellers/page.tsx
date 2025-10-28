// src/app/admin/sellers/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Comitentes (Vendedores).
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros por faceta e visualização em grade, lista ou tabela.
 * A criação e edição são feitas através de um modal (`CrudFormContainer`), com suporte a sub-modais para criação de entidades relacionadas.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSellers as getSellersAction, deleteSeller, createSeller, updateSeller } from './actions';
import type { SellerProfileInfo, PlatformSettings, SellerFormData, JudicialBranch, StateInfo, CityInfo } from '@/types';
import { PlusCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { createColumns } from './columns';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import SellerForm from './seller-form';
import { getJudicialBranches } from '../judicial-branches/actions';
import { getStates } from '../states/actions';
import { getCities } from '../cities/actions';

// Define os tipos de modais que esta página pode abrir
type ModalState = 
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; seller: SellerProfileInfo };

export default function AdminSellersPage() {
  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  // Estado para controlar o modal principal (criação/edição de Seller)
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });

  // Dependências para os formulários
  const [dependencies, setDependencies] = useState<{
    judicialBranches: JudicialBranch[],
    allStates: StateInfo[],
    allCities: CityInfo[],
  } | null>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedSellers, settings, branches, states, cities] = await Promise.all([
        getSellersAction(),
        getPlatformSettings(),
        getJudicialBranches(),
        getStates(),
        getCities(),
      ]);
      setAllSellers(fetchedSellers);
      setPlatformSettings(settings as PlatformSettings);
      setDependencies({ judicialBranches: branches, allStates: states, allCities: cities });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar comitentes.";
      console.error("Error fetching sellers:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPageData();
  }, [fetchPageData, refetchTrigger]);
  
  const onUpdate = useCallback(() => setRefetchTrigger(c => c + 1), []);
  const handleNewClick = () => setModalState({ mode: 'create' });
  const handleEditClick = (seller: SellerProfileInfo) => setModalState({ mode: 'edit', seller });
  
  const handleFormSuccess = (sellerId?: string) => {
    setModalState({ mode: 'closed' });
    onUpdate();
  };

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteSeller(id);
    if(result.success) {
      toast({ title: "Sucesso!", description: result.message });
      onUpdate();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, onUpdate]);

  const handleDeleteSelected = useCallback(async (selectedItems: SellerProfileInfo[]) => {
      for (const item of selectedItems) {
        await deleteSeller(item.id);
      }
      toast({ title: "Sucesso!", description: `${selectedItems.length} comitente(s) excluído(s).` });
      onUpdate();
  }, [onUpdate, toast]);
  
  const formAction = async (data: SellerFormData) => {
    if (modalState.mode === 'edit') {
      return updateSeller(modalState.seller.id, data);
    }
    return createSeller(data);
  };

  const renderGridItem = (item: SellerProfileInfo) => <BidExpertCard item={item} type="seller" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: SellerProfileInfo) => <BidExpertListItem item={item} type="seller" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEditClick }), [handleDelete, handleEditClick]);
  
  const facetedFilterOptions = useMemo(() => {
      const stateOptions = [...new Set(allSellers.map(s => s.state).filter(Boolean))].map(s => ({ value: s!, label: s! }));
      return [
          { id: 'state', title: 'Estado', options: stateOptions },
          { id: 'isJudicial', title: 'Tipo', options: [{ value: 'true', label: 'Judicial'}, { value: 'false', label: 'Não Judicial'}]}
      ];
  }, [allSellers]);
  
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
    <div className="space-y-6" data-ai-id="admin-sellers-page-container">
      <Card className="shadow-lg" data-ai-id="admin-sellers-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Users className="h-6 w-6 mr-2 text-primary" />
              Listagem de Comitentes
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova comitentes/vendedores da plataforma.
            </CardDescription>
          </div>
          <Button onClick={handleNewClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Comitente
          </Button>
        </CardHeader>
      </Card>

      <BidExpertSearchResultsFrame
        items={allSellers}
        totalItemsCount={allSellers.length}
        renderGridItem={renderGridItem}
        renderListItem={renderListItem}
        dataTableColumns={columns}
        sortOptions={sortOptions}
        initialSortBy="name_asc"
        onSortChange={() => {}}
        platformSettings={platformSettings}
        isLoading={isLoading}
        searchTypeLabel="comitentes"
        emptyStateMessage="Nenhum comitente encontrado."
        facetedFilterColumns={facetedFilterOptions}
        searchColumnId='name'
        searchPlaceholder='Buscar por nome...'
        onDeleteSelected={handleDeleteSelected as any}
      />
    </div>
    
    <CrudFormContainer
      isOpen={modalState.mode !== 'closed'}
      onClose={() => setModalState({ mode: 'closed' })}
      mode={platformSettings?.crudFormMode || 'modal'}
      title={modalState.mode === 'edit' ? 'Editar Comitente' : 'Novo Comitente'}
      description={modalState.mode === 'edit' ? 'Modifique os detalhes do comitente.' : 'Cadastre um novo comitente/vendedor.'}
    >
        <SellerForm
            initialData={modalState.mode === 'edit' ? modalState.seller : null}
            judicialBranches={dependencies.judicialBranches}
            allStates={dependencies.allStates}
            allCities={dependencies.allCities}
            onSubmitAction={formAction}
            onSuccess={handleFormSuccess}
            onCancel={() => setModalState({ mode: 'closed' })}
        />
    </CrudFormContainer>
    </>
  );
}
