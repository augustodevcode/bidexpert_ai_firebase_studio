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
import { Gavel } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import type { LotCategory, AuctioneerProfileInfo, SellerProfileInfo, StateInfo, CityInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';


interface NewAuctionPageContentProps {
  categories: LotCategory[];
  auctioneers: AuctioneerProfileInfo[];
  sellers: SellerProfileInfo[];
  states: StateInfo[];
  allCities: CityInfo[];
}

function NewAuctionPageContent({ categories, auctioneers, sellers, states, allCities }: NewAuctionPageContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSave = () => {
    formRef.current?.requestSubmit();
  }

  async function handleCreateAuction(data: Partial<AuctionFormData>) {
    setIsSubmitting(true);
    const result = await createAuction(data);
     if (result.success) {
      toast({ title: 'Sucesso!', description: 'Leilão criado. Você será redirecionado.' });
      router.push(result.auctionId ? `/admin/auctions/${result.auctionId}/edit` : '/admin/auctions');
    } else {
      toast({ title: 'Erro ao Criar', description: result.message, variant: 'destructive' });
      setIsSubmitting(false);
    }
  }

  return (
    <FormPageLayout
        formTitle="Novo Leilão"
        formDescription="Preencha os detalhes para cadastrar um novo leilão."
        icon={Gavel}
        isViewMode={false} // Always in edit mode for new page
        onSave={handleSave}
        isSubmitting={isSubmitting}
        onCancel={() => router.push('/admin/auctions')}
    >
        <AuctionForm
            ref={formRef}
            categories={categories}
            auctioneers={auctioneers}
            sellers={sellers}
            states={states}
            allCities={allCities}
            onSubmitAction={handleCreateAuction}
        />
    </FormPageLayout>
  );
}


export default function NewAuctionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<NewAuctionPageContentProps | null>(null);

  useEffect(() => {
    async function fetchData() {
        const [categories, auctioneers, sellers, states, cities] = await Promise.all([
          getLotCategories(),
          getAuctioneers(),
          getSellers(),
          getStates(),
          getCities(),
      ]);
      setData({categories, auctioneers, sellers, states, allCities: cities});
      setIsLoading(false);
    }
    fetchData();
  }, []);

  if (isLoading || !data) {
     return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  return <NewAuctionPageContent {...data} />;
}
