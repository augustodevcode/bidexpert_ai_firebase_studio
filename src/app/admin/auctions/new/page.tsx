// src/app/admin/auctions/new/page.tsx
import AuctionForm from '../auction-form';
import { createAuction, type AuctionFormData } from '../actions';
import { getCategories } from '@/lib/data-queries';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';
import { getSellers } from '@/app/admin/sellers/actions';

export default async function NewAuctionPage() {
  const [categories, auctioneers, sellers] = await Promise.all([
      getCategories(),
      getAuctioneers(),
      getSellers()
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
      onSubmitAction={handleCreateAuction}
      formTitle="Novo Leilão"
      formDescription="Preencha os detalhes para criar um novo leilão."
      submitButtonText="Criar Leilão"
    />
  );
}
