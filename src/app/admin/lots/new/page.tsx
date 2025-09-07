// src/app/admin/lots/new/page.tsx
import LotForm from '../lot-form';
import { createLot, type LotFormData } from '../actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { getBens } from '@/app/admin/bens/actions';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { LotCategory, Auction, StateInfo, CityInfo, Bem, SellerProfileInfo } from '@/types';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '../sellers/actions';

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
  async function handleCreateLot(data: Partial<LotFormData>) {
    'use server';
    return createLot(data);
  }

  return (
     <div data-ai-id="admin-lot-form-card">
        <LotForm
          categories={categories}
          auctions={auctions}
          sellers={sellers}
          states={states}
          allCities={allCities}
          initialAvailableBens={availableBens}
          onSubmitAction={handleCreateLot}
          formTitle="Novo Lote"
          formDescription="Preencha os detalhes para criar um novo lote."
          submitButtonText="Criar Lote"
          defaultAuctionId={auctionIdFromQuery}
        />
     </div>
  );
}

export default async function NewLotPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const auctionIdFromQuery = (searchParams && typeof searchParams.auctionId === 'string') ? searchParams.auctionId : undefined;
  
  const [categories, auctions, states, allCities, bens, sellers] = await Promise.all([
    getLotCategories(),
    getAuctions(),
    getStates(),
    getCities(),
    getBens(), // Fetch all available bens initially
    getSellers(),
  ]);

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <NewLotPageContent 
        categories={categories} 
        auctions={auctions} 
        sellers={sellers}
        states={states}
        allCities={allCities}
        availableBens={bens}
        auctionIdFromQuery={auctionIdFromQuery} 
      />
    </Suspense>
  );
}
