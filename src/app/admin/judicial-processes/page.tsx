// src/app/admin/judicial-processes/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Processos Judiciais.
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os processos de forma interativa,
 * permitindo busca, ordenação, filtros facetados e ações como exclusão.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getJudicialProcesses, deleteJudicialProcess, createJudicialProcessAction, updateJudicialProcessAction } from './actions';
import type { JudicialProcess, PlatformSettings, JudicialProcessFormData, Court, JudicialDistrict, JudicialBranch, SellerProfileInfo } from '@/types';
import { PlusCircle, Gavel, FileUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { createColumns } from './columns';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import JudicialProcessForm from './judicial-process-form';
import { getCourts } from '../courts/actions';
import { getJudicialDistricts } from '../judicial-districts/actions';
import { getJudicialBranches } from '../judicial-branches/actions';
import { getSellers } from '../sellers/actions';

export default function AdminJudicialProcessesPage() {
  const [processes, setProcesses] = useState<JudicialProcess[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<JudicialProcess | null>(null);

  // Dependencies for the form
  const [dependencies, setDependencies] = useState<{
    courts: Court[],
    allDistricts: JudicialDistrict[],
    allBranches: JudicialBranch[],
    sellers: SellerProfileInfo[],
  } | null>(null);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedItems, settings, courts, districts, branches, sellers] = await Promise.all([
        getJudicialProcesses(),
        getPlatformSettings(),
        getCourts(),
        getJudicialDistricts(),
        getJudicialBranches(),
        getSellers(),
      ]);
      setProcesses(fetchedItems);
      setPlatformSettings(settings as PlatformSettings);
      setDependencies({ courts, allDistricts: districts, allBranches: branches, sellers });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar processos judiciais.";
      console.error("Error fetching judicial processes:", e);
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
    setEditingProcess(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (process: JudicialProcess) => {
    setEditingProcess(process);
    setIsFormOpen(true);
  };
  
  const handleFormSuccess = () => {
      setIsFormOpen(false);
      setEditingProcess(null);
      onUpdate();
  };

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteJudicialProcess(id);
    if (result.success) {
      toast({ title: "Sucesso", description: result.message });
      onUpdate();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }, [toast, onUpdate]);
  
  const handleDeleteSelected = useCallback(async (selectedItems: JudicialProcess[]) => {
    if (selectedItems.length === 0) return;
    
    for (const item of selectedItems) {
      await deleteJudicialProcess(item.id);
    }
    toast({ title: "Exclusão em Massa Concluída", description: `${selectedItems.length} processo(s) excluído(s) com sucesso.` });
    onUpdate();
  }, [onUpdate, toast]);

  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEditClick }), [handleDelete]);

  const formAction = async (data: JudicialProcessFormData) => {
    if (editingProcess) {
      return updateJudicialProcessAction(editingProcess.id, data);
    }
    return createJudicialProcessAction(data);
  };

  const facetedFilterOptions = useMemo(() => {
    const courts = [...new Set(processes.map(p => p.courtName).filter(Boolean))] as string[];
    const branches = [...new Set(processes.map(p => p.branchName).filter(Boolean))] as string[];
    
    return [
      { id: 'courtName', title: 'Tribunal', options: courts.map(name => ({label: name!, value: name!})) },
      { id: 'branchName', title: 'Vara', options: branches.map(name => ({label: name!, value: name!})) }
    ];
  }, [processes]);

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
    <div className="space-y-6" data-ai-id="admin-judicial-processes-page-container">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Gavel className="h-6 w-6 mr-2 text-primary" />
              Gerenciar Processos Judiciais
            </CardTitle>
            <CardDescription>
              Adicione, edite ou remova os processos judiciais.
            </CardDescription>
          </div>
           <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
                <Link href="/admin/import/cnj">
                    <FileUp className="mr-2 h-4 w-4" /> Importar do CNJ
                </Link>
            </Button>
            <Button onClick={handleNewClick}>
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Processo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           <BidExpertSearchResultsFrame
                items={processes}
                dataTableColumns={columns}
                onSortChange={() => {}}
                platformSettings={platformSettings}
                isLoading={isLoading}
                searchTypeLabel="processos"
                searchColumnId="processNumber"
                searchPlaceholder="Buscar por nº do processo..."
                facetedFilterColumns={facetedFilterOptions}
                onDeleteSelected={handleDeleteSelected as any}
                sortOptions={[{ value: 'processNumber', label: 'Nº do Processo' }]}
            />
        </CardContent>
      </Card>
    </div>
    <CrudFormContainer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode="modal"
        title={editingProcess ? 'Editar Processo Judicial' : 'Novo Processo Judicial'}
        description={editingProcess ? 'Modifique os detalhes do processo.' : 'Cadastre um novo processo e suas partes.'}
    >
        <JudicialProcessForm
          initialData={editingProcess}
          courts={dependencies.courts}
          allDistricts={dependencies.allDistricts}
          allBranches={dependencies.allBranches}
          sellers={dependencies.sellers}
          onSubmitAction={formAction}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
    </CrudFormContainer>
    </>
  );
}
