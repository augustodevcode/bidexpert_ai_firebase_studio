// src/app/admin/lots/new/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import LotForm from '../lot-form';
import { createLot } from '../actions';
import type { LotFormData } from '@bidexpert/core';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { getBens } from '@/app/admin/bens/actions';
import { Suspense } from 'react';
import { Loader2, Package } from 'lucide-react';
import type { LotCategory, Auction, StateInfo, CityInfo, Bem, SellerProfileInfo } from '@bidexpert/core';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '../sellers/actions';
import FormPageLayout from '@/components/admin/form-page-layout';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface NewLotPageContentProps {
  categories: LotCategory[];
  auctions: Auction[];
  sellers: SellerProfileInfo[];
  states: StateInfo[];
  allCities: CityInfo[];
  availableBens: Bem[];
  auctionIdFromQuery?: string;
}

function NewLotPageContent({ categories, auctions, sellers, states, allCities, availableBens, auctionIdFromQuery }: NewLotPageContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSave = () => {
    formRef.current?.requestSubmit();
  }

  async function handleCreateLot(data: Partial<LotFormData>) {
    setIsSubmitting(true);
    const result = await createLot(data);
     if (result.success) {
      toast({ title: 'Sucesso!', description: 'Lote criado. Você será redirecionado.' });
      router.push(result.lotId ? `/admin/lots/${result.lotId}/edit` : '/admin/lots');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
      setIsSubmitting(false);
    }
  }

  return (
    <FormPageLayout
        formTitle="Novo Lote"
        formDescription="Preencha os detalhes para criar um novo lote e associe-o a um leilão."
        icon={Package}
        isViewMode={false}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        onCancel={() => router.push('/admin/lots')}
    >
        <LotForm
            ref={formRef}
            categories={categories}
            auctions={auctions}
            sellers={sellers}
            states={states}
            allCities={allCities}
            initialAvailableBens={availableBens}
            onSubmitAction={handleCreateLot}
            defaultAuctionId={auctionIdFromQuery}
        />
    </FormPageLayout>
  );
}


export default function NewLotPage() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [pageData, setPageData] = useState<NewLotPageContentProps | null>(null);

    useEffect(() => {
        async function loadData() {
            const auctionIdFromQuery = searchParams.get('auctionId') || undefined;
            const [categories, auctions, states, allCities, bens, sellers] = await Promise.all([
                getLotCategories(), getAuctions(), getStates(), getCities(), getBens(), getSellers(),
            ]);
            setPageData({ categories, auctions, states, allCities, availableBens: bens, sellers, auctionIdFromQuery });
            setIsLoading(false);
        }
        loadData();
    }, [searchParams]);

  if (isLoading || !pageData) {
     return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <NewLotPageContent {...pageData} />
    </Suspense>
  );
}
