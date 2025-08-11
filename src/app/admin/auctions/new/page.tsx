// src/app/admin/auctions/new/page.tsx
import AuctionForm from '../auction-form';
import { createAuction, type AuctionFormData } from '../actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getStates } from '@/app/admin/states/actions';
import { getCities } from '@/app/admin/cities/actions';

export default async function NewAuctionPage() {
  const [categories, auctioneers, sellers, states, cities] = await Promise.all([
      getLotCategories(),
      getAuctioneers(),
      getSellers(),
      getStates(),
      getCities(),
  ]);

  async function handleCreateAuction(data: Partial<AuctionFormData>) {
    'use server';
    return createAuction(data);
  }

  return (
    <AuctionForm
      categories={categories}
      auctioneers={auctioneers}
      sellers={sellers}
      states={states}
      allCities={cities}
      onSubmitAction={handleCreateAuction}
      formTitle="Novo Leilão"
      formDescription="Preencha os detalhes para criar um novo leilão."
      submitButtonText="Criar Leilão"
    />
  );
}
