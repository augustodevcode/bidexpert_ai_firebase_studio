// src/app/admin/lots/[lotId]/edit/page.tsx
/**
 * @fileoverview Página de edição para um Lote específico.
 * Este componente Server-Side é responsável por buscar todos os dados necessários
 * para a edição de um lote, incluindo o próprio lote, categorias, leilões,
 * comitentes, bens disponíveis, estados e cidades. Ele então renderiza o
 * `LotForm` e passa as funções de ação para atualização e finalização do lote.
 */
'use client';

import { getLot, updateLot, finalizeLot } from '../../actions';
import { getAuction } from '@/app/admin/auctions/actions';
import LotForm, { type LotFormData } from '../../lot-form';
import { getAssetsForLotting } from '@/app/admin/assets/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions as getAllAuctions } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { notFound, useParams } from 'next/navigation';
import type { Lot, Auction, Asset, StateInfo, CityInfo, LotCategory, SellerProfileInfo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Loader2, Gavel, Repeat } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React, { useEffect, useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSellers } from '@/app/admin/sellers/actions';
import RelistLotModal from '../../relist-lot-modal';

export default function EditLotPage() {
  const params = useParams();
  const lotId = params.lotId as string;
  const { toast } = useToast();

  const [lot, setLot] = useState<Lot | null>(null);
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [allCities, setAllCities] = useState<CityInfo[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isRelistModalOpen, setIsRelistModalOpen] = useState(false);

  const fetchPageData = useCallback(async () => {
    if (!lotId) return;
    setIsLoading(true);
    try {
      const fetchedLot = await getLot(lotId);
      if (!fetchedLot) {
        notFound();
        return;
      }
      
      const parentAuction = await getAuction(fetchedLot.auctionId.toString());
      const filterForAssets = parentAuction?.auctionType === 'JUDICIAL' && parentAuction.judicialProcessId
        ? { judicialProcessId: parentAuction.judicialProcessId.toString() }
        : (parentAuction?.sellerId ? { sellerId: parentAuction.sellerId.toString() } : {});

      const [fetchedCategories, fetchedAuctions, fetchedStates, fetchedCities, fetchedAssets, fetchedSellers] = await Promise.all([
        getLotCategories(),
        getAllAuctions(),
        getStates(),
        getCities(),
        getAssetsForLotting(filterForAssets),
        getSellers(),
      ]);
      
      setLot(fetchedLot);
      setCategories(fetchedCategories);
      setAuctions(fetchedAuctions);
      setSellers(fetchedSellers);
      setStates(fetchedStates);
      setAllCities(fetchedCities);
      setAvailableAssets(fetchedAssets);

    } catch (error) {
      console.error("Error fetching lot data:", error);
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [lotId, toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleUpdateLot = async (data: Partial<LotFormData>) => {
    return updateLot(lotId, data);
  };
  
  const handleFinalizeLot = async () => {
    if (!lot) return;
    setIsFinalizing(true);
    const result = await finalizeLot(lot.id);
    if (result.success) {
      toast({ title: "Lote Finalizado!", description: result.message });
      fetchPageData();
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
    setIsFinalizing(false);
  };

  const handleRelistSuccess = (newLotId: string) => {
    toast({
      title: 'Lote Relistado com Sucesso!',
      description: 'O novo lote foi criado e o lote original foi atualizado.',
      action: (
        <Button asChild variant="secondary" size="sm">
          <Link href={`/admin/lots/${newLotId}/edit`}>Ver Novo Lote</Link>
        </Button>
      )
    });
    fetchPageData();
    setIsRelistModalOpen(false);
  };

  const canFinalize = lot && (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'ENCERRADO');
  const canRelist = lot && lot.status === 'NAO_VENDIDO';

  if (isLoading || !lot) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <div className="space-y-6">
        <LotForm
          initialData={lot}
          categories={categories}
          auctions={auctions}
          sellers={sellers}
          states={states}
          allCities={allCities}
          initialAvailableAssets={availableAssets}
          onSubmitAction={handleUpdateLot}
          formTitle="Editar Lote"
          formDescription="Modifique os detalhes do lote existente."
          submitButtonText="Salvar Alterações"
          defaultAuctionId={lot.auctionId.toString()}
          onSuccessCallback={fetchPageData}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {canFinalize && (
              <Card className="shadow-md">
                  <CardHeader>
                      <CardTitle className="text-lg flex items-center"><CheckCircle className="mr-2 h-5 w-5 text-primary"/> Finalização do Lote</CardTitle>
                      <CardDescription>Esta ação irá calcular o vencedor com base nos lances e encerrar o lote.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="secondary" disabled={isFinalizing}>
                            {isFinalizing ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Gavel className="mr-2 h-4 w-4" />}
                            Finalizar Lote e Declarar Vencedor
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Finalização?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação irá determinar o vencedor com base no lance mais alto, atualizar o status do lote para "Vendido" (ou "Não Vendido") e notificar o vencedor. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleFinalizeLot} className="bg-green-600 hover:bg-green-700">Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </CardContent>
              </Card>
          )}

          {canRelist && (
              <Card className="shadow-md">
                  <CardHeader>
                      <CardTitle className="text-lg flex items-center"><Repeat className="mr-2 h-5 w-5 text-primary"/> Relistar Lote Não Vendido</CardTitle>
                      <CardDescription>Crie um novo lote a partir deste para um leilão futuro, com a opção de aplicar um desconto.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button variant="secondary" onClick={() => setIsRelistModalOpen(true)}>
                          <Repeat className="mr-2 h-4 w-4" /> Relistar este Lote
                      </Button>
                  </CardContent>
              </Card>
          )}
        </div>
      </div>
      
      {isRelistModalOpen && (
        <RelistLotModal
          isOpen={isRelistModalOpen}
          onClose={() => setIsRelistModalOpen(false)}
          originalLot={lot}
          auctions={auctions}
          onRelistSuccess={handleRelistSuccess}
        />
      )}
    </>
  );
}
