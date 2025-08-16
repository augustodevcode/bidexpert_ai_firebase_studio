// src/app/admin/lots/[lotId]/edit/page.tsx
'use client';

import LotForm from '../../lot-form';
import { getLot, updateLot, type LotFormData, finalizeLot } from '../../actions';
import { getBens as getBensForLotting } from '@/app/admin/bens/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions, getAuction } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import type { Lot, Auction, Bem, StateInfo, CityInfo, PlatformSettings, LotCategory, SellerProfileInfo } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileSignature, Loader2, Gavel } from 'lucide-react';
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
import { getSellers } from '@/app/admin/sellers/actions'; // Caminho corrigido

export default function EditLotPage() {
  const params = useParams();
  const lotId = params.lotId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [lot, setLot] = useState<Lot | null>(null);
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]); // Adicionar estado para sellers
  const [states, setStates] = useState<StateInfo[]>([]);
  const [allCities, setAllCities] = useState<CityInfo[]>([]);
  const [availableBens, setAvailableBens] = useState<Bem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const fetchPageData = useCallback(async () => {
    if (!lotId) return;
    setIsLoading(true);
    try {
      const fetchedLot = await getLot(lotId);
      if (!fetchedLot) {
        notFound();
        return;
      }
      
      const parentAuction = await getAuction(fetchedLot.auctionId);
      const filterForBens = parentAuction?.auctionType === 'JUDICIAL' && parentAuction.judicialProcessId
        ? { judicialProcessId: parentAuction.judicialProcessId }
        : (parentAuction?.sellerId ? { sellerId: parentAuction.sellerId } : {});

      const [fetchedCategories, fetchedAuctions, fetchedStates, fetchedCities, fetchedBens, fetchedSellers] = await Promise.all([
        getLotCategories(),
        getAuctions(),
        getStates(),
        getCities(),
        getBensForLotting(filterForBens),
        getSellers(), // Buscar sellers
      ]);
      
      setLot(fetchedLot);
      setCategories(fetchedCategories);
      setAuctions(fetchedAuctions);
      setSellers(fetchedSellers); // Setar sellers
      setStates(fetchedStates);
      setAllCities(fetchedCities);
      setAvailableBens(fetchedBens);

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
      fetchPageData(); // Re-fetch to update status
    } else {
      toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
    setIsFinalizing(false);
  };

  const canFinalize = lot && (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'ENCERRADO');

  if (isLoading || !lot) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
       <LotForm
          initialData={lot}
          categories={categories}
          auctions={auctions}
          sellers={sellers}
          states={states}
          allCities={allCities}
          initialAvailableBens={availableBens}
          onSubmitAction={handleUpdateLot}
          formTitle="Editar Lote"
          formDescription="Modifique os detalhes do lote existente."
          submitButtonText="Salvar Alterações"
          defaultAuctionId={lot.auctionId}
          onSuccessCallback={fetchPageData} // Pass callback to refetch data on success
        />
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
    </div>
  );
}
