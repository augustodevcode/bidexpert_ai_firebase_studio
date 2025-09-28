// src/app/admin/lots/new/page.tsx
/**
 * @fileoverview Página para criação de um novo Lote.
 * Este componente Server-Side é responsável por buscar os dados iniciais
 * necessários para popular os seletores do formulário de lote, como categorias,
 * leilões, comitentes, e bens disponíveis. Ele renderiza o `LotForm` e passa a
 * ação `createLot` para persistir o novo registro.
 */
import LotForm from '../lot-form';
import { createLot, type LotFormData } from '../actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';
import { getAssets } from '@/app/admin/assets/actions'; // CORRIGIDO
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { LotCategory, Auction, StateInfo, CityInfo, Asset, SellerProfileInfo } from '@/types';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';

interface NewLotPageContentProps {
  categories: LotCategory[];
  auctions: Auction[];
  sellers: SellerProfileInfo[];
  states: StateInfo[];
  allCities: CityInfo[];
  availableAssets: Asset[];
  auctionIdFromQuery?: string;
}

function NewLotPageContent({ categories, auctions, sellers, states, allCities, availableAssets, auctionIdFromQuery }: NewLotPageContentProps) {
  async function handleCreateLot(data: Partial<LotFormData>) {
    'use server';
    return createLot(data);
  }

  return (
    <LotForm
      categories={categories}
      auctions={auctions}
      sellers={sellers}
      states={states}
      allCities={allCities}
      initialAvailableAssets={availableAssets}
      onSubmitAction={handleCreateLot}
      formTitle="Novo Lote"
      formDescription="Preencha os detalhes para criar um novo lote."
      submitButtonText="Criar Lote"
      defaultAuctionId={auctionIdFromQuery}
    />
  );
}

export default async function NewLotPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const auctionIdFromQuery = (searchParams && typeof searchParams.auctionId === 'string') ? searchParams.auctionId : undefined;
  
  const [categories, auctions, states, allCities, bens, sellers] = await Promise.all([
    getLotCategories(),
    getAuctions(),
    getStates(),
    getCities(),
    getAssets(), // CORRIGIDO - Fetch all available assets initially
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
        availableAssets={bens}
        auctionIdFromQuery={auctionIdFromQuery} 
      />
    </Suspense>
  );
}
