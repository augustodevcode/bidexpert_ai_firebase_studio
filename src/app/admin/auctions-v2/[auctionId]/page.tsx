// src/app/admin/auctions-v2/[auctionId]/page.tsx
/**
 * @fileoverview Página de visualização e edição do Leilão V2.
 * Formulário V2 único (V1 desativado), grid de lotes e histórico.
 */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Gavel,
  ArrowLeft,
  FileText,
  Package,
  History,
  ExternalLink,
  Settings,
  MoreVertical,
  Copy,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AuctionFormV2 from '@/app/admin/auctions-v2/components/auction-form-v2';
import AuctionLotsGrid from '@/app/admin/auctions-v2/components/auction-lots-grid';
import AuctionAuditGrid from '@/app/admin/auctions-v2/components/auction-audit-grid';
import { getAuctionV2, updateAuctionV2 } from '@/app/admin/auctions-v2/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import type {
  Auction,
  AuctionFormData,
  AuctioneerProfileInfo,
  SellerProfileInfo,
  StateInfo,
  CityInfo,
  JudicialProcess,
} from '@/types';

interface PageDependencies {
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  states: StateInfo[];
  allCities: CityInfo[];
  judicialProcesses: JudicialProcess[];
}

const statusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  EM_PREPARACAO: 'Em preparação',
  EM_BREVE: 'Em breve',
  ABERTO: 'Aberto',
  ABERTO_PARA_LANCES: 'Aberto para lances',
  ENCERRADO: 'Encerrado',
  VENDIDO: 'Vendido',
  CANCELADO: 'Cancelado',
};

const statusColors: Record<string, string> = {
  RASCUNHO: 'bg-muted text-muted-foreground',
  EM_PREPARACAO: 'bg-primary/10 text-primary border border-primary/20',
  EM_BREVE: 'bg-primary/10 text-primary border border-primary/20',
  ABERTO: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  ABERTO_PARA_LANCES: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  ENCERRADO: 'bg-slate-200 text-slate-800 border border-slate-300',
  VENDIDO: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  CANCELADO: 'bg-destructive/10 text-destructive border border-destructive/30',
};

export default function AuctionDetailPageV2() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const auctionId = useMemo(() => (params?.auctionId as string) || '', [params]);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [dependencies, setDependencies] = useState<PageDependencies | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('form');

  const loadData = useCallback(async () => {
    if (!auctionId) return;
    setIsLoading(true);
    try {
      const [auctionData, auctioneers, sellers, states, cities, judicialProcesses] = await Promise.all([
        getAuctionV2(auctionId),
        getAuctioneers(),
        getSellers(),
        getStates(),
        getCities(),
        getJudicialProcesses(),
      ]);

      if (!auctionData) {
        toast({
          title: 'Leilão não encontrado',
          description: 'Verifique o identificador informado.',
          variant: 'destructive',
        });
        router.push('/admin/auctions-v2');
        return;
      }

      setAuction(auctionData);
      setDependencies({
        auctioneers,
        sellers,
        states,
        allCities: cities,
        judicialProcesses,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do leilão V2:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [auctionId, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateAuctionV2 = useCallback(
    async (data: Partial<AuctionFormData>) => {
      if (!auctionId) {
        return { success: false, message: 'ID inválido' };
      }
      const result = await updateAuctionV2(auctionId, data);
      if (result.success) {
        toast({ title: 'Sucesso!', description: 'Leilão atualizado.' });
        loadData();
      } else {
        toast({ title: 'Erro ao atualizar', description: result.message, variant: 'destructive' });
      }
      return result;
    },
    [auctionId, loadData, toast]
  );

  const handleCopyId = () => {
    navigator.clipboard.writeText(auction?.publicId || auction?.id || '');
    toast({
      title: 'Copiado!',
      description: 'ID do leilão copiado para a área de transferência.',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!auction || !dependencies) {
    return (
      <div className="text-center py-12">
        <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Leilão não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/auctions-v2')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/auctions-v2')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{auction.title}</h1>
              <Badge className={cn(statusColors[auction.status || 'RASCUNHO'])}>
                {statusLabels[auction.status || 'RASCUNHO']}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>ID: {auction.publicId || auction.id}</span>
              {typeof auction.totalLots === 'number' ? (
                <>
                  <span>•</span>
                  <span>{auction.totalLots} lote(s)</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyId}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar ID
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/auctions/${auction.publicId || auction.id}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver público
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/auctions/${auction.id}/auction-control-center`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Central de Controle
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir leilão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Dados do Leilão</span>
              <span className="sm:hidden">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="lots" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Lotes</span>
              <span className="sm:hidden">Lotes</span>
              {auction.totalLots !== undefined && auction.totalLots > 0 ? (
                <Badge variant="secondary" className="ml-1">
                  {auction.totalLots}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
              <span className="sm:hidden">Hist.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-0">
            <AuctionFormV2
              initialData={auction}
              auctioneers={dependencies.auctioneers}
              sellers={dependencies.sellers}
              states={dependencies.states}
              allCities={dependencies.allCities}
              judicialProcesses={dependencies.judicialProcesses}
              isEditing
              onSubmit={handleUpdateAuctionV2}
            />
          </TabsContent>

          <TabsContent value="lots" className="mt-0">
            <AuctionLotsGrid
              auctionId={auction.id}
              onAddLot={() => router.push(`/admin/lots/new?auctionId=${auction.id}`)}
            />
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <AuctionAuditGrid auctionId={auction.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
