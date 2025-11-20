// src/app/admin/judicial-branches/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Varas Judiciais.
 * Utiliza o componente DataTable para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros por comarca e ações como exclusão.
 */
'use client';



import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getJudicialBranches, deleteJudicialBranch, createJudicialBranch, updateJudicialBranch } from '@/app/admin/judicial-branches/actions';
import type { JudicialBranch, PlatformSettings, JudicialBranchFormData, JudicialDistrict } from '@/types';
import { PlusCircle, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { createColumns } from '@/app/admin/judicial-branches/columns';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { getJudicialDistricts } from '@/app/admin/judicial-districts/actions';
import { Skeleton } from '@/components/ui/skeleton';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import JudicialBranchForm from '@/app/admin/judicial-branches/judicial-branch-form';

export default function AdminJudicialBranchesPage() {
  const [branches, setBranches] = useState<JudicialBranch[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Form Modal State
  const [modalState, setModalState] = useState<{ mode: 'closed' | 'create' | 'edit'; data?: JudicialBranch }>({ mode: 'closed' });
  const [isSubformOpen, setIsSubformOpen] = useState(false);

  // Dependencies for the form
  const [dependencies, setDependencies] = useState<{ districts: JudicialDistrict[] } | null>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedItems, settings, districts] = await Promise.all([
        getJudicialBranches(),
        getPlatformSettings(),
        getJudicialDistricts(),
      ]);
      setBranches(fetchedItems);
      setPlatformSettings(settings as PlatformSettings);
      setDependencies({ districts });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar varas judiciais.";
      console.error("Error fetching judicial branches:", e);
      setError(errorMessage);
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPageData();
  }, [refetchTrigger, fetchPageData]);
  
  const onUpdate = useCallback(() => {
    setRefetchTrigger(c => c + 1);
    if(isSubformOpen) {
      setIsSubformOpen(false);
    }
  }, [isSubformOpen]);

  const handleNewClick = () => setModalState({ mode: 'create' });
  const handleEditClick = (branch: JudicialBranch) => setModalState({ mode: 'edit', data: branch });
  const handleFormSuccess = () => {
      setModalState({ mode: 'closed' });
      onUpdate();
  };

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteJudicialBranch(id);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      onUpdate();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, onUpdate]);
  
  const handleDeleteSelected = useCallback(async (selectedItems: JudicialBranch[]) => {
    if (selectedItems.length === 0) return;
    for (const item of selectedItems) {
      await deleteJudicialBranch(item.id);
    }
    toast({ title: "Exclusão em Massa Concluída", description: `${selectedItems.length} vara(s) excluída(s) com sucesso.` });
    onUpdate();
  }, [onUpdate, toast]);
  
  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEditClick }), [handleDelete]);

  const formAction = async (data: JudicialBranchFormData) => {
    if (modalState.mode === 'edit' && modalState.data) {
      return updateJudicialBranch(modalState.data.id, data);
    }
    return createJudicialBranch(data);
  };
  
  const facetedFilterOptions = useMemo(() => {
    const districts = [...new Set(branches.map(b => b.districtName).filter(Boolean))] as string[];
    return [
      { id: 'districtName', title: 'Comarca', options: districts.map(name => ({label: name!, value: name!})) }
    ];
  }, [branches]);

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
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Varas Judiciais
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova as varas judiciais vinculadas às comarcas.
            </CardDescription>
          </div>
          <Button onClick={handleNewClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Vara
          </Button>
        </CardHeader>
        <CardContent>
           <BidExpertSearchResultsFrame
                items={branches}
                dataTableColumns={columns}
                onSortChange={() => {}}
                platformSettings={platformSettings}
                isLoading={isLoading}
                searchTypeLabel="varas"
                searchColumnId="name"
                searchPlaceholder="Buscar por nome da vara..."
                facetedFilterColumns={facetedFilterOptions}
                onDeleteSelected={handleDeleteSelected}
                sortOptions={[{ value: 'name', label: 'Nome' }, { value: 'districtName', label: 'Comarca' }]}
            />
        </CardContent>
      </Card>
    </div>
    <CrudFormContainer
        isOpen={modalState.mode !== 'closed'}
        onClose={() => setModalState({ mode: 'closed' })}
        mode={platformSettings?.crudFormMode || 'modal'}
        title={modalState.mode === 'edit' ? 'Editar Vara Judicial' : 'Nova Vara Judicial'}
        description={modalState.mode === 'edit' ? 'Modifique os detalhes da vara.' : 'Cadastre uma nova vara judicial.'}
    >
        <JudicialBranchForm
            initialData={modalState.mode === 'edit' ? modalState.data : null}
            districts={dependencies.districts}
            onSubmitAction={formAction}
            onSuccess={handleFormSuccess}
            onCancel={() => setModalState({ mode: 'closed' })}
        />
    </CrudFormContainer>
    </>
  );
}

