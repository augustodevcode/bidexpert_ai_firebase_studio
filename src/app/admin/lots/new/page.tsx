// src/app/admin/lots/new/page.tsx
import LotForm from '../lot-form';
import { createLot, type LotFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { LotCategory, Auction } from '@/types';

interface NewLotPageContentProps {
  categories: LotCategory[];
  auctions: Auction[];
  auctionIdFromQuery?: string;
}

function NewLotPageContent({ categories, auctions, auctionIdFromQuery }: NewLotPageContentProps) {
  async function handleCreateLot(data: LotFormData) {
    'use server';
    return createLot(data);
  }

  return (
    <LotForm
      onSubmitAction={handleCreateLot}
      categories={categories}
      auctions={auctions}
      initialAvailableBens={[]} // Initially empty, will fetch on auction selection
      formTitle="Novo Lote"
      formDescription="Preencha os detalhes para criar um novo lote."
      submitButtonText="Criar Lote"
      defaultAuctionId={auctionIdFromQuery}
    />
  );
}

export default async function NewLotPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const auctionIdFromQuery = (searchParams && typeof searchParams.auctionId === 'string') ? searchParams.auctionId : undefined;
  
  const [categories, auctions] = await Promise.all([
    getLotCategories(),
    getAuctions()
  ]);

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <NewLotPageContent 
        categories={categories} 
        auctions={auctions} 
        auctionIdFromQuery={auctionIdFromQuery} 
      />
    </Suspense>
  );
}
