
import LotForm from '../lot-form';
import { createLot, type LotFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions'; // Importar getStates
import { getCities } from '@/app/admin/cities/actions';   // Importar getCities
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { LotCategory, Auction, StateInfo, CityInfo } from '@/types';

interface NewLotPageContentProps {
  categories: LotCategory[];
  auctions: Auction[];
  states: StateInfo[];
  allCities: CityInfo[];
  auctionIdFromQuery?: string;
}

function NewLotPageContent({ categories, auctions, states, allCities, auctionIdFromQuery }: NewLotPageContentProps) {
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
      formTitle="Novo Lote"
      formDescription="Preencha os detalhes para criar um novo lote."
      submitButtonText="Criar Lote"
      defaultAuctionId={auctionIdFromQuery}
    />
  );
}

export default async function NewLotPage({ searchParams }: { searchParams?: { auctionId?: string } }) {
  const categories = await getLotCategories();
  const auctions = await getAuctions();
  const states = await getStates();
  const allCities = await getCities(); // Buscar todas as cidades
  const auctionIdFromQuery = searchParams?.auctionId;

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <NewLotPageContent 
        categories={categories} 
        auctions={auctions} 
        states={states}
        allCities={allCities}
        auctionIdFromQuery={auctionIdFromQuery} 
      />
    </Suspense>
  );
}

    