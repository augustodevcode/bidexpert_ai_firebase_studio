// src/app/admin/lots/[lotId]/edit/page.tsx
'use client';

import LotForm from '../../lot-form';
import { getLot, updateLot, type LotFormData, finalizeLot, deleteLot } from '../../actions'; 
import { getBens as getBensForLotting } from '@/app/admin/bens/actions'; 
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions, getAuction } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { notFound, useRouter, useParams } from 'next/navigation';
import type { Auction, Bem, StateInfo, CityInfo, PlatformSettings, LotCategory, SellerProfileInfo, UserProfileWithPermissions, AuctionDashboardData, UserWin } from '@bidexpert/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileSignature, Loader2, Gavel, Repeat, Layers, PlusCircle, BarChart3, Lightbulb } from 'lucide-react';
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
import React, { useEffect, useCallback, useState, useRef } from 'react'; 
import { useToast } from '@/hooks/use-toast';
import { getSellers } from '@/app/admin/sellers/actions';
import RelistLotModal from '../../relist-lot-modal'; // Importar o novo modal
import Link from 'next/link';
import { DataTable } from '@/components/ui/data-table';
import { createColumns as createLotColumns } from '@/app/admin/lots/columns';
import { Separator } from '@/components/ui/separator';
import FormPageLayout from '@/components/admin/form-page-layout';
import AISuggestionModal from '@/components/ai/ai-suggestion-modal';
import { fetchListingDetailsSuggestions } from '@/app/auctions/create/actions';
import { getPlatformSettings } from '@/app/admin/settings/actions';


export default function EditLotPage() {
  const params = useParams();
  const lotId = params.lotId as string;
  const router = useRouter();
  const { toast } = useToast();
  const formRef = React.useRef<any>(null);

  const [lot, setLot] = useState<Lot | null>(null);
  const [categories, setCategories] = useState<LotCategory[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [sellers, setSellers] = useState<SellerProfileInfo[]>([]);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [allCities, setAllCities] = useState<CityInfo[]>([]);
  const [availableBens, setAvailableBens] = useState<Bem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isRelistModalOpen, setIsRelistModalOpen] = useState(false); 
  const [isViewMode, setIsViewMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAISuggestionModalOpen, setIsAISuggestionModalOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

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

      const [fetchedCategories, fetchedAuctions, fetchedStates, fetchedCities, fetchedBens, fetchedSellers, settings] = await Promise.all([
        getLotCategories(),
        getAuctions(),
        getStates(),
        getCities(),
        getBensForLotting(filterForBens),
        getSellers(),
        getPlatformSettings(),
      ]);
      
      setLot(fetchedLot as Lot);
      setCategories(fetchedCategories);
      setAuctions(fetchedAuctions);
      setSellers(fetchedSellers);
      setStates(fetchedStates);
      setAllCities(fetchedCities);
      setAvailableBens(fetchedBens);
      setPlatformSettings(settings as PlatformSettings);

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
  
  const handleSave = () => {
    if (formRef.current) {
        formRef.current.requestSubmit();
    }
  }

  async function handleUpdateLot(data: Partial<LotFormData>) {
    setIsSubmitting(true);
    const result = await updateLot(lotId, data);
    setIsSubmitting(false);
    if (result.success) {
        toast({ title: "Sucesso!", description: "Lote atualizado." });
        fetchPageData();
        setIsViewMode(true);
    } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" });
    }
  }
  
  const handleDeleteLot = async () => {
    const result = await deleteLot(lotId, lot?.auctionId);
    if (result.success) {
      toast({ title: "Sucesso!", description: result.message });
      router.push(`/admin/auctions/${lot?.auctionId}/edit`);
    } else {
      toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
    }
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

  if (isLoading || !lot || !platformSettings) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="space-y-6">
        <FormPageLayout
            formTitle={isViewMode ? "Visualizar Lote" : "Editar Lote"}
            formDescription={lot.title}
            icon={Layers}
            isViewMode={isViewMode}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            onEnterEditMode={() => setIsViewMode(false)}
            onCancel={() => setIsViewMode(true)}
            onSave={handleSave}
            onDelete={handleDeleteLot}
        >
            <LotForm
              ref={formRef}
              initialData={lot}
              categories={categories}
              auctions={auctions}
              sellers={sellers}
              states={states}
              allCities={allCities}
              initialAvailableBens={availableBens}
              onSubmitAction={handleUpdateLot as any}
              onSuccessCallback={fetchPageData}
            />
        </FormPageLayout>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canFinalize && (
              <Card className="shadow-md">
                  <CardHeader>
                      <CardTitle className="text-lg flex items-center"><CheckCircle className="mr-2 h-5 w-5 text-primary"/> Finalização</CardTitle>
                      <CardDescription>Calcular o vencedor e encerrar o lote.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="secondary" disabled={isFinalizing}>
                            {isFinalizing ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Gavel className="mr-2 h-4 w-4" />}
                            Finalizar e Declarar Vencedor
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Confirmar Finalização?</AlertDialogTitle><AlertDialogDescription>Esta ação irá determinar o vencedor, atualizar o status e notificar o arrematante. Não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleFinalizeLot} className="bg-green-600 hover:bg-green-700">Confirmar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </CardContent>
              </Card>
          )}

          {canRelist && (
              <Card className="shadow-md">
                  <CardHeader>
                      <CardTitle className="text-lg flex items-center"><Repeat className="mr-2 h-5 w-5 text-primary"/> Relistar</CardTitle>
                      <CardDescription>Criar um novo lote a partir deste para um leilão futuro.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button variant="secondary" onClick={() => setIsRelistModalOpen(true)}>
                          <Repeat className="mr-2 h-4 w-4" /> Relistar este Lote
                      </Button>
                  </CardContent>
              </Card>
          )}

           <Card className="shadow-md">
              <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-primary"/> Otimização</CardTitle>
                  <CardDescription>Use a IA para otimizar o título e a descrição deste lote.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button variant="secondary" onClick={() => setIsAISuggestionModalOpen(true)}>Otimizar com IA</Button>
              </CardContent>
          </Card>
        </div>
      </div>
      
      {isRelistModalOpen && (
        <RelistLotModal isOpen={isRelistModalOpen} onClose={() => setIsRelistModalOpen(false)} originalLot={lot} auctions={auctions} onRelistSuccess={handleRelistSuccess} />
      )}
       <AISuggestionModal
        isOpen={isAISuggestionModalOpen}
        onClose={() => setIsAISuggestionModalOpen(false)}
        fetchSuggestionsAction={() => fetchListingDetailsSuggestions({
            auctionTitle: lot.title,
            auctionDescription: lot.description || '',
            auctionCategory: lot.categoryName || '',
            auctionKeywords: '',
        })}
        onApplySuggestions={(suggestions) => {
            if (formRef.current) {
                formRef.current.setValue('title', suggestions.suggestedTitle, { shouldDirty: true });
                formRef.current.setValue('description', suggestions.suggestedDescription, { shouldDirty: true });
                toast({ title: 'Sugestões aplicadas!' });
            }
        }}
      />
    </>
  );
}
