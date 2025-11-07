// src/app/admin/auctions/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Leilões.
 * Utiliza o componente BidExpertSearchResultsFrame para exibir os dados de forma interativa,
 * permitindo busca, ordenação, filtros por status e visualização em grade, lista ou tabela.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuctions as getAuctionsAction, deleteAuction } from './actions';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, PlatformSettings, AuctionFormData, StateInfo, CityInfo, LotCategory, JudicialProcess } from '@/types';
import { PlusCircle, Gavel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuctionStatusText } from '@/lib/ui-helpers';
import { getSellers } from '../sellers/actions';
import { getAuctioneers } from '../auctioneers/actions';
import BidExpertSearchResultsFrame from '@/components/BidExpertSearchResultsFrame';
import { getPlatformSettings } from '@/app/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { createColumns } from './columns';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import AuctionForm from './auction-form';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { getLotCategories } from '../categories/actions';
import { getJudicialProcesses } from '../judicial-processes/actions';
import BidExpertCard from '@/components/BidExpertCard';
import BidExpertListItem from '@/components/BidExpertListItem';
import { useRouter } from 'next/navigation';

const sortOptions = [
  { value: 'auctionDate_desc', label: 'Data: Mais Recentes' },
  { value: 'auctionDate_asc', label: 'Data: Mais Antigos' },
  { value: 'title_asc', label: 'Título A-Z' },
  { value: 'title_desc', label: 'Título Z-A' },
  { value: 'visits_desc', label: 'Mais Visitados' },
];

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const router = useRouter();


  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedAuctions, settings] = await Promise.all([
        getAuctionsAction(false), // Fetch all for admin
        getPlatformSettings(),
      ]);
      setAuctions(fetchedAuctions);
      setPlatformSettings(settings as PlatformSettings);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Falha ao buscar leilões.";
      console.error("Error fetching auctions:", e);
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

  const handleEditClick = (auction: Auction) => {
    // A edição agora é feita navegando para a página de edição
    router.push(`/admin/auctions/${auction.id}/edit`);
  };

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteAuction(id);
      if (result.success) {
        toast({ title: "Sucesso!", description: result.message });
        onUpdate();
      } else {
        toast({
          title: "Erro ao Excluir",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    [toast, onUpdate]
  );
  
  const handleDeleteSelected = useCallback(async (selectedItems: Auction[]) => {
      for (const item of selectedItems) {
        await deleteAuction(item.id);
      }
      toast({ title: "Sucesso!", description: `${selectedItems.length} leilão(ões) excluído(s).` });
      onUpdate();
  }, [onUpdate, toast]);

  const renderGridItem = (item: Auction) => <BidExpertCard item={item} type="auction" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const renderListItem = (item: Auction) => <BidExpertListItem item={item} type="auction" platformSettings={platformSettings!} onUpdate={onUpdate} />;
  const columns = useMemo(() => createColumns({ handleDelete, onEdit: handleEditClick }), [handleDelete, handleEditClick]);

  const facetedFilterOptions = useMemo(() => {
      const statusOptions = [...new Set(auctions.map(a => a.status))].map(status => ({ value: status!, label: getAuctionStatusText(status) }));
      const sellerOptions = [...new Set(auctions.map(a => a.sellerName).filter(Boolean))].map(s => ({ value: s!, label: s! }));
      const auctioneerOptions = [...new Set(auctions.map(a => a.auctioneerName).filter(Boolean))].map(a => ({ value: a!, label: a! }));
      return [
          { id: 'status', title: 'Status', options: statusOptions },
          { id: 'sellerName', title: 'Comitente', options: sellerOptions },
          { id: 'auctioneerName', title: 'Leiloeiro', options: auctioneerOptions },
      ];
  }, [auctions]);
  
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
      <div className="space-y-6" data-ai-id="admin-auctions-page-container">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Gavel className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Leilões
              </CardTitle>
              <CardDescription>
                Visualize, adicione e edite os leilões da plataforma.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/auctions/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Leilão
              </Link>
            </Button>
          </CardHeader>
        </Card>

        <BidExpertSearchResultsFrame
          items={auctions}
          totalItemsCount={auctions.length}
          renderGridItem={renderGridItem}
          renderListItem={renderListItem}
          dataTableColumns={columns}
          sortOptions={sortOptions}
          initialSortBy="auctionDate_desc"
          onSortChange={() => {}}
          platformSettings={platformSettings}
          isLoading={isLoading}
          searchTypeLabel="leilões"
          emptyStateMessage="Nenhum leilão encontrado."
          facetedFilterColumns={facetedFilterOptions}
          searchColumnId='title'
          searchPlaceholder='Buscar por título...'
          onDeleteSelected={handleDeleteSelected as any}
        />
      </div>
    </>
  );
}
