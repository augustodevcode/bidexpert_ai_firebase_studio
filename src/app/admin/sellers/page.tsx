// src/app/admin/sellers/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Comitentes (Vendedores).
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros por faceta e visualização em grade, lista ou tabela.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSellers as getSellersAction, deleteSeller } from './actions';
import type { SellerProfileInfo, PlatformSettings } from '@/types';
import { PlusCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { createColumns } from './columns';

const sortOptions = [
  { value: 'name_asc', label: 'Nome A-Z' },
  { value: 'name_desc', label: 'Nome Z-A' },
  { value: 'createdAt_desc', label: 'Mais Recentes' },
];

export default function AdminSellersPage() {
  const [allSellers, setAllSellers] = useState<SellerProfileInfo[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedSellers, settings] = await Promise.all([
        getSellersAction(),
        getPlatformSettings(),
      ]);
      setAllSellers(fetchedSellers);
      setPlatformSettings(settings as PlatformSettings);
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
  
  const onUpdate = useCallback(() => {
    setRefetchTrigger(c => c + 1);
  }, []);
  
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
      // Logic for batch deletion
      for (const item of selectedItems) {
        await deleteSeller(item.id);
      }
      toast({ title: "Sucesso!", description: `${selectedItems.length} comitente(s) excluído(s).` });
      onUpdate();
  }, [onUpdate, toast]);

  const renderGridItem = (item: SellerProfileInfo) => <BidExpertCard item={item} type="seller" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: SellerProfileInfo) => <BidExpertListItem item={item} type="seller" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const columns = useMemo(() => createColumns({ handleDelete }), [handleDelete]);

  const facetedFilterOptions = useMemo(() => {
      const stateOptions = [...new Set(allSellers.map(s => s.state).filter(Boolean))].map(s => ({ value: s!, label: s! }));
      return [
          { id: 'state', title: 'Estado', options: stateOptions },
          { id: 'isJudicial', title: 'Tipo', options: [{value: 'true', label: 'Judicial'}, {value: 'false', label: 'Não Judicial'}]}
      ];
  }, [allSellers]);
  
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
          <Button asChild>
            <Link href="/admin/sellers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Comitente
            </Link>
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
        searchPlaceholder='Buscar por nome ou email...'
        onDeleteSelected={handleDeleteSelected as any}
      />
    </div>
  );
}
