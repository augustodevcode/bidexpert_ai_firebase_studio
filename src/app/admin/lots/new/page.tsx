// src/app/admin/lots/new/page.tsx
import LotForm from '../lot-form';
import { createLot, type LotFormData } from '../actions';
import { getCategories, getAuctions } from '@/lib/data-queries';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { getBens } from '@/app/admin/bens/actions';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { LotCategory, Auction, StateInfo, CityInfo, Bem } from '@/types';

interface NewLotPageContentProps {
  categories: LotCategory[];
  auctions: Auction[];
  states: StateInfo[];
  allCities: CityInfo[];
  availableBens: Bem[];
  auctionIdFromQuery?: string;
}

function NewLotPageContent({ categories, auctions, states, allCities, availableBens, auctionIdFromQuery }: NewLotPageContentProps) {
  async function handleCreateLot(data: LotFormData) {
    'use server';
    return createLot(data);
  }

  return (
    <LotForm
      onSubmitAction={handleCreateLot}
      categories={categories}
      auctions={auctions}
      states={states}
      allCities={allCities}
      initialAvailableBens={availableBens}
      formTitle="Novo Lote"
      formDescription="Preencha os detalhes para criar um novo lote."
      submitButtonText="Criar Lote"
      defaultAuctionId={auctionIdFromQuery}
    />
  );
}

export default async function NewLotPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const auctionIdFromQuery = (searchParams && typeof searchParams.auctionId === 'string') ? searchParams.auctionId : undefined;
  
  const [categories, auctions, states, allCities, bens] = await Promise.all([
    getCategories(),
    getAuctions(),
    getStates(),
    getCities(),
    getBens(), // Fetch all available bens initially
  ]);

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <NewLotPageContent 
        categories={categories} 
        auctions={auctions} 
        states={states}
        allCities={allCities}
        availableBens={bens}
        auctionIdFromQuery={auctionIdFromQuery} 
      />
    </Suspense>
  );
}
