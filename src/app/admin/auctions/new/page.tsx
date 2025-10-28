// src/app/admin/auctions/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Leilão.
 * Este componente de cliente busca os dados necessários para os seletores (categorias,
 * leiloeiros, etc.) e renderiza o `AuctionForm` para entrada de dados,
 * utilizando a server action `createAuction` para persistir o novo registro.
 */
'use client';

import AuctionForm from '../auction-form';
import { createAuction, type AuctionFormData } from '../actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Gavel, Loader2 } from 'lucide-react';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { AuctioneerProfileInfo, SellerProfileInfo, StateInfo, CityInfo, LotCategory, JudicialProcess } from '@/types';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getJudicialProcesses } from '@/app/admin/judicial-processes/actions';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import SellerForm from '@/app/admin/sellers/seller-form';
import { createSeller } from '@/app/admin/sellers/actions';
import AuctioneerForm from '@/app/admin/auctioneers/auctioneer-form';
import { createAuctioneer } from '@/app/admin/auctioneers/actions';
import JudicialProcessForm from '@/app/admin/judicial-processes/judicial-process-form';
import { createJudicialProcessAction } from '@/app/admin/judicial-processes/actions';
import CategoryForm from '@/app/admin/categories/category-form';
import { createLotCategory } from '@/app/admin/categories/actions';


function NewAuctionPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dependencies, setDependencies] = useState<{
    auctioneers: AuctioneerProfileInfo[],
    sellers: SellerProfileInfo[],
    states: StateInfo[],
    allCities: CityInfo[],
    categories: LotCategory[],
    judicialProcesses: JudicialProcess[]
  } | null>(null);

  const formRef = React.useRef<any>(null);

  const [subform, setSubform] = useState<'auctioneer' | 'seller' | 'judicialProcess' | 'category' | null>(null);

  const loadInitialData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [auctioneers, sellers, states, cities, categories, judicialProcesses] = await Promise.all([
        getAuctioneers(),
        getSellers(),
        getStates(),
        getCities(),
        getLotCategories(),
        getJudicialProcesses(),
      ]);
      setDependencies({ auctioneers, sellers, states, allCities: cities, categories, judicialProcesses });
    } catch (error) {
      toast({ title: "Erro ao Carregar Dados", description: "Não foi possível carregar os dados necessários para criar um leilão.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSave = async () => {
    if (formRef.current) {
        await formRef.current.requestSubmit();
    }
  };

  async function handleCreateAuction(data: AuctionFormData) {
    setIsSubmitting(true);
    const result = await createAuction(data);
    if (result.success && result.auctionId) {
      toast({ title: 'Sucesso!', description: 'Leilão criado com sucesso. Você será redirecionado para a edição.' });
      router.push(`/admin/auctions/${result.auctionId}/edit`);
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive'});
    }
    setIsSubmitting(false);
    return result;
  }
  
  if (isLoadingData || !dependencies) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  
  const handleAddNewEntity = (entity: 'auctioneer' | 'seller' | 'judicialProcess' | 'category') => {
    setSubform(entity);
  }

  const handleSubformSuccess = () => {
    setSubform(null);
    loadInitialData();
  }

  return (
     <>
        <FormPageLayout
            formTitle="Novo Leilão"
            formDescription="Preencha os detalhes para criar um novo leilão."
            icon={Gavel}
            isViewMode={false}
            isSubmitting={isSubmitting}
            isValid={formRef.current?.formState.isValid ?? false}
            onSave={handleSave}
            onCancel={() => router.push('/admin/auctions')}
        >
            <AuctionForm
                formRef={formRef}
                auctioneers={dependencies.auctioneers}
                sellers={dependencies.sellers}
                states={dependencies.states}
                allCities={dependencies.allCities}
                categories={dependencies.categories}
                judicialProcesses={dependencies.judicialProcesses}
                onSubmitAction={handleCreateAuction}
                onAddNewEntity={handleAddNewEntity}
                formTitle=''
                formDescription=''
            />
        </FormPageLayout>

        <CrudFormContainer
          isOpen={!!subform}
          onClose={() => setSubform(null)}
          title={`Novo(a) ${subform === 'auctioneer' ? 'Leiloeiro' : subform === 'seller' ? 'Comitente' : subform === 'judicialProcess' ? 'Processo Judicial' : 'Categoria'}`}
          description="Preencha os dados abaixo. Após salvar, este registro estará disponível para seleção."
        >
          {subform === 'seller' && (
              <SellerForm
                  allStates={dependencies.states}
                  allCities={dependencies.allCities}
                  judicialBranches={[]} 
                  onSubmitAction={(data) => createSeller(data)}
                  onSuccess={handleSubformSuccess}
                  onCancel={() => setSubform(null)}
              />
          )}
           {subform === 'auctioneer' && (
              <AuctioneerForm
                  allStates={dependencies.states}
                  allCities={dependencies.allCities}
                  onSubmitAction={(data) => createAuctioneer(data)}
                  onSuccess={handleSubformSuccess}
                  onCancel={() => setSubform(null)}
              />
          )}
           {subform === 'judicialProcess' && (
              <JudicialProcessForm
                  courts={[]} 
                  allDistricts={[]}
                  allBranches={[]}
                  sellers={dependencies.sellers}
                  onSubmitAction={(data) => createJudicialProcessAction(data)}
                  onSuccess={handleSubformSuccess}
                  onCancel={() => setSubform(null)}
                  formTitle=""
                  formDescription=""
              />
          )}
          {subform === 'category' && (
             <CategoryForm
                  onSubmitAction={(data) => createLotCategory(data)}
                  formTitle=""
                  formDescription=""
                  submitButtonText="Criar Categoria"
              />
          )}
        </CrudFormContainer>
     </>
  );
}


export default function NewAuctionPage() {
    return <NewAuctionPageContent />;
}