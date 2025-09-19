// src/app/admin/auctions/new/page.tsx
'use client';

import AuctionForm from '../auction-form';
import { createAuction, type AuctionFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { Gavel, Loader2 } from 'lucide-react';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, StateInfo, CityInfo } from '@/types';

function NewAuctionPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const formRef = useRef<any>(null);

  const loadInitialData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [categories, auctioneers, sellers, states, cities] = await Promise.all([
        getLotCategories(),
        getAuctioneers(),
        getSellers(),
        getStates(),
        getCities(),
      ]);
      setInitialData({ categories, auctioneers, sellers, states, allCities: cities });
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
        formRef.current.requestSubmit();
    }
  };

  async function handleCreateAuction(data: AuctionFormData) {
    setIsSubmitting(true);
    const result = await createAuction(data);
    if (result.success && result.auctionId) {
      toast({ title: 'Sucesso!', description: 'Leilão criado com sucesso.' });
      router.push(`/admin/auctions/${result.auctionId}/edit`);
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive'});
    }
    setIsSubmitting(false);
    return result;
  }
  
  if (isLoadingData) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div data-ai-id="admin-auction-form-card">
      <FormPageLayout
        formTitle="Novo Leilão"
        formDescription="Preencha os detalhes para criar um novo leilão."
        icon={Gavel}
        isViewMode={false}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onCancel={() => router.push('/admin/auctions')}
      >
        <AuctionForm
          formRef={formRef}
          categories={initialData.categories}
          auctioneers={initialData.auctioneers}
          sellers={initialData.sellers}
          states={initialData.states}
          allCities={initialData.allCities}
          onSubmitAction={handleCreateAuction}
          formTitle="" // Título e descrição já estão no layout
          formDescription=""
          submitButtonText="Criar Leilão"
          isViewMode={false}
          onUpdateSuccess={()=>{}} // Not used in create mode
          onCancelEdit={()=>{}} // Not used in create mode
        />
      </FormPageLayout>
    </div>
  );
}


export default function NewAuctionPage() {
    return <NewAuctionPageContent />;
}
